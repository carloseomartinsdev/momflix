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
$mensagem = trim($data['mensagem'] ?? '');

if (!$sala_id || empty($mensagem)) {
    echo json_encode(['success' => false, 'error' => 'Sala e mensagem são obrigatórios']);
    exit;
}

if (strlen($mensagem) > 500) {
    echo json_encode(['success' => false, 'error' => 'Mensagem muito longa']);
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
    
    // Inserir mensagem
    $stmt = $pdo->prepare("INSERT INTO sala_mensagens (sala_id, usuario_id, mensagem) VALUES (?, ?, ?)");
    $stmt->execute([$sala_id, $_SESSION['user_id'], $mensagem]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao enviar mensagem']);
}
?>
