# WebSocket Home Server - Configuração

## Pré-requisitos
- Node.js instalado no servidor home
- Certificado SSL (já existe em `/ssl/`)
- Porta 8080 liberada no firewall e roteador

## Instalação

1. Instalar dependências:
```bash
cd scripts
npm install ws
```

## Configuração

### 1. Servidor Home (Windows)

Execute o script:
```
scripts\start-websocket-home.bat
```

Ou manualmente:
```bash
cd scripts
node websocket-home-server.js
```

### 2. Liberar Porta no Roteador

- Acesse o painel do roteador
- Crie redirecionamento de porta:
  - Porta Externa: 8080
  - Porta Interna: 8080
  - IP: IP local do servidor home
  - Protocolo: TCP

### 3. Configurar no Servidor Online

Edite o arquivo `public/assets/js/websocket-config.js`:

```javascript
HOME_SERVER_URL: 'wss://SEU_IP_OU_DOMINIO:8080'
```

Substitua por:
- IP público do servidor home, OU
- Domínio apontando para o servidor home

Exemplo:
```javascript
HOME_SERVER_URL: 'wss://home.momsys.com.br:8080'
```

### 4. Testar

Acesse no navegador:
```
https://flix.momsys.com.br/test-websocket-home.html
```

Configure a URL do WebSocket e clique em "Conectar"

## Uso na Aplicação

Incluir no HTML da sala:
```html
<script src="assets/js/websocket-config.js"></script>
<script src="assets/js/websocket-client.js"></script>
```

No JavaScript:
```javascript
const ws = new SalaWebSocket(WEBSOCKET_CONFIG.HOME_SERVER_URL);
ws.connect(salaId, userId, username);

ws.on('player_state', (data) => {
    // Atualizar player
});

ws.on('chat', (data) => {
    // Mostrar mensagem
});

// Enviar eventos
ws.sendPlayerState(tempoAtual, pausado);
ws.sendChat(mensagem);
```

## Troubleshooting

### Erro de conexão
- Verificar se o servidor Node.js está rodando
- Verificar se a porta 8080 está aberta no firewall
- Verificar redirecionamento de porta no roteador
- Testar localmente primeiro: `wss://localhost:8080`

### Erro de SSL
- Verificar se os certificados existem em `/ssl/`
- Certificados devem ser válidos para o domínio/IP usado

### Reconexão automática
O cliente tenta reconectar automaticamente a cada 5 segundos se a conexão cair.
