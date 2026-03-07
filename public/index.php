<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit;
}

require_once '../config/database.php';
$stmt = $pdo->prepare("SELECT username, profile_icon FROM usuarios WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$username = $user['username'];
$profileIcon = $user['profile_icon'] ?? '👤';
$isAdmin = $_SESSION['is_admin'] ?? false;
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MomFlix</title>
    
    <!-- PWA Meta Tags -->
    <meta name="description" content="Plataforma de streaming de filmes e séries">
    <meta name="theme-color" content="#e50914">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="MomFlix">
    
    <!-- Icons -->
    <link rel="icon" href="favicon.ico">
    <link rel="apple-touch-icon" href="logoS.png">
    
    <!-- Web App Manifest -->
    <link rel="manifest" href="site.webmanifest">
    
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/header.css">
    <link rel="stylesheet" href="assets/css/cards.css">
    <link rel="stylesheet" href="assets/css/badges.css">
    <link rel="stylesheet" href="assets/css/modals.css">
</head>
<body>
<header>
    <h1><a href="index.php" style="color: #e50914; text-decoration: none;">MomFlix</a></h1>
    <div class="filtros">
        <input id="search" type="text" placeholder="Buscar por nome..." onkeyup="aplicarFiltros()">
        <select id="tipoFiltro" onchange="aplicarFiltros()">
            <option value="todos">Todos os tipos</option>
        </select>
        <select id="generoFiltro" onchange="aplicarFiltros()">
            <option value="todos">Todos os gêneros</option>
        </select>
        
        <button onclick="App.aleatorio()" class="btn-header" style="font-size: 14px;">🎲 Aleatório</button>
        <button onclick="window.location.href='salas.php'" class="btn-header" style="font-size: 14px;">🎬 Salas</button>
        
        <div class="menu-dropdown">
            <button class="menu-btn" onclick="Header.toggleMenu()" style="padding: 3px 12px;"><span style="font-size: 24px;"><?php echo $profileIcon; ?></span> <span style="font-size: 12px;">▼</span></button>
            <div class="menu-content" id="menuDropdown">
                <div class="menu-user-section">
                    <div class="menu-user-icon" onclick="ModalPerfil.abrir()">
                        <span style="font-size: 48px;"><?php echo $profileIcon; ?></span>
                        <span class="menu-user-edit">✏️</span>
                    </div>
                    <div class="menu-user-name"><?php echo htmlspecialchars($username); ?></div>
                    <button class="menu-item" onclick="ModalSenha.abrir()">🔑 Alterar Senha</button>
                </div>
                <div class="menu-divider"></div>
                <button class="menu-item" onclick="ModalEstatisticas.abrir()">📊 Estatísticas</button>
                <button class="menu-item" onclick="ModalHistorico.abrir()">📅 Histórico</button>
                <?php if ($isAdmin): ?>
                <a href="usuarios.php" class="menu-item">👥 Usuários</a>
                <?php endif; ?>
                <a href="logout_page.html" class="menu-item">🚪 Sair</a>
            </div>
        </div>
    </div>
</header>

<main>
    <div id="categorias"></div>
    <div id="semItens" class="sem-itens" style="display:none;">Nenhum item corresponde ao filtro.</div>
</main>

<!-- Modal de Título -->
<div id="modalTitulo" class="modal-overlay" onclick="fecharModal()">
    <div class="modal" onclick="event.stopPropagation()">
        <div id="modalTituloHeader" class="modal-header"></div>
        <div class="modal-body" id="modalTituloBody"></div>
    </div>
</div>

<!-- Player Iframe -->
<div id="iframePlayerModal" class="iframe-player-modal">
    <iframe id="iframePlayerFrame" class="iframe-player-frame" allowfullscreen></iframe>
</div>

<script src="assets/js/api.js"></script>
<script src="assets/js/components/header.js"></script>
<script src="assets/js/components/cards.js"></script>
<script src="assets/js/components/categorias.js"></script>
<script src="assets/js/components/scroll.js"></script>
<script src="assets/js/utils/filtros.js"></script>
<script src="assets/js/modal.js"></script>
<script src="assets/js/modals/modal-perfil.js"></script>
<script src="assets/js/modals/modal-estatisticas.js"></script>
<script src="assets/js/modals/modal-senha.js"></script>
<script src="assets/js/modals/modal-historico.js"></script>
<script src="assets/js/modals/modal-editar.js"></script>
<script src="assets/js/player.js"></script>
<script src="assets/js/app.js"></script>

<!-- Service Worker Registration -->
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(registrationError => console.log('SW registration failed'));
  });
}
</script>
</body>
</html>
