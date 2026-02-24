class SalaPlayer {
    constructor() {
        this.salaId = new URLSearchParams(window.location.search).get('id');
        this.player = null;
        this.isLider = false;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.isSyncing = false;
        this.ws = null;
        this.userId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.spriteLoaded = false;
        this.spriteUrl = null;
        
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
        this.conectarWebSocket();
        this.iniciarSincronizacao();
    }
    
    async carregarSala() {
        try {
            // Obter user_id da sessão
            const userResponse = await fetch('api/get_user_session.php');
            const userData = await userResponse.json();
            if (userData.success) {
                this.userId = userData.user_id;
            console.log('User ID obtido:', this.userId);
            console.log('Sala ID:', this.salaId);
            }
            
            // Tentar reconectar usando sala_id diretamente
            const reconnectResponse = await fetch('api/entrar_sala.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sala_id: this.salaId })
            });
            const reconnectData = await reconnectResponse.json();
            
            if (reconnectData.success) {
                console.log('Reconectado automaticamente na sala');
            }
            
            // Verificar se precisa promover novo líder
            await this.verificarLideranca();
            
            const response = await fetch(`api/sync_sala.php?sala_id=${this.salaId}`);
            const data = await response.json();
            console.log('Dados da sala:', data);
            
            if (!data.success) {
                alert(data.error || 'Erro ao carregar sala');
                window.location.href = 'salas.php';
                return;
            }
            
            this.isLider = data.is_lider;
            console.log('Is Líder:', this.isLider);
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
        this.atualizarListaParticipantes(participantes);
        
        // Atualizar mensagens
        this.atualizarMensagens(mensagens);
        
        // Configurar player se necessário
        if (this.player && sala && sala.titulo_id) {
            console.log('Configurando vídeo:', sala.titulo_path);
            this.configurarVideo(sala);
        } else if (sala && sala.titulo_id) {
            console.log('Player ainda não inicializado, aguardando...');
            // Aguardar player estar pronto
            setTimeout(() => {
                if (this.player) {
                    console.log('Player agora disponível, configurando vídeo');
                    this.configurarVideo(sala);
                }
            }, 1000);
        } else {
            console.log('Player não configurado:', { player: !!this.player, sala: !!sala, titulo_id: sala?.titulo_id });
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
                console.log('Configurando controles para visitante');
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
            } else {
                console.log('Configurando controles para líder');
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
        
        // Só esconder automaticamente se estiver em fullscreen E o vídeo estiver tocando
        if (document.fullscreenElement && !this.player.paused()) {
            this.hideTimeout = setTimeout(() => {
                controls.classList.add('hidden');
            }, 3000);
        }
    }
    
    handleKeyboard(e) {
        // Não executar atalhos se estiver digitando no chat
        if (document.activeElement && document.activeElement.id === 'messageInput') {
            return;
        }
        
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
        console.log('configurarVideo chamado:', sala.titulo_path);
        if (!sala.titulo_path || this.player.src() === `video.php?path=${encodeURIComponent(sala.titulo_path)}`) {
            console.log('Vídeo já carregado ou sem path');
            return;
        }
        
        console.log('Carregando vídeo:', sala.titulo_path);
        this.player.src({
            src: `video.php?path=${encodeURIComponent(sala.titulo_path)}`,
            type: 'video/mp4'
        });
        
        // Carregar sprite
        this.carregarSprite(sala.titulo_id);
        
        this.player.ready(() => {
            console.log('Vídeo pronto');
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
    
    conectarWebSocket() {
        // Evitar múltiplas tentativas simultâneas
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket já tentando conectar...');
            return;
        }
        
        try {
            // Usar o domínio atual ou localhost
            const hostname = window.location.hostname;
            let wsUrl;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                wsUrl = `ws://${hostname}:8080`;
            } else {
                // Para domínios externos, usar porta 8080 diretamente
                wsUrl = `ws://${hostname}:8080`;
            }
            
            this.ws = new WebSocket(wsUrl);
            console.log('Conectando WebSocket em:', wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket conectado');
                this.reconnectAttempts = 0; // Reset contador
                // Aguardar um pouco mais para garantir que o player está pronto
                setTimeout(() => {
                    const joinMessage = {
                        type: 'join_sala',
                        sala_id: parseInt(this.salaId),
                        user_id: this.userId
                    };
                    console.log('Enviando join_sala:', joinMessage);
                    this.ws.send(JSON.stringify(joinMessage));
                }, 500); // Aumentado de 100ms para 500ms
                this.atualizarStatusSync('Conectado');
                
                // Iniciar heartbeat
                this.startHeartbeat();
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('WebSocket mensagem recebida:', data);
                this.handleWebSocketMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket desconectado');
                this.atualizarStatusSync('Desconectado', true);
                this.stopHeartbeat();
                this.iniciarPollingFallback();
            };
            
            this.ws.onerror = (error) => {
                console.error('Erro WebSocket:', error);
                this.atualizarStatusSync('Erro', true);
                // Tentar reconectar apenas se não excedeu limite
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        console.log(`Tentando reconectar WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        this.conectarWebSocket();
                    }, 2000);
                } else {
                    console.log('Máximo de tentativas de reconexão atingido, usando apenas HTTP');
                }
            };
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
            this.iniciarPollingFallback();
        }
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'player_state':
                console.log('Estado do player recebido:', data.data);
                if (!this.isLider) {
                    this.aplicarSincronizacao(data.data);
                }
                this.atualizarStatusSync('Sincronizado');
                break;
            case 'chat_message':
                console.log('Mensagem de chat recebida:', data.data);
                this.adicionarMensagemChat(data.data);
                break;
            case 'error':
                console.error('Erro WebSocket:', data.message);
                this.atualizarStatusSync('Erro', true);
                break;
            case 'pong':
                console.log('Pong recebido');
                break;
        }
    }
    
    iniciarPollingFallback() {
        console.log('Usando polling HTTP como fallback');
        this.atualizarStatusSync('HTTP Polling');
        if (!this.isLider) {
            this.syncInterval = setInterval(() => {
                this.sincronizarComoVisitante();
            }, 5000); // Reduzido para 5s já que não temos WebSocket
        }
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Ping a cada 30 segundos
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    iniciarSincronizacao() {
        // Líder: sincroniza estado quando há mudanças
        if (this.isLider) {
            this.setupLiderEvents();
        }
        
        // Atualizar participantes periodicamente
        this.participantesInterval = setInterval(() => {
            this.atualizarParticipantes();
        }, 5000);
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
        
        console.log(`Líder enviando estado: ${acao}`, { tempoVideo, pausado, timestamp });
        
        // Enviar via WebSocket se conectado
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'player_update',
                sala_id: parseInt(this.salaId),
                tempo_atual: tempoVideo,
                pausado: pausado,
                timestamp: timestamp
            };
            console.log('Enviando via WebSocket:', message);
            this.ws.send(JSON.stringify(message));
        } else {
            console.log('WebSocket não conectado, usando HTTP fallback');
            // Fallback para HTTP
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
        console.log('Aplicando sincronização:', estado);
        if (!this.player || !this.player.readyState()) {
            console.log('Player não está pronto, aguardando...');
            setTimeout(() => this.aplicarSincronizacao(estado), 500);
            return;
        }
        
        const agora = Date.now();
        const tempoDecorrido = (agora - estado.timestamp) / 1000;
        const tempoCalculado = estado.pausado ? estado.tempo_atual : estado.tempo_atual + tempoDecorrido;
        
        console.log('Sincronização:', {
            pausado_lider: estado.pausado,
            pausado_meu: this.player.paused(),
            tempo_lider: estado.tempo_atual,
            tempo_calculado: tempoCalculado,
            meu_tempo: this.player.currentTime(),
            diferenca: Math.abs(tempoCalculado - this.player.currentTime())
        });
        
        // SEMPRE sincronizar play/pause imediatamente
        if (estado.pausado && !this.player.paused()) {
            console.log('PAUSANDO player (líder pausou)');
            this.player.pause();
            const playBtn = document.getElementById('playBtn');
            if (playBtn) playBtn.textContent = '▶';
        } else if (!estado.pausado && this.player.paused()) {
            console.log('INICIANDO player (líder iniciou)');
            this.player.play().catch(e => console.log('Erro ao iniciar:', e));
            const playBtn = document.getElementById('playBtn');
            if (playBtn) playBtn.textContent = '⏸';
        }
        
        // SEMPRE sincronizar tempo se diferença > 1s
        const meuTempo = this.player.currentTime();
        const diferenca = Math.abs(tempoCalculado - meuTempo);
        
        if (diferenca > 1) {
            console.log(`AJUSTANDO tempo: ${meuTempo} -> ${tempoCalculado}`);
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
    
    async atualizarParticipantes() {
        try {
            const response = await fetch(`api/sync_sala.php?sala_id=${this.salaId}&chat_only=1`);
            const data = await response.json();
            
            if (data.success && data.participantes) {
                this.atualizarListaParticipantes(data.participantes);
            }
        } catch (error) {
            console.error('Erro ao atualizar participantes:', error);
        }
    }
    
    atualizarListaParticipantes(participantes) {
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
    
    adicionarMensagemChat(mensagem) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-user">${this.escapeHtml(mensagem.usuario_nome)}</span>
                <span class="message-time">${this.formatarTempo(mensagem.enviado_em)}</span>
            </div>
            <div class="message-text">${this.escapeHtml(mensagem.mensagem)}</div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        // Mostrar notificação em fullscreen
        if (document.fullscreenElement) {
            this.mostrarNotificacaoFullscreen(mensagem);
        }
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
    
    mostrarNotificacaoFullscreen(mensagem) {
        console.log('Tentando mostrar notificação fullscreen:', mensagem);
        console.log('Está em fullscreen:', !!document.fullscreenElement);
        
        // Encontrar o container em fullscreen
        const fullscreenElement = document.fullscreenElement;
        if (!fullscreenElement) return;
        
        // Criar notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            bottom: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid #e50914;
            max-width: 300px;
            z-index: 999999;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            animation: slideInRight 0.3s ease-out;
            pointer-events: none;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: #e50914;">
                ${this.escapeHtml(mensagem.usuario_nome)}
            </div>
            <div style="line-height: 1.4;">
                ${this.escapeHtml(mensagem.mensagem)}
            </div>
        `;
        
        // Adicionar CSS da animação se não existir
        if (!document.getElementById('fullscreen-chat-styles')) {
            const style = document.createElement('style');
            style.id = 'fullscreen-chat-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Adicionar ao elemento em fullscreen em vez do body
        fullscreenElement.appendChild(notification);
        console.log('Notificação adicionada ao elemento fullscreen');
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    carregarSprite(tituloId) {
        if (!tituloId) return;
        
        fetch(`api/get_sprite.php?idTitulo=${tituloId}`)
            .then(r => r.json())
            .then(data => {
                if (data.sprite) {
                    this.spriteUrl = data.sprite;
                    this.spriteLoaded = true;
                    const preview = document.getElementById('spritePreview');
                    preview.style.backgroundImage = `url(${data.sprite})`;
                    console.log('Sprite carregado:', data.sprite);
                } else {
                    this.spriteLoaded = false;
                    this.spriteUrl = null;
                    console.log('Sprite não encontrado');
                }
            })
            .catch(err => {
                console.error('Erro ao carregar sprite:', err);
                this.spriteLoaded = false;
            });
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
    
    async verificarLideranca() {
        try {
            const response = await fetch(`api/promover_lider.php?sala_id=${this.salaId}`);
            const data = await response.json();
            
            if (data.success && data.promoted && data.new_leader_id == this.userId) {
                console.log('Promovido a líder!');
                this.isLider = true;
                this.atualizarStatusSync('Promovido a Líder');
            }
        } catch (error) {
            console.error('Erro ao verificar liderança:', error);
        }
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
    
    if (!salaPlayer.player || !salaPlayer.player.readyState()) {
        console.log('Player não está pronto para seek');
        return;
    }
    
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const duration = salaPlayer.player.duration();
    
    if (duration && isFinite(duration)) {
        const newTime = duration * percent;
        if (isFinite(newTime)) {
            salaPlayer.player.currentTime(newTime);
        }
    }
}

function toggleFullscreen() {
    salaPlayer.toggleFullscreen();
}

async function enviarMensagem() {
    const input = document.getElementById('messageInput');
    const mensagem = input.value.trim();
    
    if (!mensagem) return;
    
    // Tentar enviar via WebSocket primeiro
    if (salaPlayer.ws && salaPlayer.ws.readyState === WebSocket.OPEN) {
        console.log('Enviando mensagem via WebSocket');
        salaPlayer.ws.send(JSON.stringify({
            type: 'chat_message',
            sala_id: parseInt(salaPlayer.salaId),
            mensagem: mensagem
        }));
        input.value = '';
    } else {
        console.log('WebSocket não conectado, usando HTTP fallback');
        // Fallback para HTTP
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
                // Forçar atualização do chat
                setTimeout(() => salaPlayer.carregarSala(), 500);
            } else {
                alert(data.error || 'Erro ao enviar mensagem');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        enviarMensagem();
    }
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

function addEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
    document.getElementById('emojiPicker').style.display = 'none';
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
    if (!salaPlayer.player || !salaPlayer.player.duration() || !salaPlayer.spriteLoaded) return;
    
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const duration = salaPlayer.player.duration();
    const time = duration * percent;
    
    const preview = document.getElementById('spritePreview');
    const timeDisplay = document.getElementById('spriteTime');
    
    // Calcular posição do sprite (grid 10x10)
    const frameIndex = Math.floor(percent * 100);
    const row = Math.floor(frameIndex / 10);
    const col = frameIndex % 10;
    
    // Posicionar preview igual ao player principal
    preview.style.left = event.clientX - rect.left + 'px';
    preview.style.backgroundPosition = `-${col * 160}px -${row * 90}px`;
    
    // Mostrar tempo
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    timeDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    preview.style.display = 'block';
}

function hidePreview() {
    const preview = document.getElementById('spritePreview');
    preview.style.display = 'none';
}

function sincronizarManual() {
    if (salaPlayer && !salaPlayer.isLider) {
        salaPlayer.sincronizarComoVisitante();
    }
}

function sairSala() {
    // Criar modal de confirmação
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: #181818; border-radius: 8px; padding: 30px;
            border: 1px solid #333; max-width: 400px; text-align: center;
        ">
            <h3 style="color: white; margin: 0 0 20px 0;">🚪 Sair da Sala</h3>
            <p style="color: #ccc; margin: 0 0 30px 0;">Tem certeza que deseja sair da sala?</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="this.closest('div').remove()" style="
                    padding: 10px 20px; background: #333; color: white;
                    border: none; border-radius: 6px; cursor: pointer;
                ">Cancelar</button>
                <button onclick="window.location.href='salas.php'" style="
                    padding: 10px 20px; background: #e50914; color: white;
                    border: none; border-radius: 6px; cursor: pointer;
                ">Sair</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    salaPlayer = new SalaPlayer();
});

// Limpar intervalos ao sair da página
window.addEventListener('beforeunload', function() {
    if (salaPlayer) {
        if (salaPlayer.syncInterval) clearInterval(salaPlayer.syncInterval);
        if (salaPlayer.heartbeatInterval) clearInterval(salaPlayer.heartbeatInterval);
        if (salaPlayer.participantesInterval) clearInterval(salaPlayer.participantesInterval);
        if (salaPlayer.ws) {
            salaPlayer.ws.send(JSON.stringify({
                type: 'leave_sala',
                sala_id: salaPlayer.salaId
            }));
            salaPlayer.ws.close();
        }
    }
});