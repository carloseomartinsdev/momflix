<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$icon = $data['icon'] ?? null;

if (!$icon) {
    echo json_encode(['success' => false, 'error' => 'Ícone não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET profile_icon = ? WHERE id = ?");
    $stmt->execute([$icon, $_SESSION['user_id']]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
