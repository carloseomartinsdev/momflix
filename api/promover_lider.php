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
    // Verificar se o líder atual ainda está ativo na sala
    $stmt = $pdo->prepare("
        SELECT s.lider_id, sp.ativo 
        FROM salas s 
        LEFT JOIN sala_participantes sp ON s.lider_id = sp.usuario_id AND s.id = sp.sala_id
        WHERE s.id = ? AND s.ativo = 1
    ");
    $stmt->execute([$sala_id]);
    $sala = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sala) {
        echo json_encode(['success' => false, 'error' => 'Sala não encontrada']);
        exit;
    }
    
    // Se líder ainda está ativo, não fazer nada
    if ($sala['ativo'] == 1) {
        echo json_encode(['success' => true, 'promoted' => false, 'message' => 'Líder ainda ativo']);
        exit;
    }
    
    // Buscar próximo participante para ser líder (mais antigo)
    $stmt = $pdo->prepare("
        SELECT usuario_id 
        FROM sala_participantes 
        WHERE sala_id = ? AND ativo = 1 
        ORDER BY entrou_em ASC 
        LIMIT 1
    ");
    $stmt->execute([$sala_id]);
    $novo_lider = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$novo_lider) {
        // Não há participantes ativos, desativar sala
        $stmt = $pdo->prepare("UPDATE salas SET ativo = 0 WHERE id = ?");
        $stmt->execute([$sala_id]);
        echo json_encode(['success' => true, 'promoted' => false, 'message' => 'Sala desativada - sem participantes']);
        exit;
    }
    
    // Promover novo líder
    $stmt = $pdo->prepare("UPDATE salas SET lider_id = ? WHERE id = ?");
    $stmt->execute([$novo_lider['usuario_id'], $sala_id]);
    
    echo json_encode([
        'success' => true, 
        'promoted' => true, 
        'new_leader_id' => $novo_lider['usuario_id'],
        'message' => 'Novo líder promovido'
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao promover líder']);
}
?>