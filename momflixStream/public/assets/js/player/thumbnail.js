// Módulo de captura de thumbnail
const PlayerThumbnail = {
    captured: false,
    captureTime: Math.floor(Math.random() * (180 - 30 + 1)) + 30, // 30 a 180 segundos
    
    init(player) {
        const params = PlayerCore.getUrlParams();
        if (!params.idTitulo || !params.isSerie) return;
        
        console.log('Thumbnail: Tempo previsto para captura:', this.captureTime, 'segundos');
        
        const arquivo = params.path.split(/[\\\\/]/).pop();
        
        fetch(`api/check_thumbnail.php?arquivo=${encodeURIComponent(arquivo)}`)
            .then(r => r.json())
            .then(result => {
                if (result.exists) {
                    this.captured = true;
                    console.log('Thumbnail: Já existe, não será capturada');
                } else {
                    console.log('Thumbnail: Não existe, aguardando captura...');
                    player.on('timeupdate', () => {
                        const currentTime = player.currentTime();
                        if (!this.captured && (currentTime >= this.captureTime || currentTime >= 180)) {
                            console.log('Thumbnail: Capturando aos', Math.floor(currentTime), 'segundos');
                            this.capture(player);
                        }
                    });
                }
            });
    },
    
    capture(player) {
        this.captured = true;
        
        const video = player.el().querySelector('video');
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            const params = PlayerCore.getUrlParams();
            const arquivo = params.path.split(/[\\\\/]/).pop();
            const formData = new FormData();
            formData.append('thumbnail', blob, `${arquivo}.jpg`);
            formData.append('arquivo', arquivo);
            
            console.log('Thumbnail: Enviando para servidor...', arquivo);
            
            fetch('api/save_thumbnail.php', {
                method: 'POST',
                body: formData
            }).then(r => r.json()).then(result => {
                console.log('Thumbnail: Resposta do servidor:', result);
            });
        }, 'image/jpeg', 0.8);
    }
};
