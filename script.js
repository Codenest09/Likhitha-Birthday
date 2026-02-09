// ===== Multi-Page Birthday Website - JavaScript =====

// ===== Global Variables =====
let currentPage = 0;
const totalPages = 6;
let isTransitioning = false;

// Memory Carousel Variables
let currentMemory = 0;
const totalMemories = 9;
let memoryTouchStartX = 0;

// ===== Sound Effects Manager =====
const SoundManager = {
    audioContext: null,
    enabled: true,

    init() {
        // Create audio context on first user interaction
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    },

    // Play a cute "ding" sound for button clicks
    playDing() {
        if (!this.enabled) return;
        const ctx = this.init();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    },

    // Play magical whoosh for page transitions
    playWhoosh() {
        if (!this.enabled) return;
        const ctx = this.init();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    },

    // Play sparkle/twinkle sound for celebrations
    playSparkle() {
        if (!this.enabled) return;
        const ctx = this.init();
        if (ctx.state === 'suspended') ctx.resume();

        const notes = [1047, 1319, 1568, 2093]; // C6, E6, G6, C7 - magical arpeggio

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            const startTime = ctx.currentTime + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    },

    // Play poof sound for candle blow
    playPoof() {
        if (!this.enabled) return;
        const ctx = this.init();
        if (ctx.state === 'suspended') ctx.resume();

        // White noise burst for poof
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }

        const noise = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        noise.start(ctx.currentTime);
    },

    // Play celebration fanfare
    playFanfare() {
        if (!this.enabled) return;
        const ctx = this.init();
        if (ctx.state === 'suspended') ctx.resume();

        const melody = [
            { freq: 523, time: 0, dur: 0.15 },     // C5
            { freq: 659, time: 0.15, dur: 0.15 },  // E5
            { freq: 784, time: 0.3, dur: 0.15 },   // G5
            { freq: 1047, time: 0.45, dur: 0.4 },  // C6
        ];

        melody.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

            gain.gain.setValueAtTime(0.25, ctx.currentTime + note.time);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + note.dur);

            osc.start(ctx.currentTime + note.time);
            osc.stop(ctx.currentTime + note.time + note.dur);
        });
    }
};

// Typewriter Effect removed

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initParticleCanvas();
    initPageIndicators();
    initKeyboardNav();
    initTouchSwipe();
    initMemoryCarousel();
    // TypewriterEffect removed
    initCountdown();
    initCake();
    initAllButtons();  // Initialize all nav buttons first
    initMusic(); // Initialize background music
});

// ===== Background Music Manager =====
function initMusic() {
    const music = document.getElementById('bgMusic');

    // Set initial volume
    music.volume = 0.5;

    // Attach to document to catch the event even if button is cloned
    document.addEventListener('click', function (e) {
        if (e.target.closest('#startBtn')) {
            music.play().then(() => {
                console.log('Music started successfully');
            }).catch(err => {
                console.log('Music play failed:', err);
            });
        }
    });
}

// ===== Initialize All Button Event Listeners =====
function initAllButtons() {
    console.log('=== initAllButtons called ===');

    // Attach listeners to ALL nav buttons (not just ones in cake section)
    document.querySelectorAll('.nav-btn').forEach((btn, index) => {
        // Clone to remove old listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // Add event listener
        newBtn.addEventListener('click', function (e) {
            // Only prevent default if it's a link, but for buttons we might need it?
            // Actually, for a button element, preventDefault stops form submission or focus. 
            // But if the click isn't firing, maybe something else is wrong.
            // Let's TRY removing preventDefault for click to be safe, or just keep stopPropagation.
            e.stopPropagation();
            console.log('Nav button clicked:', index, 'classes:', this.className);

            if (this.classList.contains('next-btn') || this.classList.contains('glow-btn')) {
                console.log('nextPage called from button click');
                nextPage();
            } else if (this.classList.contains('prev-btn')) {
                console.log('prevPage called from button click');
                prevPage();
            }
        });

        // Also handle pointer events - BE CAREFUL here. 
        // pointerdown might fire before click. If we preventDefault here, click might not fire?
        // Let's REMOVE preventDefault from pointerdown.
        newBtn.addEventListener('pointerdown', function (e) {
            // e.preventDefault(); // Removed this as it might block 'click' on some devices
            console.log('Pointer down');
        });

        // Touch support
        newBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.classList.contains('next-btn') || this.classList.contains('glow-btn')) {
                nextPage();
            } else if (this.classList.contains('prev-btn')) {
                prevPage();
            }
        });
    });

    console.log('Total nav buttons initialized:', document.querySelectorAll('.nav-btn').length);
}

// ===== Attach All Button Event Listeners =====
// ===== Attach All Button Event Listeners =====
function initCake() {
    console.log('initCake called');

    // Get the blow button
    const blowBtn = document.getElementById('blowCandlesBtn');
    console.log('Blow button found:', !!blowBtn);

    // FIX FOR PC/LAPTOP: Direct click event with proper error handling
    if (blowBtn) {
        // Remove any previous listeners to avoid duplication
        const newBtn = blowBtn.cloneNode(true);
        blowBtn.parentNode.replaceChild(newBtn, blowBtn);

        // Add click listener to cloned button
        newBtn.addEventListener('click', function (e) {
            // e.preventDefault(); // Removed for laptop compatibility
            e.stopPropagation();
            console.log('Blow button clicked via listener');
            blowCandlesNew();
        });

        // Also handle pointer down for immediate feedback
        newBtn.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            console.log('Blow button pointer down');
        });
    }

    // Handle individual candle clicks
    const flames = document.querySelectorAll('.flame');
    flames.forEach((flame, index) => {
        flame.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Candle clicked:', index + 1);
            blowSingleCandle(index);
        });

        flame.addEventListener('pointerdown', function (e) {
            e.preventDefault();
        });
    });

    // Add touch support for blow button specifically (for mobile tap)
    if (blowBtn) {
        blowBtn.addEventListener('touchend', function (e) {
            console.log('Blow button touched');
            e.preventDefault(); // Prevent mouse emulation
            blowCandlesNew();
        });
    }
}

// Track candles state
let candlesBlownNew = false;
let candlesBlowCount = 0;

// Blow individual candle with animation
function blowSingleCandle(index) {
    if (candlesBlownNew) return;

    const flames = document.querySelectorAll('.flame');
    const flame = flames[index];

    if (flame && !flame.classList.contains('blown')) {
        flame.classList.add('blown');
        candlesBlowCount++;

        // Sound effect
        try {
            SoundManager.playPoof();
        } catch (e) {
            console.log('Sound error (ignored):', e);
        }

        // If all candles blown, trigger success
        if (candlesBlowCount === flames.length) {
            setTimeout(() => {
                triggerWishSuccess();
            }, 400);
        }
    }
}

// New simplified blow candles function
function blowCandlesNew() {
    console.log('blowCandlesNew called, candlesBlownNew:', candlesBlownNew);
    if (candlesBlownNew) return;

    try {
        SoundManager.playPoof();
    } catch (e) {
        console.log('Sound error (ignored):', e);
    }

    // Blow all candles at once
    const flames = document.querySelectorAll('.flame');
    flames.forEach((flame, index) => {
        setTimeout(() => {
            if (!flame.classList.contains('blown')) {
                flame.classList.add('blown');
            }
        }, index * 100);
    });

    const candles = document.getElementById('cakeCandles');
    const blowBtn = document.getElementById('blowCandlesBtn');

    if (candles) {
        setTimeout(() => {
            candles.classList.add('blown');
        }, 300);
    }

    if (blowBtn) {
        blowBtn.classList.add('hidden');
    }

    setTimeout(() => {
        triggerWishSuccess();
    }, 700);

    candlesBlownNew = true;
    console.log('Candles blown successfully!');
}

// Trigger wish success message and effects
function triggerWishSuccess() {
    const wishMessage = document.getElementById('wishSuccessMessage');

    if (wishMessage) {
        wishMessage.classList.add('show');
    }

    try {
        createMegaConfetti();
        SoundManager.playFanfare();
    } catch (e) {
        console.log('Celebration effect error (ignored):', e);
    }
}

// ===== Initialize Wishes Page =====
// ===== Birthday Age Timer =====
function initCountdown() {
    // Likhitha's birth date: February 10th, 2011 at 6:50 AM
    const birthDate = new Date(2011, 1, 10, 6, 50, 0); // Month is 0-indexed, so February = 1

    // Show countdown container
    const container = document.getElementById('countdownContainer');
    if (container) {
        container.style.display = 'block';
    }

    // Update the label text
    const countdownLabel = document.querySelector('.countdown-label');
    if (countdownLabel) {
        countdownLabel.innerHTML = '✨ You are now ✨';
    }

    // Store previous values to detect changes
    let prevValues = { years: -1, months: -1, days: -1, hours: -1 };

    function updateCountdown() {
        const now = new Date();

        // Calculate years
        let years = now.getFullYear() - birthDate.getFullYear();
        let months = now.getMonth() - birthDate.getMonth();
        let days = now.getDate() - birthDate.getDate();
        let hours = now.getHours() - birthDate.getHours();

        // Adjust hours
        if (hours < 0) {
            hours += 24;
            days--;
        }

        // Adjust days
        if (days < 0) {
            // Get days in the previous month
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
            months--;
        }

        // Adjust months
        if (months < 0) {
            months += 12;
            years--;
        }

        // Update with animation
        updateNumber('countDays', years, prevValues.years);      // Years
        updateNumber('countHours', months, prevValues.months);    // Months
        updateNumber('countMinutes', days, prevValues.days);      // Days
        updateNumber('countSeconds', hours, prevValues.hours);    // Hours

        prevValues = { years, months, days, hours };
    }

    function updateNumber(id, value, prevValue) {
        const el = document.getElementById(id);
        if (!el) return;

        const displayValue = String(value).padStart(2, '0');

        if (value !== prevValue) {
            el.classList.add('flip');
            setTimeout(() => {
                el.textContent = displayValue;
                el.classList.remove('flip');
            }, 300);
        } else {
            el.textContent = displayValue;
        }
    }

    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ===== Loader =====
function initLoader() {
    const loader = document.getElementById('loader');

    setTimeout(() => {
        loader.classList.add('hidden');
        createWelcomeConfetti();
    }, 2000);
}

// ===== Particle Canvas =====
function initParticleCanvas() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const particles = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            hue: Math.random() * 60 + 300 // Pink to purple range
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            // Move
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 80%, ${p.opacity})`;
            ctx.fill();

            // Glow effect
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 80%, ${p.opacity * 0.3})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// ===== Page Navigation =====
function nextPage() {
    console.log('nextPage called, currentPage:', currentPage, 'isTransitioning:', isTransitioning);
    try {
        if (isTransitioning || currentPage >= totalPages - 1) return;
        SoundManager.playDing();
        goToPage(currentPage + 1, 'next');
    } catch (e) {
        console.error('Error in nextPage:', e);
        // Still try to navigate even if sound fails
        goToPage(currentPage + 1, 'next');
    }
}

function prevPage() {
    console.log('prevPage called, currentPage:', currentPage, 'isTransitioning:', isTransitioning);
    try {
        if (isTransitioning || currentPage <= 0) return;
        SoundManager.playDing();
        goToPage(currentPage - 1, 'prev');
    } catch (e) {
        console.error('Error in prevPage:', e);
        // Still try to navigate even if sound fails
        goToPage(currentPage - 1, 'prev');
    }
}

function goToPage(pageIndex, direction = 'next') {
    if (isTransitioning || pageIndex === currentPage) return;
    isTransitioning = true;

    // Play whoosh sound
    SoundManager.playWhoosh();

    const currentEl = document.getElementById(`page${currentPage}`);
    const targetEl = document.getElementById(`page${pageIndex}`);

    // Exit animation for current page
    currentEl.classList.remove('active');
    currentEl.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');

    // Enter animation for target page
    setTimeout(() => {
        currentEl.classList.remove('exit-left', 'exit-right');
        targetEl.classList.add('active');

        // Update page indicator
        updatePageIndicator(pageIndex);

        // Update current page
        currentPage = pageIndex;

        // Create transition effect
        createPageTransitionEffect();

        isTransitioning = false;
    }, 300);
}

function restartJourney() {
    goToPage(0, 'prev');
}

// ===== Page Indicators =====
function initPageIndicators() {
    const dots = document.querySelectorAll('.dot');

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetPage = parseInt(dot.dataset.page);
            const direction = targetPage > currentPage ? 'next' : 'prev';
            goToPage(targetPage, direction);
        });
    });
}

function updatePageIndicator(pageIndex) {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === pageIndex);
    });
}

// ===== Keyboard Navigation =====
function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            prevPage();
        }
    });
}

// ===== Touch Swipe =====
function initTouchSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Require significant horizontal swipe
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                nextPage();
            } else {
                prevPage();
            }
        }
    }, { passive: true });
}

// ===== Page Transition Effect =====
function createPageTransitionEffect() {
    const sparkles = ['✨', '⭐', '💕', '🌸'];

    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                font-size: ${Math.random() * 1.5 + 1}rem;
                pointer-events: none;
                z-index: 1000;
                animation: sparkleTransition 0.8s ease-out forwards;
            `;
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 800);
        }, i * 30);
    }
}

// Add transition animation
const transitionStyle = document.createElement('style');
transitionStyle.textContent = `
    @keyframes sparkleTransition {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0) translateY(-50px); }
    }
`;
document.head.appendChild(transitionStyle);

// ===== Enhanced Confetti System =====
function createWelcomeConfetti() {
    const emojis = ['🌸', '💙', '✨', '🎀', '💕', '⭐', '☁️', '🎉', '🐰', '💖', '🌟', '🎊'];

    // Play fanfare sound
    SoundManager.playFanfare();

    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            const startX = Math.random() * 100;
            const windOffset = (Math.random() - 0.5) * 30; // Wind effect
            const rotation = Math.random() * 720 + 360;
            const duration = Math.random() * 2 + 3;
            const size = Math.random() * 1.5 + 0.8;

            confetti.style.cssText = `
                position: fixed;
                top: -10%;
                left: ${startX}vw;
                font-size: ${size}rem;
                pointer-events: none;
                z-index: 9999;
                animation: confettiFallEnhanced ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                --wind: ${windOffset}vw;
                --rotation: ${rotation}deg;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), duration * 1000 + 500);
        }, i * 50);
    }
}

// Mega confetti for special celebrations (candles, gift)
function createMegaConfetti() {
    const emojis = ['🎉', '🎊', '✨', '💫', '⭐', '🌟', '💕', '💖', '🎀', '🌸'];

    // Burst from center
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            const angle = (i / 40) * Math.PI * 2;
            const velocity = 100 + Math.random() * 100;
            const endX = Math.cos(angle) * velocity;
            const endY = Math.sin(angle) * velocity - 50;

            confetti.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                font-size: ${Math.random() * 1.5 + 1}rem;
                pointer-events: none;
                z-index: 10000;
            `;

            document.body.appendChild(confetti);

            confetti.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) scale(1) rotate(${Math.random() * 720}deg)`,
                    opacity: 0
                }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            setTimeout(() => confetti.remove(), 1500);
        }, i * 25);
    }
}

// Add enhanced confetti animation
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFallEnhanced {
        0% { 
            transform: translateY(0) translateX(0) rotate(0deg) scale(0.5); 
            opacity: 0; 
        }
        10% {
            opacity: 1;
            transform: translateY(10vh) translateX(calc(var(--wind) * 0.2)) rotate(calc(var(--rotation) * 0.1)) scale(1);
        }
        100% { 
            transform: translateY(110vh) translateX(var(--wind)) rotate(var(--rotation)) scale(0.8); 
            opacity: 0; 
        }
    }
`;
document.head.appendChild(confettiStyle);

// ===== Memory Carousel =====
function initMemoryCarousel() {
    const carousel = document.getElementById('memoryCarousel');
    if (!carousel) return;

    // Initialize dot click handlers
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            goToMemory(slideIndex);
        });
    });

    // Touch swipe for carousel
    const trackContainer = document.querySelector('.carousel-track-container');
    if (trackContainer) {
        trackContainer.addEventListener('touchstart', (e) => {
            memoryTouchStartX = e.touches[0].clientX;
        }, { passive: true });

        trackContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - memoryTouchStartX;

            if (Math.abs(deltaX) > 50) {
                if (deltaX < 0) {
                    nextMemory();
                } else {
                    prevMemory();
                }
            }
        }, { passive: true });
    }
}

function nextMemory() {
    if (currentMemory >= totalMemories - 1) {
        // Loop to first
        goToMemory(0);
    } else {
        goToMemory(currentMemory + 1);
    }
}

function prevMemory() {
    if (currentMemory <= 0) {
        // Loop to last
        goToMemory(totalMemories - 1);
    } else {
        goToMemory(currentMemory - 1);
    }
}

function goToMemory(index) {
    const track = document.getElementById('carouselTrack');
    const slides = document.querySelectorAll('.memory-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    if (!track || !slides.length) return;

    // Update current memory index
    currentMemory = index;

    // Move track
    const slideWidth = 320;
    track.style.transform = `translateX(-${currentMemory * slideWidth}px)`;

    // Update active slide
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentMemory);
    });

    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentMemory);
    });

    // Create sparkle effect on slide change
    createMemorySparkle();
}

function createMemorySparkle() {
    const emojis = ['💕', '✨', '📸', '💙', '🌸'];

    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            sparkle.style.cssText = `
                position: fixed;
                left: 50%;
                top: 40%;
                font-size: 1.2rem;
                pointer-events: none;
                z-index: 1000;
            `;

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;

            document.body.appendChild(sparkle);

            sparkle.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(1)`,
                    opacity: 0
                }
            ], {
                duration: 600,
                easing: 'ease-out'
            });

            setTimeout(() => sparkle.remove(), 600);
        }, i * 50);
    }
}

// ===== Cake Interaction =====
let candlesBlown = false;

function blowCandles() {
    console.log('blowCandles called, candlesBlown:', candlesBlown);
    try {
        if (candlesBlown) return;

        // Play poof sound
        SoundManager.playPoof();

        const flames = document.querySelectorAll('.flame');
        const cakeHint = document.getElementById('cakeHint');
        const wishMessage = document.getElementById('wishMessage');

        flames.forEach((flame, i) => {
            setTimeout(() => {
                flame.classList.add('out');
            }, i * 150);
        });

        setTimeout(() => {
            cakeHint.style.display = 'none';
            wishMessage.classList.add('show');
            createWishCelebration();
            createMegaConfetti(); // Mega confetti burst!
            SoundManager.playFanfare(); // Play celebration fanfare
        }, 600);

        candlesBlown = true;
    } catch (e) {
        console.error('Error in blowCandles:', e);
    }
}

function createWishCelebration() {
    const emojis = ['🌟', '✨', '💫', '⭐', '🎉', '💕'];

    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            star.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                font-size: ${Math.random() * 1.5 + 1}rem;
                pointer-events: none;
                z-index: 1000;
            `;

            const angle = (i / 25) * Math.PI * 2;
            const distance = 80 + Math.random() * 120;

            document.body.appendChild(star);

            star.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(1)`,
                    opacity: 0
                }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });

            setTimeout(() => star.remove(), 1000);
        }, i * 40);
    }
}

// ===== Gift Box =====
let giftOpened = false;

function openGift() {
    if (giftOpened) return;

    // Play sparkle sound
    SoundManager.playSparkle();

    const giftBox = document.getElementById('giftBox');
    const giftReveal = document.getElementById('giftReveal');
    const giftHint = document.getElementById('giftHint');

    giftBox.classList.add('opened');

    setTimeout(() => {
        if (giftHint) giftHint.style.display = 'none';
        giftReveal.classList.add('show');
        createGiftBurst();
        SoundManager.playFanfare(); // Play celebration fanfare
    }, 600);

    giftOpened = true;
}

function createGiftBurst() {
    const emojis = ['💖', '💕', '✨', '🌟', '💙', '🎀', '🌸'];

    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const burst = document.createElement('div');
            burst.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            burst.style.cssText = `
                position: fixed;
                top: 40%;
                left: 50%;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 1000;
            `;

            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 100;

            document.body.appendChild(burst);

            burst.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance - 50}px)) scale(1)`,
                    opacity: 0
                }
            ], {
                duration: 1200,
                easing: 'ease-out'
            });

            setTimeout(() => burst.remove(), 1200);
        }, i * 30);
    }
}

// ===== Cinnamoroll Love Burst =====
function createLoveBurst(event) {
    const messages = [
        '💙 Love you, sis!',
        '✨ You are amazing!',
        '🌟 Shine bright!',
        '💕 Best sister ever!',
        '🎀 Stay beautiful!',
        '☁️ Dream big!',
        '🐰 Hugs for you!'
    ];

    // Show floating message
    const msg = document.createElement('div');
    msg.textContent = messages[Math.floor(Math.random() * messages.length)];
    msg.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 20px 40px;
        border-radius: 40px;
        font-family: 'Great Vibes', cursive;
        font-size: 2rem;
        color: #ff69b4;
        z-index: 10000;
        border: 3px solid #ffb6c1;
        box-shadow: 0 15px 50px rgba(255, 182, 193, 0.5);
        animation: loveMsgPop 2s ease forwards;
    `;

    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);

    // Create hearts burst
    const hearts = ['💕', '💖', '💙', '✨', '🌟'];
    for (let i = 0; i < 12; i++) {
        const heart = document.createElement('div');
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.cssText = `
            position: fixed;
            top: 45%;
            left: 50%;
            font-size: 1.5rem;
            pointer-events: none;
            z-index: 9999;
        `;

        const angle = (i / 12) * Math.PI * 2;

        document.body.appendChild(heart);

        heart.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(angle) * 80}px), calc(-50% + ${Math.sin(angle) * 80}px)) scale(1)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        });

        setTimeout(() => heart.remove(), 800);
    }
}

// Add love message animation
const loveStyle = document.createElement('style');
loveStyle.textContent = `
    @keyframes loveMsgPop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        30% { transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -70%) scale(0.9); }
    }
`;
document.head.appendChild(loveStyle);

// ===== Music Toggle =====
let isPlaying = false;

function toggleMusic() {
    const music = document.getElementById('bgMusic');
    const btn = document.getElementById('musicBtn');

    if (isPlaying) {
        music.pause();
        btn.classList.remove('playing');
        btn.querySelector('.music-icon').textContent = '🎵';
    } else {
        music.play().catch(err => console.log('Audio blocked:', err));
        btn.classList.add('playing');
        btn.querySelector('.music-icon').textContent = '🎶';
    }

    isPlaying = !isPlaying;
}

// ===== Cursor Sparkle Trail =====
let lastSparkleTime = 0;

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkleTime < 80) return;
    lastSparkleTime = now;

    const sparkle = document.createElement('div');
    sparkle.textContent = '✨';
    sparkle.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        font-size: 0.9rem;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
    `;

    document.body.appendChild(sparkle);

    sparkle.animate([
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0) translateY(-20px)' }
    ], {
        duration: 600,
        easing: 'ease-out'
    });

    setTimeout(() => sparkle.remove(), 600);
});

// ===== Touch Hearts =====
document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];

    const heart = document.createElement('div');
    heart.textContent = '💕';
    heart.style.cssText = `
        position: fixed;
        left: ${touch.clientX}px;
        top: ${touch.clientY}px;
        font-size: 2rem;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
    `;

    document.body.appendChild(heart);

    heart.animate([
        { opacity: 1, transform: 'translate(-50%, -50%) scale(0.5)' },
        { opacity: 0, transform: 'translate(-50%, -100%) scale(1.2)' }
    ], {
        duration: 800,
        easing: 'ease-out'
    });

    setTimeout(() => heart.remove(), 800);
}, { passive: true });

// ===== Plushie Click =====
document.querySelectorAll('.plushie').forEach(plushie => {
    plushie.addEventListener('click', () => {
        plushie.animate([
            { transform: 'scale(1) rotate(0deg)' },
            { transform: 'scale(1.4) rotate(15deg)' },
            { transform: 'scale(1) rotate(0deg)' }
        ], {
            duration: 400,
            easing: 'ease-in-out'
        });
    });
});

// ===== Console Easter Egg =====
console.log('%c🎂 Happy Birthday! 🎂', 'font-size: 24px; color: #ff69b4;');
console.log('%c💙 Made with love! 💙', 'font-size: 16px; color: #89cff0;');

// ===== TREASURE HUNT GAME =====
const TreasureHunt = {
    currentQuestion: 1,
    pins: {
        1: '1002',
        2: '2409',
        3: '0512'
    },
    completed: false,

    init() {
        // Initialize PIN input handlers
        document.querySelectorAll('.pin-inputs').forEach(container => {
            const inputs = container.querySelectorAll('.pin-digit');

            inputs.forEach((input, index) => {
                // Handle input
                input.addEventListener('input', (e) => {
                    const value = e.target.value;

                    // Only allow digits
                    if (!/^\d*$/.test(value)) {
                        e.target.value = '';
                        return;
                    }

                    // Add filled class
                    if (value) {
                        input.classList.add('filled');
                        // Move to next input
                        if (index < 3 && value) {
                            inputs[index + 1].focus();
                        }
                    } else {
                        input.classList.remove('filled');
                    }
                });

                // Handle backspace
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !input.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                    // Handle Enter to check PIN
                    if (e.key === 'Enter') {
                        const questionNum = container.dataset.question;
                        checkPin(parseInt(questionNum));
                    }
                });

                // Handle paste
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);

                    pastedData.split('').forEach((char, i) => {
                        if (inputs[i]) {
                            inputs[i].value = char;
                            inputs[i].classList.add('filled');
                        }
                    });

                    if (pastedData.length === 4) {
                        inputs[3].focus();
                    }
                });
            });
        });
    },

    getPin(questionNum) {
        const inputs = document.querySelectorAll(`.pin-inputs[data-question="${questionNum}"] .pin-digit`);
        let pin = '';
        inputs.forEach(input => {
            pin += input.value;
        });
        return pin;
    },

    showError(questionNum) {
        const error = document.getElementById(`error${questionNum}`);
        const inputs = document.querySelectorAll(`.pin-inputs[data-question="${questionNum}"] .pin-digit`);

        // Show error message
        error.classList.add('visible');

        // Shake inputs
        inputs.forEach(input => {
            input.classList.add('error');
            setTimeout(() => {
                input.classList.remove('error');
            }, 500);
        });

        // Hide error after 2 seconds
        setTimeout(() => {
            error.classList.remove('visible');
        }, 2000);
    },

    unlockNext(questionNum) {
        // Play success sound
        SoundManager.playSparkle();

        // Mark current card as completed
        const currentCard = document.getElementById(`question${questionNum}`);
        currentCard.classList.remove('active');
        currentCard.classList.add('completed');

        // Update progress
        const step = document.getElementById(`step${questionNum}`);
        step.classList.add('completed');
        step.querySelector('.step-icon').textContent = '✅';

        // Determine next card
        if (questionNum < 3) {
            // Show next question
            setTimeout(() => {
                const nextCard = document.getElementById(`question${questionNum + 1}`);
                nextCard.classList.add('active');
                this.currentQuestion = questionNum + 1;
            }, 500);
        } else {
            // Show final message
            setTimeout(() => {
                const finalCard = document.getElementById('finalMessage');
                finalCard.classList.add('active');

                // Update final progress step
                const finalStep = document.getElementById('step3');
                finalStep.classList.add('completed');
                finalStep.querySelector('.step-icon').textContent = '🎉';

                // Celebration effects
                createMegaConfetti();
                SoundManager.playFanfare();
                this.completed = true;
            }, 500);
        }
    },

    check(questionNum) {
        const enteredPin = this.getPin(questionNum);
        const correctPin = this.pins[questionNum];

        if (enteredPin.length !== 4) {
            this.showError(questionNum);
            return;
        }

        if (enteredPin === correctPin) {
            this.unlockNext(questionNum);
        } else {
            this.showError(questionNum);
        }
    }
};

// Global function for button onclick
function checkPin(questionNum) {
    TreasureHunt.check(questionNum);
}

// Initialize treasure hunt when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    TreasureHunt.init();
});