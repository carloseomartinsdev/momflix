<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salas - MomFlix</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/salas.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-content">
                <h1>🎬 Salas de Cinema</h1>
                <button onclick="window.location.href='index.php'" class="btn-voltar">← Voltar</button>
            </div>
        </header>

        <div class="salas-actions">
            <button onclick="mostrarModalCriar()" class="btn-criar">+ Criar Sala</button>
            <button onclick="mostrarModalEntrar()" class="btn-entrar">🔗 Entrar na Sala</button>
        </div>

        <div class="minhas-salas">
            <h2>Minhas Salas Ativas</h2>
            <div id="listaSalas" class="salas-grid"></div>
        </div>
    </div>

    <!-- Modal Criar Sala -->
    <div id="modalCriar" class="modal">
        <div class="modal-content">
            <h3>Criar Nova Sala</h3>
            <input type="text" id="nomeSala" placeholder="Nome da sala" maxlength="100">
            <div class="titulo-selector">
                <input type="text" id="buscaTitulo" placeholder="Buscar título..." onkeyup="buscarTitulos()">
                <div id="resultadosTitulos" class="resultados-busca"></div>
            </div>
            <div class="modal-actions">
                <button onclick="criarSala()" class="btn-confirmar">Criar</button>
                <button onclick="fecharModal('modalCriar')" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    </div>

    <!-- Modal Entrar Sala -->
    <div id="modalEntrar" class="modal">
        <div class="modal-content">
            <h3>Entrar na Sala</h3>
            <input type="text" id="codigoSala" placeholder="Código da sala (ex: ABC123)" maxlength="6" style="text-transform: uppercase;">
            <div class="modal-actions">
                <button onclick="entrarSala()" class="btn-confirmar">Entrar</button>
                <button onclick="fecharModal('modalEntrar')" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    </div>

    <script src="assets/js/salas.js"></script>
</body>
</html>