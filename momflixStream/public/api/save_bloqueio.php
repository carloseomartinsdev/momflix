<?php
header('Content-Type: application/json');
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['user_id'] ?? null;
$tipoBloqueio = $input['tipo_bloqueio'] ?? null;
$valor = $input['valor'] ?? null;

if (!$userId || !$tipoBloqueio || !$valor) {
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT IGNORE INTO bloqueios (user_id, tipo_bloqueio, valor) VALUES (:user_id, :tipo_bloqueio, :valor)");
    $stmt->execute([
        'user_id' => $userId,
        'tipo_bloqueio' => $tipoBloqueio,
        'valor' => $valor
    ]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
