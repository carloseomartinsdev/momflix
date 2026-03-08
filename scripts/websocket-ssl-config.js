// Configuração SSL para WebSocket
// Ajuste os caminhos dos certificados conforme sua configuração

const path = require('path');

// Opções de configuração SSL
const sslConfig = {
    // Opção 1: Certificados no diretório do projeto
    local: {
        key: path.join(__dirname, 'ssl', 'private.key'),
        cert: path.join(__dirname, 'ssl', 'certificate.crt')
    },
    
    // Opção 2: Certificados do Apache/Nginx (ajuste os caminhos)
    apache: {
        key: 'C:/xampp/apache/conf/ssl.key/server.key',
        cert: 'C:/xampp/apache/conf/ssl.crt/server.crt'
    },
    
    // Opção 3: Certificados MomFlix
    custom: {
        key: 'C:/xampp/apache/conf/ssl.crt/momflix.momsys.com.br-key.pem',
        cert: 'C:/xampp/apache/conf/ssl.crt/momflix.momsys.com.br-crt.pem'
    }
};

// Escolha qual configuração usar (local, apache, custom)
const activeConfig = 'custom';

module.exports = sslConfig[activeConfig];