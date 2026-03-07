// Modal de Edição
const ModalEditar = {
    async abrirTitulo(id) {
        const response = await fetch(`api/get_titulo.php?id=${id}`);
        const result = await response.json();
        
        if (!result.success) {
            alert('Erro ao carregar título');
            return;
        }
        
        const titulo = result.data;
        
        let modal = document.getElementById('editarModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editarModal';
            modal.className = 'modal-overlay';
            modal.onclick = () => this.fechar();
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 600px;">
                <div class="modal-header-compact">
                    <h3>✏️ Editar: ${titulo.nome}</h3>
                    <span class="modal-close" onclick="ModalEditar.fechar()">&times;</span>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <form id="formEditarTitulo">
                        <input type="hidden" name="id" value="${id}">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nome:</label>
                            <input type="text" name="nome" value="${titulo.nome || ''}" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Sinopse:</label>
                            <textarea name="sinopse" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); min-height: 100px; box-sizing: border-box;">${titulo.sinopse || ''}</textarea>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ano:</label>
                                <input type="text" name="ano" value="${titulo.ano || ''}" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Duração:</label>
                                <input type="text" name="duracao" value="${titulo.duracao || ''}" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Classificação:</label>
                            <input type="text" name="classificacao" value="${titulo.classificacao || ''}" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Diretor:</label>
                            <input type="text" name="diretor" value="${titulo.diretor || ''}" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Elenco:</label>
                            <input type="text" name="elenco" value="${titulo.elenco || ''}" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rolo (nome da categoria):</label>
                            <input type="text" name="rolo" value="${titulo.rolo || ''}" placeholder="Deixe vazio para não exibir como rolo" style="width: 100%; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                            <small style="color: var(--text-tertiary); font-size: 11px;">Para sagas: preencha para criar uma categoria separada</small>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="btn-assistir" style="flex: 1; margin: 0;">💾 Salvar</button>
                            <button type="button" onclick="ModalEditar.fechar()" class="btn-externo" style="flex: 1; margin: 0;">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('formEditarTitulo').onsubmit = async (e) => {
            e.preventDefault();
            await this.salvarTitulo(new FormData(e.target));
        };
    },
    
    async salvarTitulo(formData) {
        const response = await fetch('api/update_titulo.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Salvo com sucesso!');
            this.fechar();
            location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    },
    
    async abrirSaga(sagaId) {
        const response = await fetch(`api/get_filmes_saga.php?saga_id=${sagaId}`);
        const result = await response.json();
        
        if (!result.success) {
            alert('Erro ao carregar saga');
            return;
        }
        
        const filmes = result.data;
        
        let modal = document.getElementById('editarModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editarModal';
            modal.className = 'modal-overlay';
            modal.onclick = () => this.fechar();
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header-compact">
                    <h3>✏️ Editar Saga</h3>
                    <span class="modal-close" onclick="ModalEditar.fechar()">&times;</span>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    ${filmes.map(filme => `
                        <div style="background: var(--bg-hover); padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                            <h4 style="margin: 0 0 10px 0;">${filme.nome}</h4>
                            <form id="formSaga${filme.id}" data-filme-id="${filme.id}">
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Nome:</label>
                                    <input type="text" name="nome" value="${filme.nome || ''}" style="width: 100%; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Sinopse:</label>
                                    <textarea name="sinopse" style="width: 100%; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); min-height: 60px; box-sizing: border-box;">${filme.sinopse || ''}</textarea>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px;">Duração (min):</label>
                                    <input type="text" name="duracao" value="${filme.duracao || ''}" style="width: 100%; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box;">
                                </div>
                                <button type="submit" class="btn-assistir" style="margin: 0; padding: 8px 16px;">💾 Salvar</button>
                            </form>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        filmes.forEach(filme => {
            document.getElementById(`formSaga${filme.id}`).onsubmit = async (e) => {
                e.preventDefault();
                await this.salvarFilmeSaga(filme.id, new FormData(e.target));
            };
        });
    },
    
    async salvarFilmeSaga(filmeId, formData) {
        formData.append('filme_id', filmeId);
        
        const response = await fetch('api/update_filme_saga.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Salvo com sucesso!');
        } else {
            alert('Erro: ' + result.error);
        }
    },
    
    fechar() {
        const modal = document.getElementById('editarModal');
        if (modal) modal.style.display = 'none';
    }
};
