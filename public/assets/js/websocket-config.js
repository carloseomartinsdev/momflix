// Configuração do WebSocket
const WEBSOCKET_CONFIG = {
    // URL do servidor WebSocket no servidor home
    // Altere para o IP/domínio do seu servidor home
    HOME_SERVER_URL: 'wss://SEU_IP_OU_DOMINIO:8080',
    
    // Fallback para polling se WebSocket falhar
    USE_POLLING_FALLBACK: true,
    POLLING_INTERVAL: 2000
};
