<?php
session_start();

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    header('Location: index.php');
    exit;
}

$username = $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Usuários - MomFlix</title>
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/header.css">
    <style>
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .users-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .btn-add {
            background: var(--red-primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-add:hover {
            background: var(--red-hover);
        }
        
        .users-table {
            width: 100%;
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .users-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .users-table th {
            background: var(--bg-tertiary);
            padding: 15px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid var(--border-light);
        }
        
        .users-table td {
            padding: 15px;
            border-bottom: 1px solid var(--border-light);
        }
        
        .users-table tr:hover {
            background: var(--bg-hover);
        }
        
        .badge-admin {
            background: var(--red-primary);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .badge-user {
            background: var(--border-light);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .btn-action {
            background: var(--border-light);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 5px;
        }
        
        .btn-action:hover {
            background: var(--border-medium);
        }
        
        .btn-delete {
            background: #f44336;
        }
        
        .btn-delete:hover {
            background: #d32f2f;
        }
        
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal {
            background: var(--bg-tertiary);
            border-radius: 8px;
            width: 400px;
            padding: 20px;
            border: 1px solid var(--border-light);
        }
        
        .modal h2 {
            margin-top: 0;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: 4px;
            color: var(--text-primary);
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: var(--red-primary);
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn-save {
            flex: 1;
            background: var(--red-primary);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .btn-cancel {
            flex: 1;
            background: var(--border-light);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
        }
    </style>
</head>
<body>
<header>
    <h1><a href="index.php" style="color: #e50914; text-decoration: none;">MomFlix</a></h1>
    <div class="filtros">
        <button onclick="window.location.href='index.php'" class="btn-header">🏠 Voltar</button>
        <button onclick="window.location.href='logout.php'" class="btn-header">🚪 Sair</button>
    </div>
</header>

<div class="container">
    <div class="users-header">
        <h2>Gerenciar Usuários</h2>
        <button class="btn-add" onclick="abrirModalAdicionar()">➕ Adicionar Usuário</button>
    </div>
    
    <div class="users-table">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Tipo</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody id="usersTableBody">
                <tr>
                    <td colspan="5" style="text-align: center;">Carregando...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Adicionar/Editar -->
<div class="modal-overlay" id="modalUser" onclick="fecharModal()">
    <div class="modal" onclick="event.stopPropagation()">
        <h2 id="modalTitle">Adicionar Usuário</h2>
        <form id="userForm" onsubmit="salvarUsuario(event)">
            <input type="hidden" id="userId">
            <div class="form-group">
                <label>Usuário:</label>
                <input type="text" id="username" required>
            </div>
            <div class="form-group">
                <label>Senha:</label>
                <input type="password" id="password">
                <small style="color: var(--text-tertiary);">Deixe em branco para manter a senha atual</small>
            </div>
            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="isAdmin">
                    <label for="isAdmin" style="margin: 0;">Administrador</label>
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-save">Salvar</button>
                <button type="button" class="btn-cancel" onclick="fecharModal()">Cancelar</button>
            </div>
        </form>
    </div>
</div>

<script>
function carregarUsuarios() {
    fetch('api/get_usuarios.php')
        .then(r => r.json())
        .then(result => {
            const tbody = document.getElementById('usersTableBody');
            
            if (result.success && result.data.length > 0) {
                tbody.innerHTML = result.data.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>
                            <span class="badge-${user.is_admin ? 'admin' : 'user'}">
                                ${user.is_admin ? 'Admin' : 'Usuário'}
                            </span>
                        </td>
                        <td>${new Date(user.created_at).toLocaleString('pt-BR')}</td>
                        <td>
                            <button class="btn-action" onclick="editarUsuario(${user.id})">✏️ Editar</button>
                            <button class="btn-action" onclick="gerenciarBloqueios(${user.id}, '${user.username}')">🚫 Bloqueios</button>
                            <button class="btn-action" onclick="verHistorico(${user.id})">📅 Histórico</button>
                            ${user.id !== 1 ? `<button class="btn-action btn-delete" onclick="deletarUsuario(${user.id})">🗑️ Deletar</button>` : ''}
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
            }
        });
}

function abrirModalAdicionar() {
    document.getElementById('modalTitle').textContent = 'Adicionar Usuário';
    document.getElementById('userId').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('isAdmin').checked = false;
    document.getElementById('modalUser').style.display = 'flex';
}

function editarUsuario(id) {
    fetch(`api/get_usuario.php?id=${id}`)
        .then(r => r.json())
        .then(result => {
            if (result.success) {
                document.getElementById('modalTitle').textContent = 'Editar Usuário';
                document.getElementById('userId').value = result.data.id;
                document.getElementById('username').value = result.data.username;
                document.getElementById('password').value = '';
                document.getElementById('isAdmin').checked = result.data.is_admin;
                document.getElementById('modalUser').style.display = 'flex';
            }
        });
}

function salvarUsuario(e) {
    e.preventDefault();
    
    const data = {
        id: document.getElementById('userId').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        is_admin: document.getElementById('isAdmin').checked
    };
    
    fetch('api/save_usuario.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            alert('Usuário salvo com sucesso!');
            fecharModal();
            carregarUsuarios();
        } else {
            alert('Erro: ' + result.error);
        }
    });
}

function deletarUsuario(id) {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    
    fetch('api/delete_usuario.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            alert('Usuário deletado com sucesso!');
            carregarUsuarios();
        } else {
            alert('Erro: ' + result.error);
        }
    });
}

function fecharModal() {
    document.getElementById('modalUser').style.display = 'none';
}

function verHistorico(userId) {
    ModalHistorico.abrir(userId);
}

let currentUserId = null;

function gerenciarBloqueios(userId, username) {
    currentUserId = userId;
    document.getElementById('bloqueiosUsername').textContent = username;
    carregarBloqueios(userId);
    atualizarOpcoesValor();
    document.getElementById('modalBloqueios').style.display = 'flex';
}

function atualizarOpcoesValor() {
    const tipo = document.getElementById('tipoBloqueio').value;
    const select = document.getElementById('valorBloqueio');
    
    if (tipo === 'tipo') {
        select.innerHTML = `
            <option value="">Selecione...</option>
            <option value="filme">Filme</option>
            <option value="serie">Série</option>
            <option value="bl">BL</option>
            <option value="anime">Anime</option>
            <option value="donghua">Donghua</option>
        `;
    } else {
        select.innerHTML = '<option value="">Carregando...</option>';
        fetch('api/get_catalogo.php?tipo=todos')
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    select.innerHTML = '<option value="">Selecione...</option>' +
                        result.data.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
                }
            });
    }
}

function carregarBloqueios(userId) {
    fetch(`api/get_bloqueios.php?user_id=${userId}`)
        .then(r => r.json())
        .then(result => {
            const lista = document.getElementById('bloqueiosList');
            if (result.success && result.data.length > 0) {
                lista.innerHTML = result.data.map(b => {
                    const valorDisplay = b.tipo_bloqueio === 'titulo' ? b.titulo_nome : b.valor;
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-hover); border-radius: 4px; margin-bottom: 8px;">
                            <div>
                                <strong>${b.tipo_bloqueio === 'tipo' ? 'Tipo' : 'Título'}:</strong> ${valorDisplay}
                            </div>
                            <button class="btn-action btn-delete" onclick="removerBloqueio(${b.id})">×</button>
                        </div>
                    `;
                }).join('');
            } else {
                lista.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Nenhum bloqueio configurado</p>';
            }
        });
}

function adicionarBloqueio() {
    const tipo = document.getElementById('tipoBloqueio').value;
    const valor = document.getElementById('valorBloqueio').value;
    
    if (!valor) {
        alert('Selecione um valor');
        return;
    }
    
    fetch('api/save_bloqueio.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            user_id: currentUserId,
            tipo_bloqueio: tipo,
            valor: valor
        })
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            carregarBloqueios(currentUserId);
            document.getElementById('valorBloqueio').value = '';
        } else {
            alert('Erro: ' + result.error);
        }
    });
}

function removerBloqueio(id) {
    if (!confirm('Remover este bloqueio?')) return;
    
    fetch('api/delete_bloqueio.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            carregarBloqueios(currentUserId);
        } else {
            alert('Erro: ' + result.error);
        }
    });
}

function fecharModalBloqueios() {
    document.getElementById('modalBloqueios').style.display = 'none';
}

carregarUsuarios();
</script>
<script src="assets/js/api.js"></script>
<script src="assets/js/modals/modal-historico.js"></script>
<link rel="stylesheet" href="assets/css/modals.css">

<!-- Modal Bloqueios -->
<div class="modal-overlay" id="modalBloqueios" onclick="fecharModalBloqueios()">
    <div class="modal" onclick="event.stopPropagation()" style="max-width: 600px;">
        <h2>Gerenciar Bloqueios - <span id="bloqueiosUsername"></span></h2>
        
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-hover); border-radius: 4px;">
            <div class="form-group">
                <label>Tipo de Bloqueio:</label>
                <select id="tipoBloqueio" onchange="atualizarOpcoesValor()" style="width: 100%; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary);">
                    <option value="tipo">Bloquear Tipo</option>
                    <option value="titulo">Bloquear Título Específico</option>
                </select>
            </div>
            <div class="form-group">
                <label>Valor:</label>
                <select id="valorBloqueio" style="width: 100%; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary);">
                    <option value="">Selecione...</option>
                </select>
            </div>
            <button class="btn-save" onclick="adicionarBloqueio()" style="width: 100%;">Adicionar Bloqueio</button>
        </div>
        
        <h3>Bloqueios Ativos:</h3>
        <div id="bloqueiosList" style="max-height: 300px; overflow-y: auto;"></div>
        
        <div style="margin-top: 20px;">
            <button class="btn-cancel" onclick="fecharModalBloqueios()" style="width: 100%;">Fechar</button>
        </div>
    </div>
</div>

</body>
</html>
