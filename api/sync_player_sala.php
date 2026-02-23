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
    
    // Buscar estado do player
    $stmt = $pdo->prepare("
        SELECT tempo_atual, pausado, timestamp_acao
        FROM salas 
        WHERE id = ? AND ativo = 1
    ");
    $stmt->execute([$sala_id]);
    $estado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$estado) {
        echo json_encode(['success' => false, 'error' => 'Sala não encontrada']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'player_state' => [
            'tempo_atual' => floatval($estado['tempo_atual']),
            'pausado' => (bool)$estado['pausado'],
            'timestamp' => intval($estado['timestamp_acao'])
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao sincronizar player']);
}
?>