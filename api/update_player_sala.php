<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$sala_id = $data['sala_id'] ?? 0;
$tempo_atual = $data['tempo_atual'] ?? 0;
$pausado = $data['pausado'] ?? true;

if (!$sala_id) {
    echo json_encode(['success' => false, 'error' => 'ID da sala é obrigatório']);
    exit;
}

try {
    // Verificar se usuário é o líder da sala
    $stmt = $pdo->prepare("SELECT lider_id FROM salas WHERE id = ? AND ativo = 1");
    $stmt->execute([$sala_id]);
    $sala = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sala || $sala['lider_id'] != $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'error' => 'Apenas o líder pode controlar o player']);
        exit;
    }
    
    // Atualizar estado da sala
    $stmt = $pdo->prepare("UPDATE salas SET tempo_atual = ?, pausado = ? WHERE id = ?");
    $stmt->execute([$tempo_atual, $pausado ? 1 : 0, $sala_id]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao atualizar player']);
}
?>