let tituloSelecionado = null;
let episodioSelecionado = null;

// Carregar salas ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarMinhasSalas();
    carregarSalasPublicas();
    
    // Atualizar salas a cada 30 segundos
    setInterval(() => {
        carregarMinhasSalas();
        carregarSalasPublicas();
    }, 30000);
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

function selecionarTipoSala(tipo) {
    // Remover classe active de todos os botões
    document.querySelectorAll('.tipo-sala-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao botão selecionado
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');
}

async function criarSala() {
    const nome = document.getElementById('nomeSala').value.trim();
    const tipoSala = document.querySelector('.tipo-sala-btn.active').dataset.tipo;
    
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
            titulo_id: tituloSelecionado.id,
            is_publica: tipoSala === 'publica'
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
            // Criar modal de sucesso
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8); display: flex; align-items: center;
                justify-content: center; z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: #181818; border-radius: 8px; padding: 30px;
                    border: 1px solid #333; max-width: 400px; text-align: center;
                ">
                    <h3 style="color: white; margin: 0 0 20px 0;">🎉 Sala Criada!</h3>
                    <p style="color: #ccc; margin: 0 0 10px 0;">Sua sala foi criada com sucesso!</p>
                    <p style="color: #e50914; font-weight: bold; margin: 0 0 30px 0; font-size: 18px;">Código: ${data.codigo}</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="this.closest('div').remove(); fecharModal('modalCriar')" style="
                            padding: 10px 20px; background: #333; color: white;
                            border: none; border-radius: 6px; cursor: pointer;
                        ">Ficar Aqui</button>
                        <button onclick="window.location.href='sala.php?id=${data.sala_id}'" style="
                            padding: 10px 20px; background: #e50914; color: white;
                            border: none; border-radius: 6px; cursor: pointer;
                        ">Entrar na Sala</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
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
        console.log('Carregando salas...');
        const response = await fetch('api/get_minhas_salas.php');
        const data = await response.json();
        
        console.log('Resposta da API:', data);
        
        const container = document.getElementById('listaSalas');
        
        if (data.success && data.salas.length > 0) {
            console.log('Salas encontradas:', data.salas.length);
            container.innerHTML = data.salas.map(sala => `
                <div class="sala-card">
                    <div class="sala-capa">
                        <img src="image.php?path=${encodeURIComponent(sala.capa)}" alt="${sala.titulo}" onerror="this.src='logoS.png'">
                    </div>
                    <div class="sala-content">
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
                </div>
            `).join('');
        } else {
            console.log('Nenhuma sala encontrada');
            container.innerHTML = '<p style="color: #ccc; text-align: center;">Nenhuma sala ativa</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar salas:', error);
        document.getElementById('listaSalas').innerHTML = '<p style="color: #f00; text-align: center;">Erro ao carregar salas</p>';
    }
}

async function carregarSalasPublicas() {
    try {
        console.log('Carregando salas públicas...');
        const response = await fetch('api/get_salas_publicas.php');
        const data = await response.json();
        
        console.log('Salas públicas:', data);
        
        const container = document.getElementById('salasPublicas');
        
        if (data.success && data.salas.length > 0) {
            container.innerHTML = data.salas.map(sala => `
                <div class="sala-card">
                    <div class="sala-capa">
                        <img src="image.php?path=${encodeURIComponent(sala.capa)}" alt="${sala.titulo}" onerror="this.src='logoS.png'">
                    </div>
                    <div class="sala-content">
                        <div class="sala-header">
                            <div class="sala-nome">${sala.nome}</div>
                            <div class="sala-codigo">${sala.codigo}</div>
                        </div>
                        <div class="sala-info">
                            <div class="sala-titulo">${sala.titulo}</div>
                            <div class="sala-participantes">${sala.participantes_count} participante(s)</div>
                            <div class="sala-lider">Líder: ${sala.lider_nome}</div>
                        </div>
                        <div class="sala-actions">
                            <button class="btn-entrar-sala" onclick="entrarSalaPublica(${sala.id})">
                                Entrar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #ccc; text-align: center;">Nenhuma sala pública disponível</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar salas públicas:', error);
        document.getElementById('salasPublicas').innerHTML = '<p style="color: #f00; text-align: center;">Erro ao carregar salas públicas</p>';
    }
}

async function entrarSalaPublica(salaId) {
    try {
        const response = await fetch('api/entrar_sala.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sala_id: salaId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = `sala.php?id=${salaId}`;
        } else {
            alert(data.error || 'Erro ao entrar na sala');
        }
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        alert('Erro ao entrar na sala');
    }
}

async function limparSalasVazias() {
    if (!confirm('Desativar salas sem participantes ativos? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch('api/limpar_salas.php', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert(`${data.salas_desativadas} salas desativadas e ${data.participantes_desativados} participantes removidos.`);
            carregarMinhasSalas();
            carregarSalasPublicas();
        } else {
            alert(data.error || 'Erro ao limpar salas');
        }
    } catch (error) {
        console.error('Erro ao limpar salas:', error);
        alert('Erro ao limpar salas');
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