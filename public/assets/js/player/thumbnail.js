// Módulo de captura de thumbnail
const PlayerThumbnail = {
    captured: false,
    captureTime: Math.floor(Math.random() * (180 - 30 + 1)) + 30,
    
    init(player) {
        const params = PlayerCore.getUrlParams();
        if (!params.idTitulo || !params.isSerie) return;
        
        fetch(`api/check_thumbnail.php?id=${encodeURIComponent(params.idTitulo)}`)
            .then(r => r.json())
            .then(result => {
                if (result.exists) {
                    this.captured = true;
                } else {
                    player.on('timeupdate', () => {
                        const currentTime = player.currentTime();
                        if (!this.captured && (currentTime >= this.captureTime || currentTime >= 180)) {
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
            const formData = new FormData();
            formData.append('thumbnail', blob, `${params.idTitulo}.jpg`);
            formData.append('id', params.idTitulo);
            
            fetch('api/save_thumbnail.php', {
                method: 'POST',
                body: formData
            }).then(r => r.json()).then(result => {
                console.log('Thumbnail:', result.success ? 'salva' : 'erro');
            });
        }, 'image/jpeg', 0.8);
    }
};
