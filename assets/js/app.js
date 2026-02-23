// Inicialização da Aplicação
const App = {
    async init() {
        Header.init();
        await Modal.init();
        await Header.popularTipos();
        await Header.popularGeneros();
        await Categorias.renderizar();
    },

    aleatorio() {
        API.getTituloAleatorio().then(result => {
            if (result.success) {
                Modal.abrir(result.data.id);
            }
        });
    }
};

// Iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
