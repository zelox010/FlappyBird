class SelfieFlappyGame {
    constructor() {
        this.currentScreen = 'landing';
        this.userPhoto = null;
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.bestScore = 0;
        this.audioEnabled = true;
        this.cameraStream = null;
        this.inputEnabled = true;
        this.lastFlapTime = 0;
        
        // Game states from provided data
        this.gameStates = {
            MENU: 'menu',
            CAMERA: 'camera',
            UPLOAD: 'upload', 
            COMPLIMENT: 'compliment',
            READY: 'ready',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver'
        };
        
        this.currentGameState = this.gameStates.MENU;
        
        // Enhanced game settings from provided data
        this.gameSettings = {
            gravity: 0.4,
            flapStrength: -9,
            terminalVelocity: 8,
            pipeSpeed: 1.8,
            minPipeGap: 170,
            maxPipeGap: 230,
            birdSize: 50
        };
        
        // Compliments array
        this.compliments = [
            "Damn, looking fine!",
            "Iconic energy, i see",
            "100% snack, imma eat you tonight fr..",
            "lookin pretty",
            "Main character vibes!",
            "Pure magic, you fell from heaven or smth?",
            "Total knockout",
            "Certified stunner frfr",
            "Shit... kinda blind now cause of your beauty ",
            "Absolutely gorgeous"
        ];
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudio();
        this.loadBestScore();
    }
    
    initializeElements() {
        // Screen elements
        this.screens = {
            landing: document.getElementById('landingScreen'),
            camera: document.getElementById('cameraScreen'),
            upload: document.getElementById('uploadScreen'),
            compliment: document.getElementById('complimentScreen'),
            game: document.getElementById('gameScreen'),
            gameOver: document.getElementById('gameOverScreen')
        };
        
        // Button elements
        this.buttons = {
            useCamera: document.getElementById('useCameraBtn'),
            uploadPhoto: document.getElementById('uploadPhotoBtn'),
            backFromCamera: document.getElementById('backFromCameraBtn'),
            capture: document.getElementById('captureBtn'),
            uploadInstead: document.getElementById('uploadInsteadBtn'),
            backFromUpload: document.getElementById('backFromUploadBtn'),
            pause: document.getElementById('pauseBtn'),
            audioToggle: document.getElementById('audioToggleBtn'),
            resume: document.getElementById('resumeBtn'),
            quit: document.getElementById('quitBtn'),
            tryAgain: document.getElementById('tryAgainBtn'),
            newSelfie: document.getElementById('newSelfieBtn'),
            closeError: document.getElementById('closeErrorBtn')
        };
        
        // Camera elements
        this.cameraVideo = document.getElementById('cameraVideo');
        this.captureCanvas = document.getElementById('captureCanvas');
        
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadPreview = document.getElementById('uploadPreview');
        
        // Game elements
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.currentScoreEl = document.getElementById('currentScore');
        this.bestScoreEl = document.getElementById('bestScore');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.getReadyEl = document.getElementById('getReady');
        
        // Other elements
        this.userPhotoEl = document.getElementById('userPhoto');
        this.complimentTextEl = document.getElementById('complimentText');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalBestScoreEl = document.getElementById('finalBestScore');
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const rect = this.gameCanvas.getBoundingClientRect();
        this.gameCanvas.width = rect.width;
        this.gameCanvas.height = rect.height;
    }
    
    setupEventListeners() {
        // Navigation buttons with better error handling
        this.buttons.useCamera?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Camera button clicked');
            this.showCameraScreen();
        });
        
        this.buttons.uploadPhoto?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload button clicked');
            this.showUploadScreen();
        });
        
        this.buttons.backFromCamera?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('landing');
        });
        
        this.buttons.backFromUpload?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('landing');
        });
        
        // Camera functionality
        this.buttons.capture?.addEventListener('click', (e) => {
            e.preventDefault();
            this.capturePhoto();
        });
        
        this.buttons.uploadInstead?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUploadScreen();
        });
        
        // Upload functionality - fixed implementation
        if (this.uploadArea && this.fileInput) {
            // Direct file input click
            this.uploadArea.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload area clicked, triggering file input');
                this.fileInput.click();
            });
            
            // Drag and drop handlers
            this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            
            // File input change handler
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input changed, files:', e.target.files);
                const file = e.target.files[0];
                if (file) {
                    console.log('Processing selected file:', file.name);
                    this.processFile(file);
                } else {
                    console.log('No file selected');
                }
                // Reset file input so same file can be selected again
                e.target.value = '';
            });
        }
        
        // Game controls
        this.buttons.pause?.addEventListener('click', () => this.togglePause());
        this.buttons.audioToggle?.addEventListener('click', () => this.toggleAudio());
        this.buttons.resume?.addEventListener('click', () => this.togglePause());
        this.buttons.quit?.addEventListener('click', () => this.showScreen('landing'));
        
        // Game over buttons
        this.buttons.tryAgain?.addEventListener('click', () => this.restartGame());
        this.buttons.newSelfie?.addEventListener('click', () => this.showScreen('landing'));
        
        // Error handling
        this.buttons.closeError?.addEventListener('click', () => this.hideError());
        
        // Game input with larger tap area (80% of screen)
        if (this.gameCanvas) {
            this.gameCanvas.addEventListener('click', (e) => this.handleGameInput(e));
            this.gameCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleGameInput(e);
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.currentScreen === 'game') {
                e.preventDefault();
                this.handleGameInput(e);
            }
            if (e.code === 'KeyR' && this.currentScreen === 'gameOver') {
                e.preventDefault();
                this.restartGame();
            }
            if (e.code === 'KeyM') {
                e.preventDefault();
                this.toggleAudio();
            }
        });
        
        // Window focus handling
        window.addEventListener('blur', () => {
            if (this.gameRunning && !this.gamePaused && this.currentGameState === this.gameStates.PLAYING) {
                this.togglePause();
            }
        });
    }
    
    handleGameInput(e) {
        const now = Date.now();
        
        // Prevent double-taps with buffer period
        if (now - this.lastFlapTime < 100) return;
        
        if (this.currentGameState === this.gameStates.READY) {
            this.startPlaying();
        } else if (this.currentGameState === this.gameStates.PLAYING && this.inputEnabled) {
            this.flap();
        }
        
        this.lastFlapTime = now;
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioEnabled = false;
        }
    }
    
    playSound(type) {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            switch (type) {
                case 'shutter':
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
                    break;
                case 'pop':
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.2);
                    break;
                case 'flap':
                    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
                    break;
                case 'score':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
                    break;
                case 'gameOver':
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
                    break;
            }
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio error:', error);
        }
    }
    
    showScreen(screenName) {
        console.log('Showing screen:', screenName);
        
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
        
        // Show target screen with smooth transition
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        } else {
            console.error('Screen not found:', screenName);
        }
        
        // Stop camera if leaving camera screen
        if (screenName !== 'camera' && this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Hide loading when switching screens
        this.hideLoading();
    }
    
    async showCameraScreen() {
        console.log('Attempting to show camera screen');
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError('Camera not supported by this browser. Please use the upload option instead.');
            setTimeout(() => {
                this.showUploadScreen();
            }, 2000);
            return;
        }
        
        try {
            this.showLoading();
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false 
            });
            
            this.cameraStream = stream;
            this.cameraVideo.srcObject = stream;
            
            this.cameraVideo.onloadedmetadata = () => {
                console.log('Camera video loaded');
                this.hideLoading();
                this.showScreen('camera');
            };
            
            this.cameraVideo.onerror = (error) => {
                console.error('Camera video error:', error);
                this.hideLoading();
                this.showError('Camera error. Please use the upload option instead.');
                setTimeout(() => {
                    this.showUploadScreen();
                }, 2000);
            };
            
        } catch (error) {
            this.hideLoading();
            console.error('Camera error:', error);
            this.showError('Camera access denied or not available. Please use the upload option instead.');
            setTimeout(() => {
                this.showUploadScreen();
            }, 2000);
        }
    }
    
    showUploadScreen() {
        console.log('Showing upload screen');
        this.showScreen('upload');
    }
    
    capturePhoto() {
        if (!this.cameraVideo || !this.cameraVideo.videoWidth || !this.cameraVideo.videoHeight) {
            this.showError('Camera not ready. Please try again.');
            return;
        }
        
        try {
            const canvas = this.captureCanvas;
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.cameraVideo.videoWidth;
            canvas.height = this.cameraVideo.videoHeight;
            
            // Draw video frame (flip horizontally for selfie effect)
            ctx.scale(-1, 1);
            ctx.drawImage(this.cameraVideo, -canvas.width, 0);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    this.processImage(blob);
                    this.playSound('shutter');
                } else {
                    this.showError('Failed to capture photo. Please try again.');
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error('Capture error:', error);
            this.showError('Failed to capture photo. Please try again.');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            console.log('File dropped:', files[0].name);
            this.processFile(files[0]);
        }
    }
    
    processFile(file) {
        console.log('Processing file:', file.name, file.type, file.size);
        
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file (JPG, PNG, etc.).');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            this.showError('Image file is too large. Please choose a file under 10MB.');
            return;
        }
        
        this.processImage(file);
    }
    
    processImage(imageSource) {
        console.log('Processing image...');
        this.showLoading();
        
        // Set timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.error('Image processing timeout');
            this.hideLoading();
            this.showError('Image processing timed out. Please try a different image.');
        }, 10000); // 10 second timeout
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            clearTimeout(timeout);
            console.log('Image loaded:', img.width, 'x', img.height);
            
            try {
                // Calculate crop dimensions for square aspect ratio
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                
                canvas.width = 256;
                canvas.height = 256;
                
                ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);
                
                this.userPhoto = canvas.toDataURL('image/jpeg', 0.8);
                
                console.log('Image processed successfully');
                this.hideLoading();
                this.showComplimentSequence();
            } catch (error) {
                clearTimeout(timeout);
                console.error('Image processing error:', error);
                this.hideLoading();
                this.showError('Failed to process image. Please try another photo.');
            }
        };
        
        img.onerror = (error) => {
            clearTimeout(timeout);
            console.error('Failed to load image:', error);
            this.hideLoading();
            this.showError('Failed to load image. Please try another photo.');
        };
        
        try {
            if (imageSource instanceof Blob || imageSource instanceof File) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('FileReader loaded image');
                    img.src = e.target.result;
                };
                reader.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('FileReader error:', error);
                    this.hideLoading();
                    this.showError('Failed to read image file.');
                };
                reader.readAsDataURL(imageSource);
            } else {
                img.src = imageSource;
            }
        } catch (error) {
            clearTimeout(timeout);
            console.error('Process image error:', error);
            this.hideLoading();
            this.showError('Failed to process image. Please try another photo.');
        }
    }
    
    showComplimentSequence() {
        console.log('Starting compliment sequence');
        
        try {
            this.userPhotoEl.src = this.userPhoto;
            this.showScreen('compliment');
            
            setTimeout(() => {
                const randomCompliment = this.compliments[Math.floor(Math.random() * this.compliments.length)];
                console.log('Showing compliment:', randomCompliment);
                this.animateCompliment(randomCompliment);
            }, 800);
            
            setTimeout(() => {
                this.initializeGame();
            }, 3200);
        } catch (error) {
            console.error('Compliment sequence error:', error);
            this.showError('Error showing compliment. Proceeding to game...');
            setTimeout(() => {
                this.initializeGame();
            }, 1000);
        }
    }
    
    animateCompliment(compliment) {
        try {
            const words = compliment.split(' ');
            let currentWord = 0;
            
            this.complimentTextEl.textContent = '';
            this.playSound('pop');
            
            const showNextWord = () => {
                if (currentWord < words.length) {
                    if (currentWord > 0) {
                        this.complimentTextEl.textContent += ' ';
                    }
                    this.complimentTextEl.textContent += words[currentWord];
                    currentWord++;
                    
                    setTimeout(showNextWord, 200);
                }
            };
            
            showNextWord();
        } catch (error) {
            console.error('Animate compliment error:', error);
            this.complimentTextEl.textContent = compliment;
        }
    }
    
    initializeGame() {
        console.log('Initializing game');
        try {
            this.showScreen('game');
            this.resetGame();
            this.currentGameState = this.gameStates.READY;
            
            // Create user photo image for game
            this.birdImage = new Image();
            this.birdImage.src = this.userPhoto;
            
            this.updateScoreDisplay();
            this.gameLoop();
            
            // Show "Get Ready!" state
            this.showGetReady();
        } catch (error) {
            console.error('Initialize game error:', error);
            this.showError('Error initializing game.');
        }
    }
    
    showGetReady() {
        try {
            // Create and show get ready text
            const getReadyEl = document.createElement('div');
            getReadyEl.className = 'get-ready-overlay';
            getReadyEl.innerHTML = `
                <div class="get-ready-content">
                    <h2 class="get-ready-title">Get Ready!</h2>
                    <p class="get-ready-hint">Tap to start flying</p>
                </div>
            `;
            
            this.gameCanvas.parentElement.appendChild(getReadyEl);
            this.getReadyEl = getReadyEl;
            
            // Hide tap hint during ready state
            const tapHint = document.querySelector('.tap-hint');
            if (tapHint) {
                tapHint.style.display = 'none';
            }
        } catch (error) {
            console.error('Show get ready error:', error);
        }
    }
    
    startPlaying() {
        console.log('Starting to play');
        this.currentGameState = this.gameStates.PLAYING;
        this.gameRunning = true;
        this.inputEnabled = true;
        
        // Remove get ready overlay
        if (this.getReadyEl) {
            this.getReadyEl.remove();
            this.getReadyEl = null;
        }
        
        // Show tap hint again briefly
        const tapHint = document.querySelector('.tap-hint');
        if (tapHint) {
            tapHint.style.display = 'block';
            tapHint.style.opacity = '1';
            setTimeout(() => {
                tapHint.style.opacity = '0';
            }, 2000);
        }
        
        // First flap to start
        this.bird.velocity = this.gameSettings.flapStrength * 0.7;
        this.playSound('flap');
        this.createFlapParticles();
    }
    
    resetGame() {
        console.log('Resetting game completely');
        
        // Reset bird completely
        this.bird = {
            x: this.gameCanvas.width * 0.2,
            y: this.gameCanvas.height * 0.5,
            velocity: 0,
            rotation: 0,
            radius: this.gameSettings.birdSize / 2,
            alive: true
        };
        
        // Reset game state completely
        this.pipes = [];
        this.particles = [];
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.inputEnabled = true;
        this.lastFlapTime = 0;
        this.backgroundOffset = 0;
        
        // Clear any existing overlays
        if (this.getReadyEl) {
            this.getReadyEl.remove();
            this.getReadyEl = null;
        }
        
        console.log('Game reset complete');
    }
    
    createPipe() {
        const minGap = this.gameSettings.minPipeGap;
        const maxGap = this.gameSettings.maxPipeGap;
        const gap = Math.random() * (maxGap - minGap) + minGap;
        
        const minY = 80;
        const maxY = this.gameCanvas.height - gap - 80;
        const pipeY = Math.random() * (maxY - minY) + minY;
        
        return {
            x: this.gameCanvas.width,
            topHeight: pipeY,
            bottomY: pipeY + gap,
            bottomHeight: this.gameCanvas.height - (pipeY + gap),
            gap: gap,
            width: 60,
            passed: false,
            scored: false
        };
    }
    
    gameLoop() {
        if (this.currentGameState === this.gameStates.PLAYING) {
            this.updateGame();
        }
        this.renderGame();
        
        if (this.currentGameState !== this.gameStates.GAME_OVER) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    updateGame() {
        if (!this.gameRunning || this.gamePaused || !this.bird.alive) return;
        
        // Update bird physics with improved values
        this.bird.velocity += this.gameSettings.gravity;
        this.bird.velocity = Math.min(this.bird.velocity, this.gameSettings.terminalVelocity);
        this.bird.y += this.bird.velocity;
        
        // Smooth bird rotation based on velocity (-30° to +30° range)
        const targetRotation = Math.min(Math.max(this.bird.velocity * 3, -30), 30);
        this.bird.rotation += (targetRotation - this.bird.rotation) * 0.3;
        
        // Update background
        this.backgroundOffset += 1;
        
        // Generate pipes with improved spacing
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.gameCanvas.width - 350) {
            this.pipes.push(this.createPipe());
        }
        
        // Update pipes
        this.pipes.forEach((pipe, index) => {
            pipe.x -= this.gameSettings.pipeSpeed;
            
            // Check for scoring
            if (!pipe.scored && pipe.x + pipe.width < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScoreDisplay();
                this.playSound('score');
                this.createScoreParticles();
            }
            
            // Remove pipes that are off-screen
            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(index, 1);
            }
        });
        
        // Update particles with object pooling limit
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2;
            particle.life--;
            particle.opacity = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // Limit particles for performance
        if (this.particles.length > 50) {
            this.particles.splice(0, this.particles.length - 50);
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check bounds
        if (this.bird.y - this.bird.radius < 0 || this.bird.y + this.bird.radius > this.gameCanvas.height) {
            this.gameOver();
        }
    }
    
    checkCollisions() {
        if (!this.bird.alive) return;
        
        for (const pipe of this.pipes) {
            // Check if bird is in pipe x range
            if (this.bird.x + this.bird.radius > pipe.x && this.bird.x - this.bird.radius < pipe.x + pipe.width) {
                // Check if bird is not in gap
                if (this.bird.y - this.bird.radius < pipe.topHeight || this.bird.y + this.bird.radius > pipe.bottomY) {
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    renderGame() {
        const ctx = this.gameCtx;
        
        ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        this.drawBackground(ctx);
        this.pipes.forEach(pipe => this.drawPipe(ctx, pipe));
        this.particles.forEach(particle => this.drawParticle(ctx, particle));
        
        if (this.bird.alive) {
            this.drawBird(ctx);
        }
        
        // Draw ready state elements
        if (this.currentGameState === this.gameStates.READY) {
            this.drawReadyState(ctx);
        }
    }
    
    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.gameCanvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B3EBF2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Draw moving clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 3; i++) {
            const x = (this.backgroundOffset * 0.3 + i * 200) % (this.gameCanvas.width + 100) - 50;
            const y = 50 + i * 30;
            this.drawCloud(ctx, x, y, 40 + i * 10);
        }
    }
    
    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawPipe(ctx, pipe) {
        const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(1, '#5A9A5A');
        
        ctx.fillStyle = gradient;
        
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        
        // Bottom pipe  
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
        
        // Pipe caps for visual polish
        ctx.fillStyle = '#4A7A4A';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 25, pipe.width + 10, 25);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 25);
        
        // Add glow effect for upcoming pipe gap
        if (pipe.x > this.bird.x && pipe.x < this.bird.x + 150) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(181, 234, 215, 0.5)';
            ctx.strokeStyle = 'rgba(181, 234, 215, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(pipe.x + 5, pipe.topHeight + 5, pipe.width - 10, pipe.gap - 10);
            ctx.shadowBlur = 0;
        }
    }
    
    drawBird(ctx) {
        ctx.save();
        ctx.translate(this.bird.x, this.bird.y);
        ctx.rotate(this.bird.rotation * Math.PI / 180);
        
        if (this.birdImage && this.birdImage.complete && this.birdImage.naturalWidth > 0) {
            // Draw shadow
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(2, 2, this.bird.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw main image as circle
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                this.birdImage,
                -this.bird.radius,
                -this.bird.radius,
                this.bird.radius * 2,
                this.bird.radius * 2
            );
            ctx.restore();
            
            // Draw gloss overlay
            const gloss = ctx.createRadialGradient(-this.bird.radius * 0.3, -this.bird.radius * 0.3, 0, -this.bird.radius * 0.3, -this.bird.radius * 0.3, this.bird.radius);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gloss;
            ctx.beginPath();
            ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Fallback circle if image isn't loaded
            ctx.fillStyle = '#FFDAC1';
            ctx.beginPath();
            ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawReadyState(ctx) {
        // Draw gentle bob animation for bird
        const bobOffset = Math.sin(Date.now() * 0.005) * 3;
        this.bird.y = this.gameCanvas.height * 0.5 + bobOffset;
    }
    
    drawParticle(ctx, particle) {
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    flap() {
        if (!this.inputEnabled || !this.bird.alive) return;
        
        this.bird.velocity = this.gameSettings.flapStrength;
        this.playSound('flap');
        
        // Create flap particles
        this.createFlapParticles();
        
        // Add subtle screen shake effect
        this.createScreenShake();
    }
    
    createScreenShake() {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.transform = 'translate(2px, 0)';
            setTimeout(() => {
                gameContainer.style.transform = 'translate(-2px, 0)';
                setTimeout(() => {
                    gameContainer.style.transform = 'translate(0, 0)';
                }, 50);
            }, 50);
        }
    }
    
    createFlapParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x - this.bird.radius,
                y: this.bird.y + Math.random() * 20 - 10,
                vx: -2 - Math.random() * 2,
                vy: Math.random() * 4 - 2,
                size: 2 + Math.random() * 3,
                color: '#FFDAC1',
                life: 30,
                maxLife: 30,
                opacity: 1
            });
        }
    }
    
    createScoreParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 4 - 2,
                size: 3 + Math.random() * 2,
                color: '#B5EAD7',
                life: 60,
                maxLife: 60,
                opacity: 1
            });
        }
    }
    
    updateScoreDisplay() {
        if (this.currentScoreEl) {
            this.currentScoreEl.textContent = this.score;
        }
        if (this.bestScoreEl) {
            this.bestScoreEl.textContent = this.bestScore;
        }
        
        // Animate score with bounce effect
        if (this.currentScoreEl) {
            this.currentScoreEl.style.transform = 'scale(1.3)';
            setTimeout(() => {
                this.currentScoreEl.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.toggle('hidden', !this.gamePaused);
        }
        
        if (!this.gamePaused && this.currentGameState === this.gameStates.PLAYING) {
            this.gameLoop();
        }
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        if (this.buttons.audioToggle) {
            this.buttons.audioToggle.textContent = this.audioEnabled ? '🔊' : '🔇';
        }
    }
    
    gameOver() {
        console.log('Game over');
        this.gameRunning = false;
        this.bird.alive = false;
        this.inputEnabled = false;
        this.currentGameState = this.gameStates.GAME_OVER;
        
        this.playSound('gameOver');
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        
        // Show game over screen with delay
        setTimeout(() => {
            if (this.finalScoreEl) {
                this.finalScoreEl.textContent = this.score;
            }
            if (this.finalBestScoreEl) {
                this.finalBestScoreEl.textContent = this.bestScore;
            }
            this.showScreen('gameOver');
        }, 500);
    }
    
    restartGame() {
        console.log('Restarting game - complete reset');
        // Clean restart - this fixes the restart bug completely
        this.resetGame();
        this.initializeGame();
    }
    
    loadBestScore() {
        try {
            const saved = sessionStorage.getItem('flappyBestScore');
            this.bestScore = saved ? parseInt(saved) : 0;
        } catch (e) {
            this.bestScore = 0;
        }
    }
    
    saveBestScore() {
        try {
            sessionStorage.setItem('flappyBestScore', this.bestScore.toString());
        } catch (e) {
            console.log('Could not save best score');
        }
    }
    
    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
    }
    
    showError(message) {
        console.error('Error:', message);
        if (this.errorText) {
            this.errorText.textContent = message;
        }
        if (this.errorMessage) {
            this.errorMessage.classList.remove('hidden');
        }
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        if (this.errorMessage) {
            this.errorMessage.classList.add('hidden');
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        new SelfieFlappyGame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});
