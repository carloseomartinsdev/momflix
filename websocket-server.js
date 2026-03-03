console.log('Iniciando servidor WebSocket...');

const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar configuração SSL
let sslConfig;
try {
    sslConfig = require('./websocket-ssl-config.js');
} catch (error) {
    console.log('Arquivo de configuração SSL não encontrado, usando configuração padrão');
    sslConfig = {
        key: path.join(__dirname, 'ssl', 'private.key'),
        cert: path.join(__dirname, 'ssl', 'certificate.crt')
    };
}

console.log('Módulos carregados com sucesso');

// Configuração do banco
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mom_flix'
};

// Configuração SSL/HTTPS
let server;
let wss;

try {
    // Tentar carregar certificados SSL
    const sslOptions = {
        key: fs.readFileSync(sslConfig.key),
        cert: fs.readFileSync(sslConfig.cert)
    };
    
    console.log(`Tentando carregar certificados:`);
    console.log(`Key: ${sslConfig.key}`);
    console.log(`Cert: ${sslConfig.cert}`);
    
    // Criar servidor HTTPS
    server = https.createServer(sslOptions);
    wss = new WebSocket.Server({ 
        server,
        perMessageDeflate: false,
        clientTracking: true,
        verifyClient: (info) => {
            console.log(`Verificando cliente de: ${info.origin}`);
            return true;
        }
    });
    
    server.listen(8080, '0.0.0.0', () => {
        console.log('Servidor WebSocket SEGURO rodando na porta 8080 (WSS)');
    });
    
} catch (error) {
    console.log('Erro ao carregar certificados SSL:', error.message);
    console.log('Usando HTTP simples como fallback');
    
    // Fallback para HTTP simples
    wss = new WebSocket.Server({ 
        port: 8081,
        host: '0.0.0.0',
        perMessageDeflate: false,
        clientTracking: true,
        verifyClient: (info) => {
            console.log(`Verificando cliente de: ${info.origin}`);
            return true;
        }
    });
    
    console.log('Servidor WebSocket HTTP rodando na porta 8081 (WS)');
}
const salas = new Map(); // sala_id -> Set de conexões

// Ping interval para detectar conexões mortas
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log('Terminando conexão inativa');
            return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Limpeza automática de salas vazias a cada 5 minutos
const limpezaInterval = setInterval(async () => {
    console.log('Executando limpeza automática de salas...');
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Desativar salas sem participantes ativos há mais de 30 minutos
        const [result] = await connection.execute(`
            UPDATE salas s 
            SET ativo = 0 
            WHERE s.ativo = 1 
            AND NOT EXISTS (
                SELECT 1 FROM sala_participantes sp 
                WHERE sp.sala_id = s.id 
                AND sp.ativo = 1 
                AND sp.entrou_em > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            )
        `);
        
        if (result.affectedRows > 0) {
            console.log(`${result.affectedRows} salas desativadas automaticamente`);
        }
        
        await connection.end();
    } catch (error) {
        console.error('Erro na limpeza automática:', error);
    }
}, 300000); // 5 minutos

wss.on('connection', (ws, req) => {
    console.log(`Nova conexão WebSocket de ${req.socket.remoteAddress}`);
    ws.isAlive = true;
    
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    
    ws.on('message', async (message) => {
        console.log(`Mensagem recebida de ${ws.user_id || 'desconhecido'}:`, message.toString());
        try {
            const data = JSON.parse(message);
            console.log('Dados parseados:', data);
            
            switch (data.type) {
                case 'join_sala':
                    await joinSala(ws, data);
                    break;
                case 'player_update':
                    await playerUpdate(ws, data);
                    break;
                case 'chat_message':
                    await chatMessage(ws, data);
                    break;
                case 'audio_offer':
                    await handleAudioOffer(ws, data);
                    break;
                case 'audio_answer':
                    await handleAudioAnswer(ws, data);
                    break;
                case 'ice_candidate':
                    await handleIceCandidate(ws, data);
                    break;
                case 'join_audio_channel':
                    await handleJoinAudioChannel(ws, data);
                    break;
                case 'leave_sala':
                    leaveSala(ws, data.sala_id);
                    break;
                case 'ping':
                    console.log('Ping recebido, enviando pong');
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                default:
                    console.log('Tipo de mensagem desconhecido:', data.type);
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    });
    
    ws.on('close', (code, reason) => {
        console.log(`Conexão WebSocket fechada - Código: ${code}, Razão: ${reason}`);
        
        // Marcar participante como inativo no banco
        if (ws.user_id && ws.sala_id) {
            mysql.createConnection(dbConfig).then(async (connection) => {
                try {
                    await connection.execute(
                        'UPDATE sala_participantes SET ativo = 0 WHERE sala_id = ? AND usuario_id = ?',
                        [ws.sala_id, ws.user_id]
                    );
                    console.log(`Participante ${ws.user_id} marcado como inativo na sala ${ws.sala_id}`);
                } catch (error) {
                    console.error('Erro ao marcar participante como inativo:', error);
                } finally {
                    await connection.end();
                }
            });
        }
        
        // Remover conexão de todas as salas
        for (const [salaId, connections] of salas.entries()) {
            connections.delete(ws);
            if (connections.size === 0) {
                salas.delete(salaId);
                console.log(`Sala ${salaId} removida (sem conexões)`);
            }
        }
    });
    
    ws.on('error', (error) => {
        console.error('Erro na conexão WebSocket:', error);
    });
});

async function joinSala(ws, data) {
    const { sala_id, user_id } = data;
    console.log(`Tentativa de entrada na sala ${sala_id} pelo usuário ${user_id}`);
    
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Verificar se usuário está na sala (consulta rápida)
        const [rows] = await connection.execute(
            'SELECT 1 FROM sala_participantes WHERE sala_id = ? AND usuario_id = ? AND ativo = 1 LIMIT 1',
            [sala_id, user_id]
        );
        
        if (rows.length === 0) {
            console.log(`Usuário ${user_id} não autorizado na sala ${sala_id}`);
            ws.send(JSON.stringify({ type: 'error', message: 'Usuário não está na sala' }));
            return;
        }
        
        // Adicionar à sala
        if (!salas.has(sala_id)) {
            salas.set(sala_id, new Set());
            console.log(`Sala ${sala_id} criada`);
        }
        salas.get(sala_id).add(ws);
        ws.sala_id = sala_id;
        ws.user_id = user_id;
        
        console.log(`Usuário ${user_id} entrou na sala ${sala_id}. Total de conexões: ${salas.get(sala_id).size}`);
        
        // Enviar estado atual do player (consulta rápida)
        const [playerState] = await connection.execute(
            'SELECT tempo_atual, pausado, timestamp_acao FROM salas WHERE id = ? LIMIT 1',
            [sala_id]
        );
        
        if (playerState.length > 0) {
            const stateData = {
                type: 'player_state',
                data: {
                    tempo_atual: parseFloat(playerState[0].tempo_atual),
                    pausado: Boolean(playerState[0].pausado),
                    timestamp: parseInt(playerState[0].timestamp_acao)
                }
            };
            ws.send(JSON.stringify(stateData));
            console.log(`Estado do player enviado para usuário ${user_id}`);
        }
        
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Erro interno' }));
    } finally {
        if (connection) await connection.end();
    }
}

async function playerUpdate(ws, data) {
    const { sala_id, tempo_atual, pausado, timestamp } = data;
    console.log(`Atualização do player na sala ${sala_id}`);
    
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Verificar se é o líder (consulta rápida)
        const [rows] = await connection.execute(
            'SELECT lider_id FROM salas WHERE id = ? LIMIT 1',
            [sala_id]
        );
        
        if (rows.length === 0 || rows[0].lider_id !== ws.user_id) {
            console.log(`Usuário ${ws.user_id} tentou controlar sala ${sala_id} sem ser líder`);
            ws.send(JSON.stringify({ type: 'error', message: 'Apenas o líder pode controlar' }));
            return;
        }
        
        // Atualizar estado no banco
        await connection.execute(
            'UPDATE salas SET tempo_atual = ?, pausado = ?, timestamp_acao = ? WHERE id = ?',
            [tempo_atual, pausado ? 1 : 0, timestamp, sala_id]
        );
        
        console.log(`Estado atualizado no banco para sala ${sala_id}`);
        
        // Broadcast para todos na sala (exceto o remetente)
        const salaConnections = salas.get(sala_id);
        if (salaConnections) {
            const updateMessage = JSON.stringify({
                type: 'player_state',
                data: {
                    tempo_atual: parseFloat(tempo_atual),
                    pausado: Boolean(pausado),
                    timestamp: parseInt(timestamp)
                }
            });
            
            let broadcastCount = 0;
            salaConnections.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(updateMessage);
                    broadcastCount++;
                }
            });
            
            console.log(`Broadcast enviado para ${broadcastCount} clientes na sala ${sala_id}`);
        }
        
    } catch (error) {
        console.error('Erro ao atualizar player:', error);
    } finally {
        if (connection) await connection.end();
    }
}

async function chatMessage(ws, data) {
    const { sala_id, mensagem } = data;
    console.log(`Mensagem de chat na sala ${sala_id} do usuário ${ws.user_id}: "${mensagem}"`);
    
    if (!ws.user_id || !ws.sala_id) {
        console.log('Usuário não está em uma sala');
        ws.send(JSON.stringify({ type: 'error', message: 'Usuário não está em uma sala' }));
        return;
    }
    
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Verificar se usuário está na sala
        const [rows] = await connection.execute(
            'SELECT 1 FROM sala_participantes WHERE sala_id = ? AND usuario_id = ? AND ativo = 1 LIMIT 1',
            [parseInt(sala_id), ws.user_id]
        );
        
        if (rows.length === 0) {
            console.log(`Usuário ${ws.user_id} não autorizado na sala ${sala_id}`);
            ws.send(JSON.stringify({ type: 'error', message: 'Usuário não está na sala' }));
            return;
        }
        
        // Salvar mensagem no banco
        try {
            await connection.execute(
                'INSERT INTO sala_mensagens (sala_id, usuario_id, mensagem, enviado_em) VALUES (?, ?, ?, NOW())',
                [parseInt(sala_id), ws.user_id, mensagem]
            );
            console.log(`Mensagem salva no banco para sala ${sala_id}`);
        } catch (dbError) {
            console.error('Erro ao salvar mensagem no banco:', dbError);
            // Tentar criar a tabela se não existir
            try {
                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS sala_mensagens (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        sala_id INT NOT NULL,
                        usuario_id INT NOT NULL,
                        mensagem TEXT NOT NULL,
                        enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                // Tentar novamente
                await connection.execute(
                    'INSERT INTO sala_mensagens (sala_id, usuario_id, mensagem, enviado_em) VALUES (?, ?, ?, NOW())',
                    [parseInt(sala_id), ws.user_id, mensagem]
                );
                console.log(`Mensagem salva no banco após criar tabela para sala ${sala_id}`);
            } catch (createError) {
                console.error('Erro ao criar tabela e salvar mensagem:', createError);
                ws.send(JSON.stringify({ type: 'error', message: 'Erro ao salvar mensagem no banco' }));
                return;
            }
        }
        
        // Buscar dados do usuário para broadcast
        const [userData] = await connection.execute(
            'SELECT username FROM usuarios WHERE id = ? LIMIT 1',
            [ws.user_id]
        );
        
        if (userData.length > 0) {
            // Broadcast para todos na sala
            const salaConnections = salas.get(parseInt(sala_id));
            if (salaConnections) {
                const chatMessageData = {
                    type: 'chat_message',
                    data: {
                        usuario_nome: userData[0].username,
                        mensagem: mensagem,
                        enviado_em: new Date().toISOString()
                    }
                };
                
                const chatMessageStr = JSON.stringify(chatMessageData);
                console.log('Enviando mensagem de chat:', chatMessageData);
                
                let broadcastCount = 0;
                salaConnections.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(chatMessageStr);
                        broadcastCount++;
                    }
                });
                
                console.log(`Mensagem de chat enviada para ${broadcastCount} clientes na sala ${sala_id}`);
            } else {
                console.log(`Nenhuma conexão encontrada para sala ${sala_id}`);
            }
        } else {
            console.log(`Dados do usuário ${ws.user_id} não encontrados`);
        }
        
    } catch (error) {
        console.error('Erro ao processar mensagem de chat:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Erro ao enviar mensagem' }));
    } finally {
        if (connection) await connection.end();
    }
}

function leaveSala(ws, sala_id) {
    console.log(`Usuário ${ws.user_id || 'desconhecido'} saindo da sala ${sala_id}`);
    if (salas.has(sala_id)) {
        salas.get(sala_id).delete(ws);
        const remainingConnections = salas.get(sala_id).size;
        console.log(`Conexões restantes na sala ${sala_id}: ${remainingConnections}`);
        if (remainingConnections === 0) {
            salas.delete(sala_id);
            console.log(`Sala ${sala_id} removida (vazia)`);
        }
    }
}

// Handlers WebRTC para chamadas de áudio
async function handleJoinAudioChannel(ws, data) {
    const { sala_id, user_id, has_microphone, wants_to_listen } = data;
    console.log(`${user_id} entrando no canal - Mic: ${has_microphone}, Listen: ${wants_to_listen}`);
    
    // Adicionar ao canal
    if (!salas.has(parseInt(sala_id))) {
        salas.set(parseInt(sala_id), new Set());
    }
    salas.get(parseInt(sala_id)).add(ws);
    ws.sala_id = sala_id;
    ws.user_id = user_id;
    
    // Notificar todos no canal
    const canal = salas.get(parseInt(sala_id));
    canal.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'user_joined_audio',
                from_user: user_id,
                has_microphone: has_microphone,
                wants_to_listen: wants_to_listen
            }));
        }
    });
    
    console.log(`Canal tem ${canal.size} participantes`);
}

async function handleAudioOffer(ws, data) {
    const { sala_id, to_user, offer } = data;
    console.log(`Oferta de áudio na sala ${sala_id} para usuário ${to_user}`);
    
    const salaConnections = salas.get(parseInt(sala_id));
    if (salaConnections) {
        salaConnections.forEach(client => {
            if (client.user_id == to_user && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'audio_offer',
                    data: {
                        from_user: ws.user_id,
                        offer: offer
                    }
                }));
            }
        });
    }
}

async function handleAudioAnswer(ws, data) {
    const { sala_id, to_user, answer } = data;
    console.log(`Resposta de áudio na sala ${sala_id} para usuário ${to_user}`);
    
    const salaConnections = salas.get(parseInt(sala_id));
    if (salaConnections) {
        salaConnections.forEach(client => {
            if (client.user_id == to_user && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'audio_answer',
                    data: {
                        from_user: ws.user_id,
                        answer: answer
                    }
                }));
            }
        });
    }
}

async function handleIceCandidate(ws, data) {
    const { sala_id, to_user, candidate } = data;
    console.log(`ICE candidate na sala ${sala_id} para usuário ${to_user}`);
    
    const salaConnections = salas.get(parseInt(sala_id));
    if (salaConnections) {
        salaConnections.forEach(client => {
            if (client.user_id == to_user && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'ice_candidate',
                    data: {
                        from_user: ws.user_id,
                        candidate: candidate
                    }
                }));
            }
        });
    }
}