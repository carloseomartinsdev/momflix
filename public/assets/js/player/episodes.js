// Módulo de episódios
const PlayerEpisodes = {
    serieData: null,
    sagaData: null,
    
    init() {
        const params = PlayerCore.getUrlParams();
        
        if (params.isSerie) {
            this.serieData = JSON.parse(sessionStorage.getItem('serieData') || 'null');
            if (this.serieData) {
                document.getElementById('nextBtn').style.display = 'block';
                document.getElementById('episodiosBtn').style.display = 'block';
            }
        }
        
        if (params.isSaga) {
            this.sagaData = JSON.parse(sessionStorage.getItem('sagaData') || 'null');
            if (this.sagaData) {
                document.getElementById('nextBtn').style.display = 'block';
                document.getElementById('episodiosBtn').style.display = 'block';
            }
        }
    },
    
    mostrar() {
        if (!this.serieData && !this.sagaData) return;
        
        const episodesList = document.getElementById('episodesList');
        episodesList.innerHTML = '';
        
        if (this.serieData) {
            document.getElementById('serieTitle').textContent = this.serieData.titulo;
            
            this.serieData.temporadas.forEach((temp, tIdx) => {
                const seasonHeader = document.createElement('div');
                seasonHeader.className = 'season-header';
                seasonHeader.innerHTML = `
                    <span>${temp.nome_temporada}</span>
                    <span class="season-arrow">▶</span>
                `;
                
                const seasonEpisodes = document.createElement('div');
                seasonEpisodes.className = 'season-episodes';
                
                temp.episodios.forEach((ep, eIdx) => {
                    const episodeItem = document.createElement('div');
                    episodeItem.className = 'episode-item';
                    
                    const atual = tIdx === this.serieData.episodioAtual.temporada && eIdx === this.serieData.episodioAtual.episodio;
                    if (atual) {
                        episodeItem.classList.add('current');
                        seasonEpisodes.classList.add('show');
                        seasonHeader.querySelector('.season-arrow').classList.add('expanded');
                    }
                    
                    // Thumbnail
                    if (ep.thumbnail) {
                        const thumb = document.createElement('img');
                        thumb.src = `thumbnails/${ep.thumbnail}`;
                        thumb.alt = 'Thumbnail';
                        episodeItem.appendChild(thumb);
                    }
                    
                    const text = document.createElement('span');
                    text.textContent = ep.tag;
                    episodeItem.appendChild(text);
                    episodeItem.onclick = () => {
                        this.serieData.episodioAtual.temporada = tIdx;
                        this.serieData.episodioAtual.episodio = eIdx;
                        sessionStorage.setItem('serieData', JSON.stringify(this.serieData));
                        
                        const url = `player.html?idTitulo=${encodeURIComponent(this.serieData.idTitulo)}&path=${encodeURIComponent(ep.path)}&title=${encodeURIComponent(ep.tag)}&isSerie=1`;
                        
                        if (window.parent !== window) {
                            window.parent.postMessage({type: 'updateUrl', url: url}, '*');
                            // Enviar mensagem para recarregar sprite após mudança de URL
                            setTimeout(() => {
                                window.parent.postMessage({type: 'reloadContent'}, '*');
                            }, 500);
                        } else {
                            window.location.href = url;
                        }
                    };
                    
                    seasonEpisodes.appendChild(episodeItem);
                });
                
                seasonHeader.onclick = () => {
                    const arrow = seasonHeader.querySelector('.season-arrow');
                    if (seasonEpisodes.classList.contains('show')) {
                        seasonEpisodes.classList.remove('show');
                        arrow.classList.remove('expanded');
                    } else {
                        seasonEpisodes.classList.add('show');
                        arrow.classList.add('expanded');
                    }
                };
                
                episodesList.appendChild(seasonHeader);
                episodesList.appendChild(seasonEpisodes);
            });
        } else if (this.sagaData) {
            document.getElementById('serieTitle').textContent = this.sagaData.titulo;
            
            this.sagaData.filmes.forEach((filme, fIdx) => {
                const filmeItem = document.createElement('div');
                filmeItem.className = 'episode-item';
                
                if (fIdx === this.sagaData.filmeAtual) {
                    filmeItem.classList.add('current');
                }
                
                const tituloFilme = filme.info?.titulo || filme.nome;
                filmeItem.textContent = tituloFilme;
                filmeItem.onclick = () => {
                    this.sagaData.filmeAtual = fIdx;
                    sessionStorage.setItem('sagaData', JSON.stringify(this.sagaData));
                    
                    const url = `player.html?idTitulo=${encodeURIComponent(filme.idTitulo || '')}&path=${encodeURIComponent(filme.videos[0])}&title=${encodeURIComponent(tituloFilme)}&originalTitle=${encodeURIComponent(tituloFilme)}&isSaga=1`;
                    
                    if (window.parent !== window) {
                        window.parent.postMessage({type: 'updateUrl', url: url}, '*');
                        // Enviar mensagem para recarregar sprite após mudança de URL
                        setTimeout(() => {
                            window.parent.postMessage({type: 'reloadContent'}, '*');
                        }, 500);
                    } else {
                        window.location.href = url;
                    }
                };
                
                episodesList.appendChild(filmeItem);
            });
        }
        
        document.getElementById('episodesModal').style.display = 'block';
    },
    
    fechar() {
        document.getElementById('episodesModal').style.display = 'none';
    },
    
    toggle() {
        const modal = document.getElementById('episodesModal');
        if (modal.style.display === 'block') {
            this.fechar();
        } else {
            this.mostrar();
        }
    },
    
    proximo() {
        if (this.sagaData) {
            this.proximoFilme();
            return;
        }
        
        if (!this.serieData) return;
        
        const tempAtual = this.serieData.episodioAtual.temporada;
        const epAtual = this.serieData.episodioAtual.episodio;
        const temporada = this.serieData.temporadas[tempAtual];
        
        let proximoEp = null;
        
        if (epAtual + 1 < temporada.episodios.length) {
            proximoEp = temporada.episodios[epAtual + 1];
            this.serieData.episodioAtual.episodio = epAtual + 1;
        } else if (tempAtual + 1 < this.serieData.temporadas.length) {
            proximoEp = this.serieData.temporadas[tempAtual + 1].episodios[0];
            this.serieData.episodioAtual.temporada = tempAtual + 1;
            this.serieData.episodioAtual.episodio = 0;
        }
        
        if (proximoEp) {
            sessionStorage.setItem('serieData', JSON.stringify(this.serieData));
            
            const wasFullscreen = !!document.fullscreenElement;
            if (wasFullscreen) {
                sessionStorage.setItem('wasFullscreen', 'true');
            }
            
            const url = `player.html?idTitulo=${encodeURIComponent(this.serieData.idTitulo)}&path=${encodeURIComponent(proximoEp.path)}&title=${encodeURIComponent(proximoEp.tag)}&isSerie=1`;
            
            if (window.parent !== window) {
                window.parent.postMessage({type: 'updateUrl', url: url}, '*');
                // Enviar mensagem para recarregar sprite após mudança de URL
                setTimeout(() => {
                    window.parent.postMessage({type: 'reloadContent'}, '*');
                }, 500);
            } else {
                window.location.href = url;
            }
        } else {
            alert('Este é o último episódio!');
        }
    },
    
    proximoFilme() {
        if (!this.sagaData) return;
        
        const filmeAtual = this.sagaData.filmeAtual;
        
        if (filmeAtual + 1 < this.sagaData.filmes.length) {
            const proximoFilme = this.sagaData.filmes[filmeAtual + 1];
            this.sagaData.filmeAtual = filmeAtual + 1;
            
            sessionStorage.setItem('sagaData', JSON.stringify(this.sagaData));
            
            const wasFullscreen = !!document.fullscreenElement;
            if (wasFullscreen) {
                sessionStorage.setItem('wasFullscreen', 'true');
            }
            
            const tituloFilme = proximoFilme.info?.titulo || proximoFilme.nome;
            const url = `player.html?idTitulo=${encodeURIComponent(proximoFilme.idTitulo || '')}&path=${encodeURIComponent(proximoFilme.videos[0])}&title=${encodeURIComponent(tituloFilme)}&originalTitle=${encodeURIComponent(tituloFilme)}&isSaga=1`;
            
            if (window.parent !== window) {
                window.parent.postMessage({type: 'updateUrl', url: url}, '*');
                // Enviar mensagem para recarregar sprite após mudança de URL
                setTimeout(() => {
                    window.parent.postMessage({type: 'reloadContent'}, '*');
                }, 500);
            } else {
                window.location.href = url;
            }
        } else {
            alert('Este é o último filme da saga!');
        }
    },
    
    temProximo() {
        if (this.sagaData) {
            return this.sagaData.filmeAtual + 1 < this.sagaData.filmes.length;
        }
        
        if (!this.serieData) return false;
        
        const tempAtual = this.serieData.episodioAtual.temporada;
        const epAtual = this.serieData.episodioAtual.episodio;
        const temporada = this.serieData.temporadas[tempAtual];
        
        if (epAtual + 1 < temporada.episodios.length) {
            return true;
        }
        if (tempAtual + 1 < this.serieData.temporadas.length) {
            return true;
        }
        
        return false;
    }
};

// Funções globais
function mostrarEpisodios() { PlayerEpisodes.mostrar(); }
function fecharListaEpisodios() { PlayerEpisodes.fechar(); }
function toggleEpisodios() { PlayerEpisodes.toggle(); }
function proximoEpisodio() { PlayerEpisodes.proximo(); }
