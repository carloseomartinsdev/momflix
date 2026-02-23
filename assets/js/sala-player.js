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
        await this.carregarSala();
        this.iniciarPlayer();
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
        document.getElementById('salaNome').textContent = sala.nome;
        document.getElementById('salaCodigo').textContent = sala.codigo;
        
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
            controls: false,
            fluid: true,
            responsive: true
        });
        
        // Eventos do player apenas para o líder
        if (this.isLider) {
            this.player.on('play', () => this.sincronizarEstado());
            this.player.on('pause', () => this.sincronizarEstado());
            this.player.on('seeked', () => this.sincronizarEstado());
        }
    }
    
    configurarVideo(sala) {
        const videoUrl = `video.php?id=${sala.titulo_id}${sala.episodio_id ? `&ep=${sala.episodio_id}` : ''}`;
        
        this.player.src({
            src: videoUrl,
            type: 'video/mp4'
        });
        
        this.player.ready(() => {
            // Sincronizar posição inicial
            if (sala.tempo_atual > 0) {
                this.player.currentTime(parseFloat(sala.tempo_atual));
            }
            
            // Definir estado de play/pause
            if (sala.pausado) {
                this.player.pause();
            } else {
                this.player.play();
            }
        });
    }
    
    iniciarSincronizacao() {
        this.syncInterval = setInterval(() => {
            this.sincronizar();
        }, 2000); // Sincronizar a cada 2 segundos
    }
    
    async sincronizar() {
        if (this.isSyncing) return;
        
        try {
            const response = await fetch(`api/sync_sala.php?sala_id=${this.salaId}`);
            const data = await response.json();
            
            if (data.success) {
                this.atualizarInterface(data);
                
                // Sincronizar player apenas se não for o líder
                if (!this.isLider && this.player && data.sala) {
                    this.sincronizarPlayer(data.sala);
                }
                
                this.atualizarStatusSync('Sincronizado');
            }
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.atualizarStatusSync('Erro de sincronização', true);
        }
    }
    
    sincronizarPlayer(sala) {
        if (!this.player.readyState()) return;
        
        const tempoAtual = this.player.currentTime();
        const tempoServidor = parseFloat(sala.tempo_atual);
        const diferenca = Math.abs(tempoAtual - tempoServidor);
        
        // Sincronizar se diferença for maior que 3 segundos
        if (diferenca > 3) {
            this.isSyncing = true;
            this.player.currentTime(tempoServidor);
            setTimeout(() => { this.isSyncing = false; }, 1000);
        }
        
        // Sincronizar play/pause
        if (sala.pausado && !this.player.paused()) {
            this.player.pause();
        } else if (!sala.pausado && this.player.paused()) {
            this.player.play();
        }
    }
    
    async sincronizarEstado() {
        if (!this.isLider || !this.player) return;
        
        try {
            await fetch('api/update_player_sala.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sala_id: this.salaId,
                    tempo_atual: this.player.currentTime(),
                    pausado: this.player.paused()
                })
            });
        } catch (error) {
            console.error('Erro ao sincronizar estado:', error);
        }
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
        const status = document.getElementById('syncMessage');
        status.textContent = message;
        status.style.color = isError ? '#f44336' : '#4CAF50';
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
    if (salaPlayer.player.isFullscreen()) {
        salaPlayer.player.exitFullscreen();
    } else {
        salaPlayer.player.requestFullscreen();
    }
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

function copiarCodigo() {
    const codigo = document.getElementById('salaCodigo').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        alert('Código copiado!');
    });
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

// Limpar intervalo ao sair da página
window.addEventListener('beforeunload', function() {
    if (salaPlayer && salaPlayer.syncInterval) {
        clearInterval(salaPlayer.syncInterval);
    }
});