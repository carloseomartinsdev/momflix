// Módulo de Player
const Player = {
    assistirFilme(id, titulo) {
        const modal = document.getElementById('iframePlayerModal');
        const iframe = document.getElementById('iframePlayerFrame');
        const params = new URLSearchParams({
            title: titulo,
            idTitulo: id,
            isSerie: '0'
        });
        iframe.src = `player.html?${params.toString()}`;
        modal.style.display = 'flex';
    },
    
    assistirEpisodio(id, titulo) {
        const modal = document.getElementById('iframePlayerModal');
        const iframe = document.getElementById('iframePlayerFrame');
        const params = new URLSearchParams({
            title: titulo,
            idTitulo: id,
            isSerie: '1'
        });
        iframe.src = `player.html?${params.toString()}`;
        modal.style.display = 'flex';
    },
    
    fechar() {
        const modal = document.getElementById('iframePlayerModal');
        const iframe = document.getElementById('iframePlayerFrame');
        iframe.src = 'about:blank';
        modal.style.display = 'none';
    }
};

// Fechar player com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        Player.fechar();
    }
});

// Fechar player clicando fora
document.getElementById('iframePlayerModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'iframePlayerModal') {
        Player.fechar();
    }
});

// Listener para mensagens do iframe
window.addEventListener('message', (event) => {
    if (event.data === 'closePlayer') {
        Player.fechar();
    } else if (event.data === 'playerClosed') {
        if (typeof Categorias !== 'undefined') {
            Categorias.atualizarMaisAssistidos();
            Categorias.atualizarContinueAssistindo();
        }
    } else if (event.data.type === 'updateUrl') {
        document.getElementById('iframePlayerFrame').src = event.data.url;
    } else if (event.data.type === 'reloadContent') {
        const iframe = document.getElementById('iframePlayerFrame');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({type: 'reloadContent'}, '*');
        }
    }
});
