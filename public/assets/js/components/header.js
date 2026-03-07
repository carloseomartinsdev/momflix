// Módulo de Header
const Header = {
    init() {
        this.setupSearch();
        this.setupFilters();
        this.setupMenu();
    },

    setupSearch() {
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => Filtros.aplicar());
        }
    },

    setupFilters() {
        const tipoFiltro = document.getElementById('tipoFiltro');
        const generoFiltro = document.getElementById('generoFiltro');
        
        if (tipoFiltro) {
            tipoFiltro.addEventListener('change', () => Filtros.aplicar());
        }
        
        if (generoFiltro) {
            generoFiltro.addEventListener('change', () => Filtros.aplicar());
        }
    },

    setupMenu() {
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-btn')) {
                document.querySelectorAll('.menu-content').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    },

    toggleMenu() {
        const menu = document.getElementById('menuDropdown');
        if (menu) {
            menu.classList.toggle('show');
        }
    },

    async popularGeneros() {
        const result = await API.getGeneros();
        if (result.success) {
            const select = document.getElementById('generoFiltro');
            result.data.forEach(genero => {
                const option = document.createElement('option');
                option.value = genero;
                option.textContent = genero;
                select.appendChild(option);
            });
        }
    },

    async popularTipos() {
        const tipos = await API.getTiposDisponiveis();
        const select = document.getElementById('tipoFiltro');
        select.innerHTML = '<option value="todos">Todos os tipos</option>';
        
        const labels = {
            filme: 'Filmes',
            serie: 'Séries',
            bl: 'BLs',
            donghua: 'Donghuas',
            anime: 'Animes'
        };
        
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = labels[tipo] || tipo;
            select.appendChild(option);
        });
    }
};
