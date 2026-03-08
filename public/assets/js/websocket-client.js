// Cliente WebSocket para conectar ao servidor home
class SalaWebSocket {
    constructor(homeServerUrl) {
        this.url = homeServerUrl;
        this.ws = null;
        this.reconnectInterval = 5000;
        this.reconnectTimer = null;
        this.handlers = {};
    }

    connect(salaId, userId, username) {
        this.salaId = salaId;
        this.userId = userId;
        this.username = username;

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket conectado');
                this.send({
                    type: 'join',
                    sala_id: this.salaId,
                    user_id: this.userId,
                    username: this.username
                });
                
                if (this.handlers.onopen) {
                    this.handlers.onopen();
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (this.handlers[data.type]) {
                        this.handlers[data.type](data);
                    }
                } catch (error) {
                    console.error('Erro ao processar mensagem:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket erro:', error);
                if (this.handlers.onerror) {
                    this.handlers.onerror(error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket desconectado');
                if (this.handlers.onclose) {
                    this.handlers.onclose();
                }
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            console.log('Tentando reconectar...');
            this.connect(this.salaId, this.userId, this.username);
        }, this.reconnectInterval);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    sendPlayerState(tempoAtual, pausado) {
        this.send({
            type: 'player_state',
            tempo_atual: tempoAtual,
            pausado: pausado
        });
    }

    sendChat(mensagem) {
        this.send({
            type: 'chat',
            mensagem: mensagem
        });
    }

    on(event, handler) {
        this.handlers[event] = handler;
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Uso:
// const ws = new SalaWebSocket('wss://seu-ip-home:8080');
// ws.connect(salaId, userId, username);
// ws.on('player_state', (data) => { ... });
// ws.on('chat', (data) => { ... });
