<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$sala_id = $_GET['sala_id'] ?? 0;

if (!$sala_id) {
    echo json_encode(['success' => false, 'error' => 'ID da sala é obrigatório']);
    exit;
}

try {
    // Verificar se usuário está na sala
    $stmt = $pdo->prepare("SELECT 1 FROM sala_participantes WHERE sala_id = ? AND usuario_id = ? AND ativo = 1");
    $stmt->execute([$sala_id, $_SESSION['user_id']]);
    
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Usuário não está na sala']);
        exit;
    }
    
    // Buscar estado atual da sala
    $stmt = $pdo->prepare("
        SELECT s.*, t.titulo, t.tipo, e.numero as episodio_numero, e.titulo as episodio_titulo
        FROM salas s
        JOIN titulos t ON s.titulo_id = t.id
        LEFT JOIN episodios e ON s.episodio_id = e.id
        WHERE s.id = ? AND s.ativo = 1
    ");
    $stmt->execute([$sala_id]);
    $sala = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sala) {
        echo json_encode(['success' => false, 'error' => 'Sala não encontrada']);
        exit;
    }
    
    // Buscar participantes
    $stmt = $pdo->prepare("
        SELECT u.nome, u.id, sp.entrou_em, (sp.usuario_id = s.lider_id) as is_lider
        FROM sala_participantes sp
        JOIN usuarios u ON sp.usuario_id = u.id
        JOIN salas s ON sp.sala_id = s.id
        WHERE sp.sala_id = ? AND sp.ativo = 1
        ORDER BY sp.entrou_em
    ");
    $stmt->execute([$sala_id]);
    $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Buscar mensagens recentes
    $stmt = $pdo->prepare("
        SELECT sm.mensagem, sm.enviado_em, u.nome as usuario_nome
        FROM sala_mensagens sm
        JOIN usuarios u ON sm.usuario_id = u.id
        WHERE sm.sala_id = ?
        ORDER BY sm.enviado_em DESC
        LIMIT 50
    ");
    $stmt->execute([$sala_id]);
    $mensagens = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo json_encode([
        'success' => true,
        'sala' => $sala,
        'participantes' => $participantes,
        'mensagens' => $mensagens,
        'is_lider' => $sala['lider_id'] == $_SESSION['user_id']
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao sincronizar sala']);
}
?>