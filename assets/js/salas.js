let tituloSelecionado = null;
let episodioSelecionado = null;

// Carregar salas ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarMinhasSalas();
});

function mostrarModalCriar() {
    const modal = document.getElementById('modalCriar');
    modal.classList.add('show');
    document.getElementById('nomeSala').focus();
}

function mostrarModalEntrar() {
    const modal = document.getElementById('modalEntrar');
    modal.classList.add('show');
    document.getElementById('codigoSala').focus();
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    // Limpar campos
    if (modalId === 'modalCriar') {
        document.getElementById('nomeSala').value = '';
        document.getElementById('buscaTitulo').value = '';
        document.getElementById('resultadosTitulos').innerHTML = '';
        document.getElementById('tituloSelecionado').style.display = 'none';
        document.getElementById('episodioSelector').style.display = 'none';
        tituloSelecionado = null;
        episodioSelecionado = null;
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
        const response = await fetch(`api/buscar.php?termo=${encodeURIComponent(busca)}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            resultados.innerHTML = data.data.slice(0, 5).map(titulo => `
                <div class="resultado-item" onclick="selecionarTitulo('${titulo.id}', '${titulo.nome.replace(/'/g, "\\'")}')">  
                    <strong>${titulo.nome}</strong> <span class="badge badge-${titulo.tipo}">${titulo.tipo}</span>
                </div>
            `).join('');
        } else {
            resultados.innerHTML = '<div class="resultado-item">Nenhum título encontrado</div>';
        }
    } catch (error) {
        console.error('Erro ao buscar títulos:', error);
    }
}

async function selecionarTitulo(id, nome) {
    try {
        const response = await fetch(`api/get_titulo.php?id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            tituloSelecionado = data.data;
            document.getElementById('buscaTitulo').style.display = 'none';
            document.getElementById('resultadosTitulos').innerHTML = '';
            
            const tituloSelecionadoDiv = document.getElementById('tituloSelecionado');
            tituloSelecionadoDiv.querySelector('.titulo-nome').textContent = nome;
            tituloSelecionadoDiv.style.display = 'block';
            
            // Se for série, mostrar seletor de episódios
            if (['serie', 'anime', 'bl', 'donghua'].includes(tituloSelecionado.tipo)) {
                mostrarSeletorEpisodios(tituloSelecionado.temporadas);
            } else {
                document.getElementById('episodioSelector').style.display = 'none';
                episodioSelecionado = null;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar título:', error);
    }
}

function removerTitulo() {
    tituloSelecionado = null;
    episodioSelecionado = null;
    document.getElementById('buscaTitulo').style.display = 'block';
    document.getElementById('buscaTitulo').value = '';
    document.getElementById('tituloSelecionado').style.display = 'none';
    document.getElementById('episodioSelector').style.display = 'none';
}

function mostrarSeletorEpisodios(temporadas) {
    const container = document.getElementById('temporadasContainer');
    const episodioSelector = document.getElementById('episodioSelector');
    
    container.innerHTML = temporadas.map((temp, tempIndex) => `
        <div class="temporada-item">
            <div class="temporada-header" onclick="toggleTemporada(${tempIndex})">
                <span>Temporada ${temp.nome_temporada}</span>
                <span class="temporada-arrow">▶</span>
            </div>
            <div class="episodios-list" id="episodios-${tempIndex}">
                ${temp.episodios.map(ep => `
                    <div class="episodio-item" onclick="selecionarEpisodio('${ep.id}', '${temp.nome_temporada}', '${ep.tag}', '${ep.titulo_episodio || 'Episódio ' + ep.tag}')">
                        Ep. ${ep.tag} ${ep.titulo_episodio ? '- ' + ep.titulo_episodio : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    episodioSelector.style.display = 'block';
}

function toggleTemporada(index) {
    const episodiosList = document.getElementById(`episodios-${index}`);
    const arrow = episodiosList.previousElementSibling.querySelector('.temporada-arrow');
    
    if (episodiosList.classList.contains('show')) {
        episodiosList.classList.remove('show');
        arrow.textContent = '▶';
    } else {
        episodiosList.classList.add('show');
        arrow.textContent = '▼';
    }
}

function selecionarEpisodio(episodioId, temporada, tag, titulo) {
    // Remover seleção anterior
    document.querySelectorAll('.episodio-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Selecionar novo episódio
    event.target.classList.add('selected');
    episodioSelecionado = {
        id: episodioId,
        temporada: temporada,
        tag: tag,
        titulo: titulo
    };
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
    
    // Para séries, verificar se um episódio foi selecionado
    if (['serie', 'anime', 'bl', 'donghua'].includes(tituloSelecionado.tipo) && !episodioSelecionado) {
        alert('Selecione um episódio');
        return;
    }
    
    try {
        const payload = {
            nome: nome,
            titulo_id: tituloSelecionado.id
        };
        
        if (episodioSelecionado) {
            payload.episodio_id = episodioSelecionado.id;
        }
        
        const response = await fetch('api/criar_sala.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
    const modals = document.querySelectorAll('.sala-modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
}