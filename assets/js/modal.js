// Módulo de Modal
const Modal = {
    isAdmin: false,
    
    async init() {
        const response = await fetch('api/is_admin.php');
        const result = await response.json();
        this.isAdmin = result.isAdmin;
    },
    
    async abrir(id) {
        const result = await API.getTitulo(id);
        if (!result.success) {
            alert('Erro ao carregar título');
            return;
        }
        
        const titulo = result.data;
        
        // Header com banner triplo
        const header = document.getElementById('modalTituloHeader');
        const imgUrl = titulo.capa ? `image.php?path=${encodeURIComponent(titulo.capa)}` : '';
        
        header.innerHTML = `
            <span class="modal-close" onclick="fecharModal()">&times;</span>
            ${this.isAdmin ? `<button class="btn-edit-modal" onclick="Modal.editarTitulo('${titulo.id}')" title="Editar">✏️</button>` : ''}
            ${titulo.is_novo ? '<span class="badge badge-novo">NOVO</span>' : ''}
            <div class="modal-header-bg-left" style="background-image: url('${imgUrl}');"></div>
            <div class="modal-header-bg-right" style="background-image: url('${imgUrl}');"></div>
            <div class="modal-header-center" style="background-image: url('${imgUrl}');"></div>
            <div class="modal-header-content">
                <h2 id="modalTituloNome">${titulo.nome}</h2>
                <div class="modal-actions" id="modalActions"></div>
                <div class="modal-badges" id="modalBadges"></div>
            </div>
        `;
        
        // Badges
        const badgesContainer = document.getElementById('modalBadges');
        badgesContainer.innerHTML = `
            <span class="badge badge-${titulo.tipo}">${titulo.tipo.toUpperCase()}</span>
            ${titulo.hd ? `<span class="badge badge-hd">${titulo.hd}</span>` : ''}
        `;
        
        // Botões de ação
        const actionsContainer = document.getElementById('modalActions');
        actionsContainer.innerHTML = '';
        
        if (titulo.tipo === 'filme' && titulo.path && !titulo.is_saga) {
            const btnPlay = document.createElement('button');
            btnPlay.className = 'btn-play';
            btnPlay.innerHTML = '▶ Assistir';
            btnPlay.onclick = () => Player.assistirFilme(titulo.id, titulo.path, titulo.nome);
            actionsContainer.appendChild(btnPlay);
        }
        
        // Body com informações
        const modalBody = document.getElementById('modalTituloBody');
        modalBody.innerHTML = '';
        
        const infoGrid = document.createElement('div');
        infoGrid.className = 'modal-info-grid';
        
        // Coluna principal
        const infoMain = document.createElement('div');
        infoMain.className = 'modal-info-main';
        
        if (titulo.sinopse) {
            const sinopse = document.createElement('p');
            sinopse.textContent = titulo.sinopse;
            infoMain.appendChild(sinopse);
        }
        
        // Coluna lateral
        const infoSide = document.createElement('div');
        infoSide.className = 'modal-info-side';
        
        if (titulo.elenco) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>Elenco:</strong> ${titulo.elenco}`;
            infoSide.appendChild(p);
        }
        
        if (titulo.generos) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>Gêneros:</strong> ${titulo.generos}`;
            infoSide.appendChild(p);
        }
        
        if (titulo.ano) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>Ano:</strong> ${titulo.ano}`;
            infoSide.appendChild(p);
        }
        
        if (titulo.classificacao) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>Classificação:</strong> ${titulo.classificacao}`;
            infoSide.appendChild(p);
        }
        
        infoGrid.appendChild(infoMain);
        infoGrid.appendChild(infoSide);
        modalBody.appendChild(infoGrid);
        
        // Temporadas
        if (titulo.temporadas && titulo.temporadas.length > 0) {
            const episodiosHeader = document.createElement('div');
            episodiosHeader.className = 'episodios-header';
            
            const tempTitle = document.createElement('h3');
            tempTitle.textContent = 'Episódios';
            tempTitle.style.margin = '0';
            episodiosHeader.appendChild(tempTitle);
            
            const tempSelect = document.createElement('select');
            tempSelect.className = 'temporada-select';
            titulo.temporadas.forEach((temp, idx) => {
                const option = document.createElement('option');
                option.value = idx;
                option.textContent = temp.nome_temporada;
                tempSelect.appendChild(option);
            });
            episodiosHeader.appendChild(tempSelect);
            
            modalBody.appendChild(episodiosHeader);
            
            const episodiosContainer = document.createElement('div');
            episodiosContainer.className = 'episodios-container show';
            
            const renderEpisodios = (tempIdx) => {
                episodiosContainer.innerHTML = '';
                const temp = titulo.temporadas[tempIdx];
                
                temp.episodios.forEach((ep, idx) => {
                    const epItem = document.createElement('div');
                    epItem.className = 'episodio-item';
                    
                    const epNumero = document.createElement('div');
                    epNumero.className = 'episodio-numero';
                    epNumero.textContent = (idx + 1).toString().padStart(2, '0');
                    epItem.appendChild(epNumero);
                    
                    const epThumb = document.createElement('div');
                    epThumb.className = 'episodio-thumb';
                    if (ep.thumbnail) {
                        const img = document.createElement('img');
                        img.src = `thumbnails/${ep.thumbnail}`;
                        img.alt = 'Thumbnail';
                        epThumb.appendChild(img);
                        
                        const playIcon = document.createElement('div');
                        playIcon.className = 'episodio-thumb-play';
                        playIcon.innerHTML = '▶';
                        epThumb.appendChild(playIcon);
                    } else {
                        epThumb.textContent = '▶';
                    }
                    epItem.appendChild(epThumb);
                    
                    const epInfo = document.createElement('div');
                    epInfo.className = 'episodio-info';
                    
                    const epTitulo = document.createElement('div');
                    epTitulo.className = 'episodio-titulo';
                    epTitulo.textContent = ep.titulo_episodio || ep.tag;
                    epInfo.appendChild(epTitulo);
                    
                    if (ep.duracao) {
                        const epDuracao = document.createElement('div');
                        epDuracao.className = 'episodio-duracao';
                        epDuracao.textContent = `${ep.duracao} min`;
                        epInfo.appendChild(epDuracao);
                    }
                    
                    if (ep.sinopse) {
                        const epSinopse = document.createElement('div');
                        epSinopse.className = 'episodio-sinopse';
                        epSinopse.textContent = ep.sinopse;
                        epInfo.appendChild(epSinopse);
                    }
                    
                    epItem.appendChild(epInfo);
                    epItem.onclick = () => {
                        // Salvar dados da série no sessionStorage
                        const serieData = {
                            titulo: titulo.nome,
                            idTitulo: titulo.id,
                            temporadas: titulo.temporadas,
                            episodioAtual: {
                                temporada: tempIdx,
                                episodio: idx
                            }
                        };
                        sessionStorage.setItem('serieData', JSON.stringify(serieData));
                        
                        // Abrir player com parâmetros corretos
                        const modal = document.getElementById('iframePlayerModal');
                        const iframe = document.getElementById('iframePlayerFrame');
                        const params = new URLSearchParams({
                            path: ep.path,
                            title: ep.tag,
                            idTitulo: titulo.id,
                            isSerie: '1'
                        });
                        iframe.src = `player.html?${params.toString()}`;
                        modal.style.display = 'flex';
                    };
                    
                    episodiosContainer.appendChild(epItem);
                });
            };
            
            renderEpisodios(0);
            tempSelect.onchange = () => renderEpisodios(parseInt(tempSelect.value));
            
            modalBody.appendChild(episodiosContainer);
        }
        
        // Filmes de Saga
        if (titulo.filmes_saga && titulo.filmes_saga.length > 0) {
            const sagaHeader = document.createElement('div');
            sagaHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 20px;';
            
            const sagaTitle = document.createElement('h3');
            sagaTitle.textContent = 'Filmes da Saga';
            sagaTitle.style.margin = '0';
            sagaHeader.appendChild(sagaTitle);
            
            if (this.isAdmin) {
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn-edit-saga';
                btnEdit.innerHTML = '✏️ Editar';
                btnEdit.onclick = () => this.editarSaga(titulo.id);
                sagaHeader.appendChild(btnEdit);
            }
            
            modalBody.appendChild(sagaHeader);
            
            titulo.filmes_saga.forEach(filme => {
                const filmeItem = document.createElement('div');
                filmeItem.style.cssText = 'cursor: pointer; padding: 12px; margin: 8px 0; background: var(--bg-hover); border-radius: 4px; display: flex; gap: 12px; align-items: center; transition: background 0.2s;';
                
                if (filme.capa) {
                    const img = document.createElement('img');
                    img.src = `image.php?path=${encodeURIComponent(filme.capa)}`;
                    img.style.cssText = 'width: 80px; height: 120px; object-fit: cover; border-radius: 4px;';
                    filmeItem.appendChild(img);
                }
                
                const filmeInfo = document.createElement('div');
                filmeInfo.style.flex = '1';
                filmeInfo.innerHTML = `
                    <strong style="display: block; margin-bottom: 4px; font-size: 16px;">${filme.nome}</strong>
                    ${filme.duracao ? `<p style="color: var(--text-tertiary); font-size: 13px; margin: 4px 0;">${filme.duracao} min</p>` : ''}
                    ${filme.sinopse ? `<p style="color: var(--text-tertiary); font-size: 13px; margin: 4px 0;">${filme.sinopse}</p>` : ''}
                `;
                filmeItem.appendChild(filmeInfo);
                
                const btnPlay = document.createElement('button');
                btnPlay.className = 'btn-play-saga';
                btnPlay.innerHTML = '▶';
                btnPlay.onclick = (e) => {
                    e.stopPropagation();
                    Player.assistirFilme(filme.id, filme.path, filme.nome);
                };
                filmeItem.appendChild(btnPlay);
                
                filmeItem.onmouseover = () => filmeItem.style.background = 'var(--border-light)';
                filmeItem.onmouseout = () => filmeItem.style.background = 'var(--bg-hover)';
                
                modalBody.appendChild(filmeItem);
            });
        }
        
        document.getElementById('modalTitulo').style.display = 'flex';
    },
    
    editarTitulo(id) {
        ModalEditar.abrirTitulo(id);
    },
    
    editarSaga(id) {
        ModalEditar.abrirTitulo(id);
    },
    
    fechar() {
        document.getElementById('modalTitulo').style.display = 'none';
    }
};

function fecharModal() {
    Modal.fechar();
}
