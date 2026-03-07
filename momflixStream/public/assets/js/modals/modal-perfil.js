// Modal de Perfil
const ModalPerfil = {
    abrir() {
        let modal = document.getElementById('perfilModal');
        if (!modal) {
            modal = this.criar();
        }
        modal.style.display = 'flex';
    },

    criar() {
        const modal = document.createElement('div');
        modal.id = 'perfilModal';
        modal.className = 'modal-overlay';
        modal.onclick = () => this.fechar();
        
        const icons = ['👤', '😀', '😎', '🤓', '🥳', '🤠', '👨', '👩', '🧑', '👦', '👧', '🧔', '👴', '👵', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🐱', '🐶', '🐼', '🐨', '🦊', '🦁', '🐯', '🐸', '🐵', '🦄'];
        
        modal.innerHTML = `
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 600px;">
                <div class="modal-header-compact">
                    <h3>👤 Perfil</h3>
                    <span class="modal-close" onclick="ModalPerfil.fechar()">&times;</span>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Escolha seu ícone:</label>
                        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
                            ${icons.map(icon => `
                                <button onclick="ModalPerfil.selecionarIcone('${icon}')" 
                                        style="font-size: 32px; padding: 12px; border: 2px solid var(--border-light); border-radius: 8px; background: var(--bg-hover); cursor: pointer; transition: all 0.2s;"
                                        onmouseover="this.style.borderColor='var(--red-primary)'; this.style.transform='scale(1.1)'"
                                        onmouseout="this.style.borderColor='var(--border-light)'; this.style.transform='scale(1)'">${icon}</button>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="ModalSenha.abrir(); ModalPerfil.fechar();" class="btn-assistir" style="width: 100%; margin: 0;">🔑 Alterar Senha</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },

    async selecionarIcone(icon) {
        const response = await fetch('api/update_profile_icon.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({icon: icon})
        });
        
        const result = await response.json();
        if (result.success) {
            location.reload();
        } else {
            alert('Erro ao atualizar ícone');
        }
    },

    fechar() {
        const modal = document.getElementById('perfilModal');
        if (modal) modal.style.display = 'none';
    }
};
