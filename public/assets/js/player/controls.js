// Módulo de controles do player
const PlayerControls = {
    player: null,
    hideTimeout: null,
    spriteLoaded: false,
    spriteUrl: null,
    clickTimer: null,
    clickCount: 0,
    
    init(player) {
        this.player = player;
        this.setupEvents();
        this.showControls();
        this.loadSprite();
    },
    
    loadSprite() {
        const params = PlayerCore.getUrlParams();
        if (!params.idTitulo) return;
        
        fetch(`api/get_sprite.php?idTitulo=${params.idTitulo}`)
            .then(r => r.json())
            .then(data => {
                if (data.sprite) {
                    this.spriteUrl = data.sprite;
                    this.spriteLoaded = true;
                    const preview = document.getElementById('spritePreview');
                    preview.style.backgroundImage = `url(${data.sprite})`;
                } else {
                    this.spriteLoaded = false;
                    this.spriteUrl = null;
                    const preview = document.getElementById('spritePreview');
                    preview.style.backgroundImage = 'none';
                }
            })
            .catch(err => console.error('Erro ao carregar sprite:', err));
    },
    
    reloadSprite() {
        this.spriteLoaded = false;
        this.spriteUrl = null;
        this.loadSprite();
    },
    
    setupEvents() {
        document.addEventListener('mousemove', () => this.showControls());
        document.addEventListener('touchstart', () => this.showControls());
        document.addEventListener('touchmove', () => this.showControls());
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        const video = document.getElementById('playerVideo');
        video.addEventListener('click', (e) => this.handleVideoClick(e));
    },
    
    handleVideoClick(e) {
        this.clickCount++;
        
        if (this.clickCount === 1) {
            this.clickTimer = setTimeout(() => {
                // Clique simples - toggle play
                this.togglePlay();
                this.clickCount = 0;
            }, 300);
        } else if (this.clickCount === 2) {
            // Duplo clique - fullscreen
            clearTimeout(this.clickTimer);
            this.toggleFullscreen();
            this.clickCount = 0;
        }
    },
    
    showControls() {
        const header = document.getElementById('playerHeader');
        const controls = document.getElementById('customControls');
        header.classList.remove('hidden');
        controls.classList.remove('hidden');
        
        clearTimeout(this.hideTimeout);
        
        if (!this.player.paused()) {
            this.hideTimeout = setTimeout(() => {
                header.classList.add('hidden');
                controls.classList.add('hidden');
            }, 3000);
        }
    },
    
    togglePlay() {
        if (this.player.paused()) {
            this.player.play();
            document.getElementById('playBtn').textContent = '⏸';
        } else {
            this.player.pause();
            document.getElementById('playBtn').textContent = '▶';
        }
    },
    
    seek(event) {
        const progressContainer = event.currentTarget;
        const rect = progressContainer.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const duration = this.player.duration();
        this.player.currentTime(duration * percent);
    },
    
    updateProgress() {
        if (!this.player) return;
        
        const current = this.player.currentTime();
        const duration = this.player.duration();
        const percent = duration ? (current / duration) * 100 : 0;
        
        document.getElementById('progressBar').style.width = percent + '%';
        
        const currentMin = Math.floor(current / 60);
        const currentSec = Math.floor(current % 60);
        const durationMin = Math.floor(duration / 60);
        const durationSec = Math.floor(duration % 60);
        
        document.getElementById('timeDisplay').textContent = 
            `${currentMin}:${currentSec.toString().padStart(2, '0')} / ${durationMin}:${durationSec.toString().padStart(2, '0')}`;
    },
    
    addProgressMarkers(introStart, introEnd, contentEnd) {
        const container = document.querySelector('.progress-container');
        const duration = this.player.duration();
        
        if (!duration) return;
        
        // Remove marcadores existentes
        container.querySelectorAll('.progress-marker').forEach(m => m.remove());
        
        // Adiciona marcadores se os tempos estão definidos
        if (introStart > 0) {
            const marker = document.createElement('div');
            marker.className = 'progress-marker';
            marker.style.left = (introStart / duration * 100) + '%';
            container.appendChild(marker);
        }
        
        if (introEnd > 0) {
            const marker = document.createElement('div');
            marker.className = 'progress-marker';
            marker.style.left = (introEnd / duration * 100) + '%';
            container.appendChild(marker);
        }
        
        if (contentEnd > 0 && contentEnd < duration) {
            const marker = document.createElement('div');
            marker.className = 'progress-marker';
            marker.style.left = (contentEnd / duration * 100) + '%';
            container.appendChild(marker);
        }
    },
    
    changeSpeed() {
        const speed = parseFloat(document.getElementById('speedSelect').value);
        this.player.playbackRate(speed);
    },
    
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    },
    
    toggleMute() {
        if (this.player.muted()) {
            this.player.muted(false);
            document.getElementById('volumeBtn').textContent = '🔊';
        } else {
            this.player.muted(true);
            document.getElementById('volumeBtn').textContent = '🔇';
        }
    },
    
    changeVolume() {
        const volume = document.getElementById('volumeSlider').value / 100;
        this.player.volume(volume);
        
        if (volume === 0) {
            document.getElementById('volumeBtn').textContent = '🔇';
        } else {
            document.getElementById('volumeBtn').textContent = '🔊';
        }
    },
    
    handleKeyboard(e) {
        if (e.key === 'Escape') {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                PlayerCore.fechar();
            }
        } else if (e.key === ' ') {
            e.preventDefault();
            this.togglePlay();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.player.currentTime(this.player.currentTime() - 10);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.player.currentTime(this.player.currentTime() + 10);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const currentVolume = this.player.volume();
            const newVolume = Math.min(1, currentVolume + 0.1);
            this.player.volume(newVolume);
            document.getElementById('volumeSlider').value = newVolume * 100;
            this.changeVolume();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const currentVolume = this.player.volume();
            const newVolume = Math.max(0, currentVolume - 0.1);
            this.player.volume(newVolume);
            document.getElementById('volumeSlider').value = newVolume * 100;
            this.changeVolume();
        }
        this.showControls();
    }
};

// Funções globais para onclick
function togglePlay() { PlayerControls.togglePlay(); }
function seek(event) { PlayerControls.seek(event); }
function changeSpeed() { PlayerControls.changeSpeed(); }
function toggleFullscreen() { PlayerControls.toggleFullscreen(); }
function toggleMute() { PlayerControls.toggleMute(); }
function changeVolume() { PlayerControls.changeVolume(); }
function reloadSprite() { PlayerControls.reloadSprite(); }
