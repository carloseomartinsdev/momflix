// Modal de Alterar Senha
const ModalSenha = {
    abrir() {
        let modal = document.getElementById('senhaModal');
        if (!modal) {
            modal = this.criar();
        }
        modal.style.display = 'flex';
    },

    criar() {
        const modal = document.createElement('div');
        modal.id = 'senhaModal';
        modal.className = 'modal-overlay';
        modal.onclick = () => this.fechar();
        
        modal.innerHTML = `
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px;">
                <div class="modal-header-compact">
                    <h3>🔑 Alterar Senha</h3>
                    <span class="modal-close" onclick="ModalSenha.fechar()">&times;</span>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Senha Atual:</label>
                        <input type="password" id="senhaAtual" style="width: 100%; padding: 10px; border: 1px solid var(--border-light); border-radius: 4px; background: var(--bg-hover); color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nova Senha:</label>
                        <input type="password" id="senhaNova" style="width: 100%; padding: 10px; border: 1px solid var(--border-light); border-radius: 4px; background: var(--bg-hover); color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Confirmar Nova Senha:</label>
                        <input type="password" id="senhaConfirmar" style="width: 100%; padding: 10px; border: 1px solid var(--border-light); border-radius: 4px; background: var(--bg-hover); color: var(--text-primary);">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="ModalSenha.salvar()" class="btn-assistir" style="flex: 1; margin: 0;">Alterar</button>
                        <button onclick="ModalSenha.fechar()" class="btn-externo" style="flex: 1; margin: 0;">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },

    async salvar() {
        const atual = document.getElementById('senhaAtual').value;
        const nova = document.getElementById('senhaNova').value;
        const confirmar = document.getElementById('senhaConfirmar').value;
        
        if (!atual || !nova || !confirmar) {
            alert('Preencha todos os campos');
            return;
        }
        
        if (nova !== confirmar) {
            alert('Nova senha e confirmação não coincidem');
            return;
        }
        
        const result = await API.alterarSenha(atual, nova);
        if (result.success) {
            alert('Senha alterada com sucesso!');
            this.fechar();
        } else {
            alert('Erro: ' + result.error);
        }
    },

    fechar() {
        const modal = document.getElementById('senhaModal');
        if (modal) modal.style.display = 'none';
    }
};
