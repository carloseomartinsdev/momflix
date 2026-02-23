// Módulo de Filtros
const Filtros = {
    aplicar() {
        const termo = document.getElementById('search').value.toLowerCase().trim();
        const tipo = document.getElementById('tipoFiltro').value;
        const genero = document.getElementById('generoFiltro').value;
        
        if (!termo && tipo === 'todos' && genero === 'todos') {
            Categorias.renderizar();
            return;
        }
        
        this.buscar(termo, tipo, genero);
    },

    async buscar(termo, tipo, genero) {
        const result = await API.buscar(termo, tipo, genero);
        
        if (result.success && result.data.length > 0) {
            this.mostrarResultados(result.data);
        } else {
            document.getElementById('categorias').innerHTML = '';
            document.getElementById('semItens').style.display = 'block';
        }
    },

    mostrarResultados(titulos) {
        const container = document.getElementById('categorias');
        container.innerHTML = '';
        document.getElementById('semItens').style.display = 'none';
        
        const categoria = document.createElement('div');
        categoria.className = 'categoria';
        
        const titulo = document.createElement('div');
        titulo.className = 'categoria-titulo';
        titulo.textContent = `Resultados (${titulos.length})`;
        
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(160px, 1fr))';
        grid.style.gap = '12px';
        
        titulos.forEach(item => {
            const card = Cards.criar(item);
            grid.appendChild(card);
        });
        
        categoria.appendChild(titulo);
        categoria.appendChild(grid);
        container.appendChild(categoria);
    }
};

// Função global
function aplicarFiltros() {
    Filtros.aplicar();
}
