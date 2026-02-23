class SalaPlayer {
    constructor() {
        this.salaId = new URLSearchParams(window.location.search).get('id');
        this.player = null;
        this.isLider = false;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.isSyncing = false;
        
        if (!this.salaId) {
            alert('ID da sala não encontrado');
            window.location.href = 'salas.php';
            return;
        }
        
        this.init();
    }
    
    async init() {
        this.iniciarPlayer();
        await this.carregarSala();
        this.iniciarSincronizacao();
    }
    
    async carregarSala() {
        try {
            const response = await fetch(`api/sync_sala.php?sala_id=${this.salaId}`);
            const data = await response.json();
            
            if (!data.success) {
                alert(data.error || 'Erro ao carregar sala');
                window.location.href = 'salas.php';
                return;
            }
            
            this.isLider = data.is_lider;
            this.atualizarInterface(data);
        } catch (error) {
            console.error('Erro ao carregar sala:', error);
        }
    }
    
    atualizarInterface(data) {
        const { sala, participantes, mensagens } = data;
        
        // Atualizar header
        document.getElementById('salaNome').innerHTML = `Sala: ${sala.nome} <span id="salaCodigo" class="codigo-badge">${sala.codigo}</span>`;
        
        // Atualizar participantes
        this.atualizarParticipantes(participantes);
        
        // Atualizar mensagens
        this.atualizarMensagens(mensagens);
        
        // Configurar player se necessário
        if (this.player && sala.titulo_id) {
            this.configurarVideo(sala);
        }
    }
    
    iniciarPlayer() {
        this.player = videojs('salaPlayer', {
            fluid: false,
            responsive: false,
            controls: false
        });
        
        this.player.ready(() => {
            this.player.controls(false);
            const vjsControlBar = this.player.el().querySelector('.vjs-control-bar');
            if (vjsControlBar) {
                vjsControlBar.style.display = 'none';
            }
            
            // Esconder controles customizados se for visitante
            if (!this.isLider) {
                const controls = document.getElementById('customControls');
                const progressContainer = controls.querySelector('.progress-container');
                const timeDisplay = controls.querySelector('.time-display');
                const fullscreenBtn = controls.querySelector('button[onclick="toggleFullscreen()"]');
                controls.innerHTML = '';
                controls.appendChild(progressContainer);
                controls.appendChild(timeDisplay);
                controls.appendChild(fullscreenBtn);
                controls.style.justifyContent = 'space-between';
                // Remover onclick da barra de progresso
                progressContainer.removeAttribute('onclick');
                progressContainer.style.cursor = 'default';
            }
        });
        
        // Eventos do player apenas para o líder
        if (this.isLider) {
            this.player.on('play', () => {
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.textContent = '⏸';
            });
            this.player.on('pause', () => {
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.textContent = '▶';
            });
        } else {
            this.player.on('play', () => {
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.textContent = '⏸';
            });
            this.player.on('pause', () => {
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.textContent = '▶';
            });
        }
        
        this.player.on('timeupdate', () => {
            this.updateProgress();
        });
        
        this.player.on('loadedmetadata', () => {
            this.updateProgress();
        });
        
        // Adicionar controles do player original
        this.setupPlayerControls();
    }
    
    setupPlayerControls() {
        document.addEventListener('mousemove', () => this.showControls());
        document.addEventListener('touchstart', () => this.showControls());
        
        const video = document.getElementById('salaPlayer');
        video.addEventListener('dblclick', (e) => this.toggleFullscreen());
        video.addEventListener('click', (e) => this.handleVideoClick(e));
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    handleVideoClick(e) {
        if (!this.isLider) return;
        
        // Apenas clique simples para play/pause (só líder)
        if (this.player.paused()) {
            this.player.play();
        } else {
            this.player.pause();
        }
    }
    
    showControls() {
        const controls = document.getElementById('customControls');
        controls.classList.remove('hidden');
        
        clearTimeout(this.hideTimeout);
        
        if (!this.player.paused() || document.fullscreenElement) {
            this.hideTimeout = setTimeout(() => {
                controls.classList.add('hidden');
            }, 3000);
        }
    }
    
    handleKeyboard(e) {
        if (!this.isLider && ['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            alert('Apenas o líder pode controlar o player');
            return;
        }
        
        if (e.key === ' ') {
            e.preventDefault();
            if (this.player.paused()) {
                this.player.play();
            } else {
                this.player.pause();
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.player.currentTime(this.player.currentTime() - 10);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.player.currentTime(this.player.currentTime() + 10);
        }
        this.showControls();
    }
    
    configurarVideo(sala) {
        if (!sala.titulo_path || this.player.src() === `video.php?path=${encodeURIComponent(sala.titulo_path)}`) return;
        
        this.player.src({
            src: `video.php?path=${encodeURIComponent(sala.titulo_path)}`,
            type: 'video/mp4'
        });
        
        this.player.ready(() => {
            if (sala.tempo_atual > 0) {
                this.player.currentTime(parseFloat(sala.tempo_atual));
            }
            
            // Sempre iniciar com o estado correto
            if (!sala.pausado) {
                this.player.play().then(() => {
                    const playBtn = document.getElementById('playBtn');
                    if (playBtn) playBtn.textContent = '⏸';
                }).catch(() => {
                    const playBtn = document.getElementById('playBtn');
                    if (playBtn) playBtn.textContent = '▶';
                });
            } else {
                this.player.pause();
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.textContent = '▶';
            }
        });
    }
    
    iniciarSincronizacao() {
        // Líder: sincroniza estado quando há mudanças
        if (this.isLider) {
            this.setupLiderEvents();
        } else {
            // Visitantes: fazem polling para sincronizar
            this.syncInterval = setInterval(() => {
                this.sincronizarComoVisitante();
            }, 15000);
        }
    }
    
    setupLiderEvents() {
        this.player.on('play', () => {
            this.enviarEstadoLider('play');
        });
        
        this.player.on('pause', () => {
            this.enviarEstadoLider('pause');
        });
        
        this.player.on('seeked', () => {
            this.enviarEstadoLider('seek');
        });
    }
    
    async enviarEstadoLider(acao) {
        const timestamp = Date.now();
        const tempoVideo = this.player.currentTime();
        const pausado = this.player.paused();
        
        try {
            await fetch('api/update_player_sala.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sala_id: this.salaId,
                    tempo_atual: tempoVideo,
                    pausado: pausado,
                    timestamp: timestamp,
                    acao: acao
                })
            });
        } catch (error) {
            console.error('Erro ao enviar estado:', error);
        }
    }
    
    async sincronizarComoVisitante() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        
        try {
            const response = await fetch(`api/sync_player_sala.php?sala_id=${this.salaId}`);
            const data = await response.json();
            
            if (data.success && data.player_state) {
                this.aplicarSincronizacao(data.player_state);
                this.atualizarStatusSync('Sincronizado');
            }
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.atualizarStatusSync('Erro', true);
        } finally {
            this.isSyncing = false;
        }
    }
    
    aplicarSincronizacao(estado) {
        if (!this.player.readyState()) return;
        
        const agora = Date.now();
        const tempoDecorrido = (agora - estado.timestamp) / 1000;
        const tempoCalculado = estado.pausado ? estado.tempo_atual : estado.tempo_atual + tempoDecorrido;
        
        // Sincronizar play/pause
        if (estado.pausado && !this.player.paused()) {
            this.player.pause();
            const playBtn = document.getElementById('playBtn');
            if (playBtn) playBtn.textContent = '▶';
        } else if (!estado.pausado && this.player.paused()) {
            this.player.play();
            const playBtn = document.getElementById('playBtn');
            if (playBtn) playBtn.textContent = '⏸';
        }
        
        // Sincronizar tempo se diferença > 3s
        const meuTempo = this.player.currentTime();
        const diferenca = Math.abs(tempoCalculado - meuTempo);
        
        if (diferenca > 3) {
            this.player.currentTime(tempoCalculado);
        }
    }
    
    toggleFullscreen() {
        const playerSection = document.querySelector('.player-section');
        const controls = document.getElementById('customControls');
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            playerSection.requestFullscreen();
            // Garantir que controles apareçam em fullscreen
            controls.style.position = 'fixed';
            controls.style.bottom = '0';
            controls.style.left = '0';
            controls.style.right = '0';
            controls.style.zIndex = '9999';
        }
        
        // Listener para quando sair do fullscreen
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                controls.style.position = '';
                controls.style.bottom = '';
                controls.style.left = '';
                controls.style.right = '';
                controls.style.zIndex = '';
            }
        });
    }
    
    atualizarParticipantes(participantes) {
        const container = document.getElementById('participantesList');
        const count = document.getElementById('participantesCount');
        
        count.textContent = `${participantes.length} participante(s)`;
        
        container.innerHTML = participantes.map(p => `
            <span class="participante-item ${p.is_lider ? 'participante-lider' : ''}">
                ${p.is_lider ? '👑 ' : ''}${p.nome}
            </span>
        `).join('');
    }
    
    atualizarMensagens(mensagens) {
        const container = document.getElementById('chatMessages');
        
        container.innerHTML = mensagens.map(msg => `
            <div class="message">
                <div class="message-header">
                    <span class="message-user">${msg.usuario_nome}</span>
                    <span class="message-time">${this.formatarTempo(msg.enviado_em)}</span>
                </div>
                <div class="message-text">${this.escapeHtml(msg.mensagem)}</div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }
    
    atualizarStatusSync(message, isError = false) {
        const status = document.getElementById('syncStatus');
        status.textContent = message;
        status.className = isError ? 'sync-badge error' : 'sync-badge';
    }
    
    formatarTempo(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    atualizarIndicadoresSync(tempoLider, meuTempo, diferenca) {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        document.getElementById('leaderTime').textContent = formatTime(tempoLider);
        document.getElementById('myTime').textContent = formatTime(meuTempo);
        document.getElementById('timeDiff').textContent = `${diferenca.toFixed(1)}s`;
    }
    
    updateProgress() {
        if (!this.player) return;
        
        const currentTime = this.player.currentTime();
        const duration = this.player.duration();
        
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            document.getElementById('progressBar').style.width = percent + '%';
            
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            document.getElementById('timeDisplay').textContent = 
                `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }
    }
}

// Instância global
let salaPlayer;

// Funções globais para eventos inline
function togglePlay() {
    if (!salaPlayer.isLider) {
        alert('Apenas o líder pode controlar o player');
        return;
    }
    
    if (salaPlayer.player.paused()) {
        salaPlayer.player.play();
    } else {
        salaPlayer.player.pause();
    }
}

function seek(event) {
    if (!salaPlayer.isLider) {
        alert('Apenas o líder pode controlar o player');
        return;
    }
    
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const duration = salaPlayer.player.duration();
    
    salaPlayer.player.currentTime(duration * percent);
}

function toggleFullscreen() {
    salaPlayer.toggleFullscreen();
}

async function enviarMensagem() {
    const input = document.getElementById('messageInput');
    const mensagem = input.value.trim();
    
    if (!mensagem) return;
    
    try {
        const response = await fetch('api/enviar_mensagem_sala.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sala_id: salaPlayer.salaId,
                mensagem: mensagem
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            // A mensagem aparecerá na próxima sincronização
        } else {
            alert(data.error || 'Erro ao enviar mensagem');
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        enviarMensagem();
    }
}

function skipBackward() {
    if (!salaPlayer.isLider) {
        alert('Apenas o líder pode controlar o player');
        return;
    }
    salaPlayer.player.currentTime(salaPlayer.player.currentTime() - 10);
}

function skipForward() {
    if (!salaPlayer.isLider) {
        alert('Apenas o líder pode controlar o player');
        return;
    }
    salaPlayer.player.currentTime(salaPlayer.player.currentTime() + 10);
}

function toggleMute() {
    if (salaPlayer.player.muted()) {
        salaPlayer.player.muted(false);
        document.getElementById('volumeBtn').textContent = '🔊';
    } else {
        salaPlayer.player.muted(true);
        document.getElementById('volumeBtn').textContent = '🔇';
    }
}

function changeVolume() {
    const volume = document.getElementById('volumeSlider').value / 100;
    salaPlayer.player.volume(volume);
    
    if (volume === 0) {
        document.getElementById('volumeBtn').textContent = '🔇';
    } else {
        document.getElementById('volumeBtn').textContent = '🔊';
    }
}

function changeSpeed() {
    const speed = parseFloat(document.getElementById('speedSelect').value);
    salaPlayer.player.playbackRate(speed);
}

function showPreview(event) {
    // Funcionalidade de preview será implementada depois se necessário
}

function hidePreview() {
    // Funcionalidade de preview será implementada depois se necessário
}

function sincronizarManual() {
    if (salaPlayer && !salaPlayer.isLider) {
        salaPlayer.sincronizarComoVisitante();
    }
}

function sairSala() {
    if (confirm('Deseja sair da sala?')) {
        window.location.href = 'salas.php';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    salaPlayer = new SalaPlayer();
});

// Limpar intervalos ao sair da página
window.addEventListener('beforeunload', function() {
    if (salaPlayer && salaPlayer.syncInterval) {
        clearInterval(salaPlayer.syncInterval);
    }
});