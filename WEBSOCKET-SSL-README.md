# Configuração WebSocket SSL para HTTPS

## Problema
O WebSocket estava configurado apenas para HTTP (`ws://`), causando erro quando o site roda em HTTPS, pois navegadores bloqueiam conexões WebSocket não seguras (`ws://`) em páginas HTTPS.

## Solução
O servidor WebSocket agora suporta SSL/TLS (`wss://`) e detecta automaticamente se deve usar conexão segura ou não.

## Configuração

### Opção 1: Usar certificados existentes do servidor
1. Edite o arquivo `websocket-ssl-config.js`
2. Ajuste os caminhos para seus certificados SSL:
```javascript
custom: {
    key: 'C:/caminho/para/sua/chave-privada.key',
    cert: 'C:/caminho/para/seu/certificado.crt'
}
```
3. Mude `activeConfig = 'custom'`

### Opção 2: Copiar certificados para o projeto
1. Crie a pasta `ssl/` no projeto
2. Copie seus certificados:
   - `ssl/private.key` (chave privada)
   - `ssl/certificate.crt` (certificado)
3. Use `activeConfig = 'local'`

### Opção 3: Script automático
Execute `start-websocket-ssl.bat` que tentará encontrar e copiar automaticamente os certificados do XAMPP/WAMP.

## Como funciona

### Servidor WebSocket
- Tenta carregar certificados SSL
- Se encontrar: inicia servidor HTTPS com WSS na porta 8080
- Se não encontrar: fallback para HTTP com WS na porta 8080

### Cliente JavaScript
- Detecta automaticamente o protocolo da página
- HTTPS → usa `wss://`
- HTTP → usa `ws://`

## Testando
1. Inicie o servidor: `node websocket-server.js`
2. Acesse sua aplicação via HTTPS
3. Verifique no console se aparece "Servidor WebSocket SEGURO rodando na porta 8080 (WSS)"

## Troubleshooting

### Erro "ENOENT: no such file or directory"
- Certificados não encontrados nos caminhos especificados
- Verifique os caminhos no arquivo `websocket-ssl-config.js`

### Erro "WebSocket connection failed"
- Verifique se a porta 8080 está liberada no firewall
- Confirme se o certificado é válido para o domínio

### Fallback para HTTP
- Se SSL falhar, o servidor automaticamente usa HTTP
- Funciona para desenvolvimento local, mas não para HTTPS em produção