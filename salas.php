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
    <header>
        <h1>🎬 Salas de Cinema</h1>
        <div style="margin-left: auto;">
            <button onclick="window.location.href='index.php'" class="btn-voltar">← Voltar</button>
        </div>
    </header>

    <main>
        <div class="salas-actions">
            <button onclick="mostrarModalCriar()" class="btn-criar">+ Criar Sala</button>
            <button onclick="mostrarModalEntrar()" class="btn-entrar">🔗 Entrar na Sala</button>
        </div>

        <div class="minhas-salas">
            <h2>Minhas Salas Ativas</h2>
            <div id="listaSalas" class="salas-grid"></div>
        </div>
    </main>

    <!-- Modal Criar Sala -->
    <div id="modalCriar" class="sala-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎬 Criar Nova Sala</h3>
                <span class="modal-close" onclick="fecharModal('modalCriar')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="nomeSala">Nome da Sala</label>
                    <input type="text" id="nomeSala" placeholder="Digite o nome da sala" maxlength="100">
                </div>
                <div class="form-group">
                    <label for="buscaTitulo">Selecionar Título</label>
                    <div class="titulo-selector">
                        <input type="text" id="buscaTitulo" placeholder="Buscar filme, série, anime..." onkeyup="buscarTitulos()">
                        <div id="resultadosTitulos" class="resultados-busca"></div>
                    </div>
                    <div id="tituloSelecionado" class="titulo-selecionado" style="display: none;">
                        <div class="titulo-info">
                            <span class="titulo-nome"></span>
                            <button type="button" class="btn-remover" onclick="removerTitulo()">×</button>
                        </div>
                    </div>
                </div>
                <div id="episodioSelector" class="form-group" style="display: none;">
                    <label>Selecionar Episódio</label>
                    <div id="temporadasContainer"></div>
                </div>
                <div class="modal-actions">
                    <button onclick="criarSala()" class="btn-confirmar">Criar Sala</button>
                    <button onclick="fecharModal('modalCriar')" class="btn-cancelar">Cancelar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Entrar Sala -->
    <div id="modalEntrar" class="sala-modal">
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