<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$nome = $data['nome'] ?? '';
$titulo_id = $data['titulo_id'] ?? 0;
$episodio_id = $data['episodio_id'] ?? null;
$is_publica = $data['is_publica'] ?? false;

if (empty($nome) || !$titulo_id) {
    echo json_encode(['success' => false, 'error' => 'Nome e título são obrigatórios']);
    exit;
}

// Gerar código único da sala
$codigo = strtoupper(substr(md5(uniqid()), 0, 6));

try {
    $pdo->beginTransaction();
    
    // Criar sala
    $stmt = $pdo->prepare("INSERT INTO salas (nome, codigo, lider_id, titulo_id, episodio_id, is_publica) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nome, $codigo, $_SESSION['user_id'], $titulo_id, $episodio_id, $is_publica ? 1 : 0]);
    $sala_id = $pdo->lastInsertId();
    
    // Adicionar criador como participante
    $stmt = $pdo->prepare("INSERT INTO sala_participantes (sala_id, usuario_id) VALUES (?, ?)");
    $stmt->execute([$sala_id, $_SESSION['user_id']]);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'sala_id' => $sala_id,
        'codigo' => $codigo
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => 'Erro ao criar sala']);
}
?>