// Módulo de Cards
const Cards = {
    criar(titulo, isContinueWatching = false, isSagaFilmes = false) {
        const card = document.createElement('div');
        card.className = 'card';
        
        if (isSagaFilmes && titulo.path) {
            card.onclick = () => {
                const modal = document.getElementById('iframePlayerModal');
                const iframe = document.getElementById('iframePlayerFrame');
                const params = new URLSearchParams({
                    path: titulo.path,
                    title: titulo.nome,
                    idTitulo: titulo.id || '',
                    isSerie: '0'
                });
                iframe.src = `player.html?${params.toString()}`;
                modal.style.display = 'flex';
            };
        } else if (isContinueWatching) {
            if (titulo.rolo) {
                card.onclick = () => {
                    const modal = document.getElementById('iframePlayerModal');
                    const iframe = document.getElementById('iframePlayerFrame');
                    const isSerie = titulo.tipo !== 'filme';
                    const params = new URLSearchParams({
                        path: titulo.rolo,
                        title: titulo.nome,
                        idTitulo: titulo.id,
                        isSerie: isSerie ? '1' : '0',
                        continue: '1'
                    });
                    iframe.src = `player.html?${params.toString()}`;
                    modal.style.display = 'flex';
                };
            } else {
                card.onclick = () => Modal.abrir(titulo.id);
            }
        } else {
            card.onclick = () => Modal.abrir(titulo.id);
        }
        
        // Badge de tipo
        const badgeTipo = document.createElement('span');
        badgeTipo.className = `badge-overlay badge-${titulo.tipo}`;
        badgeTipo.textContent = titulo.tipo.toUpperCase();
        card.appendChild(badgeTipo);
        
        // Badge NOVO
        if (titulo.is_novo) {
            const badgeNovo = document.createElement('span');
            badgeNovo.className = 'badge-novo';
            badgeNovo.textContent = 'NOVO';
            card.appendChild(badgeNovo);
        }
        
        // Badge Views
        if (titulo.views > 0) {
            const badgeViews = document.createElement('span');
            badgeViews.className = 'badge-views';
            badgeViews.textContent = `${titulo.views}x`;
            card.appendChild(badgeViews);
        }
        
        // Rolo de progresso
        if (titulo.progress_percent > 0) {
            const rolo = document.createElement('div');
            rolo.className = 'progress-rolo';
            rolo.style.width = `${titulo.progress_percent}%`;
            card.appendChild(rolo);
        }
        
        // Imagem
        const img = document.createElement('img');
        if (titulo.capa) {
            img.src = `image.php?path=${encodeURIComponent(titulo.capa)}`;
            img.alt = titulo.nome;
            img.onerror = () => this.criarFallback(card, img);
        } else {
            this.criarFallback(card, img);
        }
        card.appendChild(img);
        
        // Título
        const tituloDiv = document.createElement('div');
        tituloDiv.className = 'card-titulo';
        tituloDiv.textContent = titulo.nome;
        card.appendChild(tituloDiv);
        
        return card;
    },

    criarTopCard(titulo, posicao) {
        const wrapper = document.createElement('div');
        wrapper.className = 'top-wrapper';
        
        const container = document.createElement('div');
        container.className = 'top-container';
        
        // Número da posição
        const numero = document.createElement('div');
        numero.className = 'top-numero';
        numero.textContent = posicao;
        container.appendChild(numero);
        
        // Card normal
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => Modal.abrir(titulo.id);
        
        // Badge de tipo
        const badgeTipo = document.createElement('span');
        badgeTipo.className = `badge-overlay badge-${titulo.tipo}`;
        badgeTipo.textContent = titulo.tipo.toUpperCase();
        card.appendChild(badgeTipo);
        
        // Badge NOVO
        if (titulo.is_novo) {
            const badgeNovo = document.createElement('span');
            badgeNovo.className = 'badge-novo';
            badgeNovo.textContent = 'NOVO';
            card.appendChild(badgeNovo);
        }
        
        // Imagem
        const img = document.createElement('img');
        if (titulo.capa) {
            img.src = `image.php?path=${encodeURIComponent(titulo.capa)}`;
            img.alt = titulo.nome;
            img.onerror = () => this.criarFallback(card, img);
        } else {
            this.criarFallback(card, img);
        }
        card.appendChild(img);
        
        // Título
        const tituloDiv = document.createElement('div');
        tituloDiv.className = 'card-titulo';
        tituloDiv.textContent = titulo.nome;
        card.appendChild(tituloDiv);
        
        container.appendChild(card);
        wrapper.appendChild(container);
        return wrapper;
    },

    criarFallback(card, img) {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'sem-capa';
        fallback.innerHTML = '<img src="logoS.png" alt="Logo"><div class="texto">Capa não disponível</div>';
        card.insertBefore(fallback, card.querySelector('.card-titulo'));
    }
};
