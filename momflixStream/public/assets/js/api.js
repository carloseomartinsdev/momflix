// Módulo de API
const API = {
    async getFilmesSaga(sagaId) {
        const response = await fetch(`api/get_filmes_saga.php?saga_id=${sagaId}`);
        return await response.json();
    },
    
    async getCatalogo(tipo = 'todos') {
        const response = await fetch(`api/get_catalogo.php?tipo=${tipo}`);
        return await response.json();
    },
    
    async getTitulo(id) {
        const response = await fetch(`api/get_titulo.php?id=${id}`);
        return await response.json();
    },
    
    async getContinueAssistindo() {
        const response = await fetch('api/get_continuar_assistindo.php');
        return await response.json();
    },
    
    async getMaisAssistidos(limit = 15) {
        const response = await fetch(`api/get_mais_assistidos.php?limit=${limit}`);
        return await response.json();
    },
    
    async getGeneros() {
        const response = await fetch('api/get_generos.php');
        return await response.json();
    },
    
    async getTiposDisponiveis() {
        const response = await fetch('api/get_tipos_disponiveis.php');
        return await response.json();
    },
    
    async getTitulosPorGenero() {
        const response = await fetch('api/get_titulos_por_genero.php');
        return await response.json();
    },
    
    async buscar(termo, tipo, genero) {
        const params = new URLSearchParams({termo, tipo, genero});
        const response = await fetch(`api/buscar.php?${params}`);
        return await response.json();
    },
    
    async getTituloAleatorio() {
        const response = await fetch('api/get_titulo_aleatorio.php');
        return await response.json();
    },
    
    async getEstatisticas() {
        const response = await fetch('api/get_estatisticas.php');
        return await response.json();
    },
    
    async getHistorico(userId = null) {
        const url = userId ? `api/get_historico.php?user_id=${userId}` : 'api/get_historico.php';
        const response = await fetch(url);
        return await response.json();
    },
    
    async alterarSenha(senhaAtual, senhaNova) {
        const response = await fetch('api/alterar_senha.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({senhaAtual, senhaNova})
        });
        return await response.json();
    },
    
    async savePlayback(idTitulo, currentTime, duration) {
        const response = await fetch('api/save_playback.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({idTitulo, currentTime, duration})
        });
        return await response.json();
    },
    
    async getTopsSemana(tipo, limit = 20) {
        const response = await fetch(`api/get_tops_semana.php?tipo=${tipo}&limit=${limit}`);
        return await response.json();
    },
    
    async getPlayback(idTitulo) {
        const response = await fetch(`api/get_user_playback.php?idTitulo=${idTitulo}`);
        return await response.json();
    }
};
