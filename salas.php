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
        
        <div class="salas-publicas">
            <h2>Salas Públicas</h2>
            <div id="salasPublicas" class="salas-grid"></div>
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
                    <div id="temporadasContainer" style="max-height: 200px; overflow-y: auto;"></div>
                </div>
                <div class="form-group">
                    <label for="nomeSala">Nome da Sala</label>
                    <input type="text" id="nomeSala" placeholder="Digite o nome da sala" maxlength="100">
                </div>
                
                <div class="form-group">
                    <label>Tipo de Sala</label>
                    <div class="tipo-sala-buttons" style="display: flex; gap: 10px; margin-top: 8px;">
                        <button type="button" class="tipo-sala-btn active" data-tipo="privada" onclick="selecionarTipoSala('privada')">
                            <div class="tipo-icon">🔒</div>
                            <div class="tipo-title">Privada</div>
                            <div class="tipo-desc">Só por código</div>
                        </button>
                        <button type="button" class="tipo-sala-btn" data-tipo="publica" onclick="selecionarTipoSala('publica')">
                            <div class="tipo-icon">🌐</div>
                            <div class="tipo-title">Pública</div>
                            <div class="tipo-desc">Visível para todos</div>
                        </button>
                    </div>
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
            <div class="modal-header">
                <h3>🔗 Entrar na Sala</h3>
                <span class="modal-close" onclick="fecharModal('modalEntrar')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="codigoSala">Código da Sala</label>
                    <input type="text" id="codigoSala" placeholder="Digite o código (ex: ABC123)" maxlength="6" style="text-transform: uppercase; font-size: 18px; text-align: center; letter-spacing: 2px;">
                    <div style="color: #ccc; font-size: 12px; margin-top: 8px;">
                        📝 O código tem 6 caracteres e é fornecido pelo criador da sala
                    </div>
                </div>
                <div class="modal-actions">
                    <button onclick="entrarSala()" class="btn-confirmar">Entrar na Sala</button>
                    <button onclick="fecharModal('modalEntrar')" class="btn-cancelar">Cancelar</button>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/salas.js"></script>
</body>
</html>