let tituloSelecionado = null;

// Carregar salas ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarMinhasSalas();
});

function mostrarModalCriar() {
    const modal = document.getElementById('modalCriar');
    modal.style.display = 'flex';
    document.getElementById('nomeSala').focus();
}

function mostrarModalEntrar() {
    const modal = document.getElementById('modalEntrar');
    modal.style.display = 'flex';
    document.getElementById('codigoSala').focus();
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Limpar campos
    if (modalId === 'modalCriar') {
        document.getElementById('nomeSala').value = '';
        document.getElementById('buscaTitulo').value = '';
        document.getElementById('resultadosTitulos').innerHTML = '';
        tituloSelecionado = null;
    } else {
        document.getElementById('codigoSala').value = '';
    }
}

async function buscarTitulos() {
    const busca = document.getElementById('buscaTitulo').value.trim();
    const resultados = document.getElementById('resultadosTitulos');
    
    if (busca.length < 2) {
        resultados.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`api/buscar.php?q=${encodeURIComponent(busca)}&limit=5`);
        const data = await response.json();
        
        if (data.success && data.results.length > 0) {
            resultados.innerHTML = data.results.map(titulo => `
                <div class="resultado-item" onclick="selecionarTitulo(${titulo.id}, '${titulo.titulo.replace(/'/g, "\\'")}')">
                    ${titulo.titulo} (${titulo.ano || 'N/A'})
                </div>
            `).join('');
        } else {
            resultados.innerHTML = '<div class="resultado-item">Nenhum título encontrado</div>';
        }
    } catch (error) {
        console.error('Erro ao buscar títulos:', error);
    }
}

function selecionarTitulo(id, titulo) {
    tituloSelecionado = { id, titulo };
    document.getElementById('buscaTitulo').value = titulo;
    document.getElementById('resultadosTitulos').innerHTML = '';
}

async function criarSala() {
    const nome = document.getElementById('nomeSala').value.trim();
    
    if (!nome) {
        alert('Digite um nome para a sala');
        return;
    }
    
    if (!tituloSelecionado) {
        alert('Selecione um título');
        return;
    }
    
    try {
        const response = await fetch('api/criar_sala.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: nome,
                titulo_id: tituloSelecionado.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Sala criada! Código: ${data.codigo}`);
            fecharModal('modalCriar');
            window.location.href = `sala.php?id=${data.sala_id}`;
        } else {
            alert(data.error || 'Erro ao criar sala');
        }
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala');
    }
}

async function entrarSala() {
    const codigo = document.getElementById('codigoSala').value.trim().toUpperCase();
    
    if (!codigo) {
        alert('Digite o código da sala');
        return;
    }
    
    try {
        const response = await fetch('api/entrar_sala.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });
        
        const data = await response.json();
        
        if (data.success) {
            fecharModal('modalEntrar');
            window.location.href = `sala.php?id=${data.sala.id}`;
        } else {
            alert(data.error || 'Erro ao entrar na sala');
        }
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        alert('Erro ao entrar na sala');
    }
}

async function carregarMinhasSalas() {
    try {
        const response = await fetch('api/get_minhas_salas.php');
        const data = await response.json();
        
        const container = document.getElementById('listaSalas');
        
        if (data.success && data.salas.length > 0) {
            container.innerHTML = data.salas.map(sala => `
                <div class="sala-card">
                    <div class="sala-header">
                        <div class="sala-nome">${sala.nome}</div>
                        <div class="sala-codigo">${sala.codigo}</div>
                    </div>
                    <div class="sala-info">
                        <div class="sala-titulo">${sala.titulo}</div>
                        <div class="sala-participantes">${sala.participantes_count} participante(s)</div>
                    </div>
                    <div class="sala-actions">
                        <button class="btn-entrar-sala" onclick="window.location.href='sala.php?id=${sala.id}'">
                            Entrar
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #ccc; text-align: center;">Nenhuma sala ativa</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar salas:', error);
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}