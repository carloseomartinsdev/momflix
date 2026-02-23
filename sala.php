<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sala - MomFlix</title>
    <link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/sala-player.css">
    <script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
</head>
<body>
    <div class="sala-container">
        <!-- Header da Sala -->
        <div class="sala-header">
            <div class="sala-info">
                <h2 id="salaNome">Carregando...</h2>
                <span id="salaCodigo" class="codigo-badge"></span>
            </div>
            <div class="sala-actions">
                <button onclick="copiarCodigo()" class="btn-copiar">📋 Copiar Código</button>
                <button onclick="sairSala()" class="btn-sair">🚪 Sair</button>
            </div>
        </div>

        <div class="sala-content">
            <!-- Player -->
            <div class="player-section">
                <video id="salaPlayer" class="video-js vjs-default-skin" preload="auto"></video>
                <div class="player-controls" id="playerControls">
                    <button id="playBtn" onclick="togglePlay()">▶</button>
                    <div class="progress-container" onclick="seek(event)">
                        <div class="progress-bar" id="progressBar"></div>
                    </div>
                    <span id="timeDisplay">0:00 / 0:00</span>
                    <button onclick="toggleFullscreen()">⛶</button>
                </div>
                <div class="sync-status" id="syncStatus">
                    <span id="syncMessage">Sincronizando...</span>
                </div>
            </div>

            <!-- Chat -->
            <div class="chat-section">
                <div class="chat-header">
                    <h3>💬 Chat da Sala</h3>
                    <div class="participantes-count" id="participantesCount">0 participantes</div>
                </div>
                
                <div class="participantes-list" id="participantesList"></div>
                
                <div class="chat-messages" id="chatMessages"></div>
                
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Digite sua mensagem..." maxlength="500" onkeypress="handleEnter(event)">
                    <button onclick="enviarMensagem()">Enviar</button>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/sala-player.js"></script>
</body>
</html>