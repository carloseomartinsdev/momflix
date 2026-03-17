// Módulo principal do player
const PlayerCore = {
    player: null,
    saveInterval: null,
    
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            idTitulo: params.get('idTitulo'),
            path: params.get('path'),
            title: params.get('title') || 'Vídeo',
            originalTitle: params.get('originalTitle'),
            isSerie: params.get('isSerie') === '1',
            isSaga: params.get('isSaga') === '1',
            continue: params.get('continue') === '1'
        };
    },
    
    init() {
        const params = this.getUrlParams();
        
        if (!params.path) {
            alert('Caminho do vídeo não especificado');
            this.fechar();
            return;
        }
        
        document.getElementById('playerTitle').textContent = params.title;
        
        // Se for série e tiver path, buscar nome do episódio
        if (params.isSerie && params.path) {
            const arquivo = params.path.split(/[\\\/]/).pop();
            fetch(`api/get_episode_info.php?arquivo=${encodeURIComponent(arquivo)}&idTitulo=${params.idTitulo}`)
                .then(r => r.json())
                .then(result => {
                    if (result.success && result.episodio) {
                        document.getElementById('playerTitle').textContent = 
                            result.episodio.titulo_episodio || result.episodio.tag;
                    }
                })
                .catch(() => {});
        }
        
        // Mostrar botão de config para admins
        fetch('api/check_admin.php')
            .then(r => r.json())
            .then(result => {
                if (result.isAdmin) {
                    document.getElementById('btnConfig').style.display = 'block';
                }
            });
        
        PlayerEpisodes.init();
        
        this.player = videojs('playerVideo', {
            fluid: false,
            responsive: false,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            controls: false
        });
        
        this.player.ready(() => {
            this.player.controls(false);
            const vjsControlBar = this.player.el().querySelector('.vjs-control-bar');
            if (vjsControlBar) {
                vjsControlBar.style.display = 'none';
            }
        });
        
        this.player.src({
            src: params.idTitulo ? 'video_proxy.php?id=' + encodeURIComponent(params.idTitulo) : '../video.php?path=' + encodeURIComponent(params.path),
            type: 'video/mp4'
        });
        
        this.player.ready(() => {
            PlayerControls.init(this.player);
            PlayerThumbnail.init(this.player);
            PlayerSkip.init(this.player);
            
            // Se for continue, buscar tempo salvo
            if (params.continue && params.idTitulo) {
                fetch(`api/get_user_playback.php?idTitulo=${encodeURIComponent(params.idTitulo)}`)
                    .then(r => r.json())
                    .then(result => {
                        if (result.success && result.data && result.data.current_time_sec > 0) {
                            this.player.currentTime(result.data.current_time_sec);
                        }
                    });
            }
            
            setTimeout(() => {
                this.player.play().then(() => {
                    document.getElementById('playBtn').textContent = '⏸';
                }).catch(() => {
                    document.getElementById('playBtn').textContent = '▶';
                });
            }, 100);
        });
        
        this.player.on('play', () => {
            document.getElementById('playBtn').textContent = '⏸';
        });
        
        this.player.on('pause', () => {
            document.getElementById('playBtn').textContent = '▶';
        });
        
        this.player.on('timeupdate', () => {
            PlayerControls.updateProgress();
        });
        
        this.player.on('loadedmetadata', () => {
            PlayerControls.updateProgress();
        });
        
        this.player.on('ended', () => {
            if (PlayerEpisodes.serieData || PlayerEpisodes.sagaData) {
                setTimeout(() => {
                    PlayerEpisodes.proximo();
                }, 3000);
            }
        });
        
        if (sessionStorage.getItem('wasFullscreen') === 'true') {
            sessionStorage.removeItem('wasFullscreen');
            setTimeout(() => {
                document.documentElement.requestFullscreen();
            }, 1000);
        }
        
        this.saveInterval = setInterval(() => this.savePlayback(), 5000);
        window.addEventListener('beforeunload', () => this.savePlayback());
        
        // Listener para recarregar quando URL muda
        window.addEventListener('message', (event) => {
            if (event.data.type === 'reloadContent') {
                this.reloadContent();
            }
        });
    },
    
    reloadContent() {
        // Recarrega o sprite quando o conteúdo muda
        if (PlayerControls && PlayerControls.reloadSprite) {
            PlayerControls.reloadSprite();
        }
    },
    
    savePlayback() {
        if (!this.player) return;
        
        const params = this.getUrlParams();
        
        const data = {
            idTitulo: params.idTitulo,
            title: params.title,
            currentTime: this.player.currentTime(),
            duration: this.player.duration(),
            videoPath: params.path
        };
        
        fetch('api/save_playback.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
    },
    
    fechar() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        
        this.savePlayback();
        
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        
        if (window.parent !== window) {
            window.parent.postMessage('playerClosed', '*');
            setTimeout(() => {
                window.parent.postMessage('closePlayer', '*');
            }, 100);
        } else {
            window.location.href = 'index.php';
        }
    }
};

// Função global
function fecharPlayer() { PlayerCore.fechar(); }

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    PlayerCore.init();
});
