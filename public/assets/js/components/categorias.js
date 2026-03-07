// Módulo de Categorias
const Categorias = {
    async renderizar() {
        const container = document.getElementById('categorias');
        container.innerHTML = '';
        document.getElementById('semItens').style.display = 'none';
        
        try {
            await this.criarNovidades();
            await this.criarMaisAssistidos();
            await this.criarContinueAssistindo();
            await this.criarTopsSemana();
            await this.criarSagasComRolo();
            await this.criarPorGenero();
        } catch (error) {
            console.error('Erro ao renderizar categorias:', error);
        }
    },

    async criarNovidades() {
        const result = await API.getCatalogo();
        if (result.success && result.data) {
            const novidades = result.data.filter(t => t.is_novo).slice(0, 20);
            if (novidades.length > 0) {
                this.criarCategoria('Novidades', novidades);
            }
        }
    },

    async criarMaisAssistidos() {
        const result = await API.getMaisAssistidos(15);
        if (result.success && result.data && result.data.length > 0) {
            this.criarCategoria('Mais Assistidos', result.data);
        }
    },

    async criarContinueAssistindo() {
        const result = await API.getContinueAssistindo();
        if (result.success && result.data && result.data.length > 0) {
            this.criarCategoria('Continue Assistindo', result.data, [], true);
        }
    },

    async criarSagasComRolo() {
        const result = await API.getCatalogo();
        if (result.success && result.data) {
            const sagasComRolo = result.data.filter(t => (t.is_saga === true || t.is_saga === 1) && t.rolo && t.rolo.trim() !== '');
            
            for (const saga of sagasComRolo) {
                const filmesSaga = await API.getFilmesSaga(saga.id);
                if (filmesSaga.success && filmesSaga.data && filmesSaga.data.length > 0) {
                    this.criarCategoria(saga.rolo, filmesSaga.data, [], false, true);
                }
            }
        }
    },

    async criarTopsSemana() {
        try {
            const resultFilmes = await API.getTopsSemana('filme', 15);
            if (resultFilmes.success && resultFilmes.data && resultFilmes.data.length > 0) {
                this.criarCategoria('Top Filmes da Semana', resultFilmes.data, [], false, false, true);
            }
            
            const resultSeries = await API.getTopsSemana('serie', 15);
            if (resultSeries.success && resultSeries.data && resultSeries.data.length > 0) {
                this.criarCategoria('Top Séries da Semana', resultSeries.data, [], false, false, true);
            }
        } catch (error) {
            console.error('Erro ao criar tops da semana:', error);
        }
    },

    async criarPorGenero() {
        try {
            const result = await API.getTitulosPorGenero();
            
            if (result.success && result.data && Object.keys(result.data).length > 0) {
                const generosValidos = Object.entries(result.data)
                    .filter(([genero, titulos]) => titulos.length >= 5)
                    .slice(0, 10);
                
                generosValidos.forEach(([genero, titulos]) => {
                    const tituloCategoria = `${genero} (${titulos.length})`;
                    const iniciais = titulos.slice(0, 20);
                    const restantes = titulos.slice(20);
                    
                    this.criarCategoria(tituloCategoria, iniciais, restantes);
                });
            }
        } catch (error) {
            console.error('Erro ao criar categorias por gênero:', error);
        }
    },
    
    async atualizarMaisAssistidos() {
        const container = document.getElementById('categorias');
        const categorias = container.querySelectorAll('.categoria');
        
        for (let cat of categorias) {
            const titulo = cat.querySelector('.categoria-titulo');
            if (titulo && titulo.textContent === 'Mais Assistidos') {
                const result = await API.getMaisAssistidos(15);
                if (result.success && result.data && result.data.length > 0) {
                    const rolo = cat.querySelector('.rolo');
                    rolo.innerHTML = '';
                    Scroll.setup(rolo);
                    result.data.forEach(item => {
                        const card = Cards.criar(item);
                        rolo.appendChild(card);
                    });
                }
                break;
            }
        }
    },
    
    async atualizarContinueAssistindo() {
        const container = document.getElementById('categorias');
        const categorias = container.querySelectorAll('.categoria');
        
        for (let cat of categorias) {
            const titulo = cat.querySelector('.categoria-titulo');
            if (titulo && titulo.textContent === 'Continue Assistindo') {
                const result = await API.getContinueAssistindo();
                if (result.success && result.data && result.data.length > 0) {
                    const rolo = cat.querySelector('.rolo');
                    rolo.innerHTML = '';
                    Scroll.setup(rolo);
                    result.data.forEach(item => {
                        const card = Cards.criar(item, true);
                        rolo.appendChild(card);
                    });
                } else {
                    cat.remove();
                }
                break;
            }
        }
        
        // Se não existe mas tem dados, criar
        const result = await API.getContinueAssistindo();
        if (result.success && result.data && result.data.length > 0) {
            let exists = false;
            for (let cat of categorias) {
                const titulo = cat.querySelector('.categoria-titulo');
                if (titulo && titulo.textContent === 'Continue Assistindo') {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                const maisAssistidos = Array.from(categorias).find(cat => {
                    const titulo = cat.querySelector('.categoria-titulo');
                    return titulo && titulo.textContent === 'Mais Assistidos';
                });
                
                if (maisAssistidos) {
                    const categoria = document.createElement('div');
                    categoria.className = 'categoria';
                    
                    const tituloEl = document.createElement('div');
                    tituloEl.className = 'categoria-titulo';
                    tituloEl.textContent = 'Continue Assistindo';
                    
                    const rolo = document.createElement('div');
                    rolo.className = 'rolo';
                    Scroll.setup(rolo);
                    
                    result.data.forEach(item => {
                        const card = Cards.criar(item, true);
                        rolo.appendChild(card);
                    });
                    
                    categoria.appendChild(tituloEl);
                    categoria.appendChild(rolo);
                    maisAssistidos.after(categoria);
                }
            }
        }
    },

    criarCategoria(titulo, titulos, restantes = [], isContinueWatching = false, isSagaFilmes = false, isTopList = false) {
        const container = document.getElementById('categorias');
        
        const categoria = document.createElement('div');
        categoria.className = 'categoria';
        
        const tituloEl = document.createElement('div');
        tituloEl.className = 'categoria-titulo';
        tituloEl.style.display = 'flex';
        tituloEl.style.justifyContent = 'space-between';
        tituloEl.style.alignItems = 'center';
        
        const tituloTexto = document.createElement('span');
        tituloTexto.textContent = titulo;
        tituloEl.appendChild(tituloTexto);
        
        if (isSagaFilmes && Modal.isAdmin && titulos.length > 0) {
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-edit-saga';
            btnEdit.innerHTML = '✏️ Editar';
            btnEdit.onclick = (e) => {
                e.stopPropagation();
                Modal.editarSaga(titulos[0].saga_id);
            };
            tituloEl.appendChild(btnEdit);
        }
        
        const rolo = document.createElement('div');
        rolo.className = isTopList ? 'rolo rolo-top' : 'rolo';
        
        // Auto-scroll
        Scroll.setup(rolo);
        
        titulos.forEach((item, index) => {
            const card = isTopList ? 
                Cards.criarTopCard(item, index + 1) : 
                Cards.criar(item, isContinueWatching, isSagaFilmes);
            rolo.appendChild(card);
        });
        
        // Botão Ver Mais
        if (restantes.length > 0) {
            const btnVerMais = this.criarBotaoVerMais(rolo, restantes, isContinueWatching, isSagaFilmes, isTopList);
            rolo.appendChild(btnVerMais);
        }
        
        categoria.appendChild(tituloEl);
        categoria.appendChild(rolo);
        container.appendChild(categoria);
    },

    criarBotaoVerMais(rolo, restantes, isContinueWatching = false, isSagaFilmes = false) {
        const btn = document.createElement('div');
        btn.className = 'card';
        btn.style.cssText = 'display: flex; align-items: center; justify-content: center; background: var(--bg-hover); cursor: pointer;';
        btn.innerHTML = `<div style="text-align: center; color: var(--text-primary);"><div style="font-size: 24px; margin-bottom: 8px;">+</div><div style="font-size: 12px;">Ver mais<br>${restantes.length}</div></div>`;
        
        btn.onclick = () => {
            btn.remove();
            restantes.forEach(item => {
                const card = Cards.criar(item, isContinueWatching, isSagaFilmes);
                rolo.appendChild(card);
            });
        };
        
        return btn;
    }
};
