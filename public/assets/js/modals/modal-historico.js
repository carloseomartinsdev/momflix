// Modal de Histórico
const ModalHistorico = {
    async abrir(userId = null) {
        const result = await API.getHistorico(userId);
        if (!result.success) {
            alert('Erro ao carregar histórico');
            return;
        }
        
        let modal = document.getElementById('historicoModal');
        if (!modal) {
            modal = this.criar();
        }
        
        const content = document.getElementById('historicoContent');
        const isAdmin = result.isAdmin;
        
        if (!result.data || result.data.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">Nenhum histórico encontrado</p>';
        } else {
            content.innerHTML = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-light);">
                            ${isAdmin ? '<th style="padding: 12px; text-align: left;">Usuário</th>' : ''}
                            <th style="padding: 12px; text-align: left;">Título</th>
                            <th style="padding: 12px; text-align: center;">Progresso</th>
                            <th style="padding: 12px; text-align: center;">Visualizações</th>
                            <th style="padding: 12px; text-align: left;">Último Acesso</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.data.map(item => `
                            <tr style="border-bottom: 1px solid var(--border-light);">
                                ${isAdmin ? `<td style="padding: 12px;">${item.username}</td>` : ''}
                                <td style="padding: 12px;">${item.titulo}</td>
                                <td style="padding: 12px; text-align: center;">
                                    <div style="background: var(--bg-card); border-radius: 4px; height: 8px; width: 100px; margin: 0 auto; overflow: hidden;">
                                        <div style="background: var(--red-primary); height: 100%; width: ${item.progress_percent}%;"></div>
                                    </div>
                                    <small style="color: var(--text-tertiary);">${Math.round(item.progress_percent)}%</small>
                                </td>
                                <td style="padding: 12px; text-align: center;">${item.play_count}x</td>
                                <td style="padding: 12px; font-size: 13px; color: var(--text-tertiary);">${this.formatarData(item.last_played)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        modal.style.display = 'flex';
    },

    criar() {
        const modal = document.createElement('div');
        modal.id = 'historicoModal';
        modal.className = 'modal-overlay';
        modal.onclick = () => this.fechar();
        
        modal.innerHTML = `
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 1000px;">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0;">📅 Histórico de Visualizações</h2>
                    <span class="modal-close" onclick="ModalHistorico.fechar()" style="position: static; background: none;">&times;</span>
                </div>
                <div class="modal-body" style="padding: 20px; max-height: 600px; overflow-y: auto;">
                    <div id="historicoContent"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },

    formatarData(dataStr) {
        const data = new Date(dataStr);
        const agora = new Date();
        const diff = agora - data;
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);
        
        if (minutos < 1) return 'Agora';
        if (minutos < 60) return `${minutos}min atrás`;
        if (horas < 24) return `${horas}h atrás`;
        if (dias < 7) return `${dias}d atrás`;
        
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    fechar() {
        const modal = document.getElementById('historicoModal');
        if (modal) modal.style.display = 'none';
    }
};
