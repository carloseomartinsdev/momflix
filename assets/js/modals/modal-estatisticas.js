// Modal de Estatísticas
const ModalEstatisticas = {
    async abrir() {
        const result = await API.getEstatisticas();
        if (!result.success) {
            alert('Erro ao carregar estatísticas');
            return;
        }
        
        const stats = result.data;
        
        let modal = document.getElementById('statsModal');
        if (!modal) {
            modal = this.criar();
        }
        
        const content = document.getElementById('statsContent');
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px;">
                <div>
                    <h3 style="margin-top: 0; color: var(--red-primary);">Por Tipo</h3>
                    <p><strong>Total de Títulos:</strong> ${stats.total_titulos || 0}</p>
                    <p><strong>Filmes:</strong> ${stats.filmes || 0}</p>
                    <p><strong>Séries:</strong> ${stats.series || 0}</p>
                    <p><strong>BLs:</strong> ${stats.bls || 0}</p>
                    <p><strong>Animes:</strong> ${stats.animes || 0}</p>
                    <p><strong>Donghuas:</strong> ${stats.donghuas || 0}</p>
                </div>
                <div>
                    <h3 style="margin-top: 0; color: var(--red-primary);">Conteúdo</h3>
                    <p><strong>Total de Episódios:</strong> ${stats.total_episodios || 0}</p>
                    <p><strong>Novidades:</strong> ${stats.novidades || 0}</p>
                    <p><strong>Gêneros:</strong> ${stats.total_generos || 0}</p>
                    <p><strong>Mais Assistido:</strong> ${stats.mais_assistido || 'Nenhum'}</p>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    },

    criar() {
        const modal = document.createElement('div');
        modal.id = 'statsModal';
        modal.className = 'modal-overlay';
        modal.onclick = () => this.fechar();
        
        modal.innerHTML = `
            <div class="modal" onclick="event.stopPropagation()">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0;">📊 Estatísticas do Catálogo</h2>
                    <span class="modal-close" onclick="ModalEstatisticas.fechar()" style="position: static; background: none;">&times;</span>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div id="statsContent"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },

    fechar() {
        const modal = document.getElementById('statsModal');
        if (modal) modal.style.display = 'none';
    }
};
