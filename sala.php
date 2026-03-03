<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit;
}
?>
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
                <h2 id="salaNome">Sala: Carregando... <span id="salaCodigo" class="codigo-badge"></span></h2>
            </div>
            <div class="sala-actions">
                <span id="syncStatus" class="sync-badge">Sincronizando...</span>
                <button onclick="sairSala()" class="btn-sair">Sair</button>
            </div>
        </div>

        <div class="sala-content">
            <!-- Player -->
            <div class="player-section">
                <video id="salaPlayer" class="video-js vjs-default-skin" preload="auto"></video>
                <div class="custom-controls" id="customControls">
                    <button id="playBtn" class="control-btn" onclick="togglePlay()">▶</button>
                    <div class="progress-container" onclick="seek(event)" onmousemove="showPreview(event)" onmouseleave="hidePreview()">
                        <div class="progress-bar" id="progressBar"></div>
                        <div class="sprite-preview" id="spritePreview">
                            <div class="sprite-time" id="spriteTime"></div>
                        </div>
                    </div>
                    <span class="time-display" id="timeDisplay">0:00 / 0:00</span>
                    <button id="volumeBtn" class="control-btn" onclick="toggleMute()">🔊</button>
                    <input type="range" id="volumeSlider" min="0" max="100" value="100" onchange="changeVolume()">
                    <select id="speedSelect" class="speed-select" onchange="changeSpeed()">
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1" selected>1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                    </select>
                    <button class="control-btn" onclick="toggleFullscreen()">⛶</button>
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
                    <button id="audioBtn" class="audio-btn" onclick="toggleAudio()" title="Ligar áudio">🔇</button>
                    <button id="micBtn" class="audio-btn" onclick="toggleMicrofone()" title="Ligar microfone">🎤</button>
                    <input type="text" id="messageInput" placeholder="Digite sua mensagem..." maxlength="500" onkeypress="handleEnter(event)">
                    <button class="emoji-btn" onclick="toggleEmojiPicker()">😊</button>
                    <button onclick="enviarMensagem()">Enviar</button>
                    <div class="emoji-picker" id="emojiPicker" style="display: none;">
                        <div class="emoji-grid">
                            <span onclick="addEmoji('😀')">😀</span>
                            <span onclick="addEmoji('😂')">😂</span>
                            <span onclick="addEmoji('😍')">😍</span>
                            <span onclick="addEmoji('😎')">😎</span>
                            <span onclick="addEmoji('😊')">😊</span>
                            <span onclick="addEmoji('😉')">😉</span>
                            <span onclick="addEmoji('😘')">😘</span>
                            <span onclick="addEmoji('😜')">😜</span>
                            <span onclick="addEmoji('🙄')">🙄</span>
                            <span onclick="addEmoji('😏')">😏</span>
                            <span onclick="addEmoji('😢')">😢</span>
                            <span onclick="addEmoji('😭')">😭</span>
                            <span onclick="addEmoji('😱')">😱</span>
                            <span onclick="addEmoji('😡')">😡</span>
                            <span onclick="addEmoji('😌')">😌</span>
                            <span onclick="addEmoji('😴')">😴</span>
                            <span onclick="addEmoji('👍')">👍</span>
                            <span onclick="addEmoji('👎')">👎</span>
                            <span onclick="addEmoji('👏')">👏</span>
                            <span onclick="addEmoji('❤️')">❤️</span>
                            <span onclick="addEmoji('🔥')">🔥</span>
                            <span onclick="addEmoji('🎉')">🎉</span>
                            <span onclick="addEmoji('🎆')">🎆</span>
                            <span onclick="addEmoji('🎈')">🎈</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/sala-player.js"></script>
</body>
</html>