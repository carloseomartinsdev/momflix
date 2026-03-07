<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || $data['id'] == 1) {
    echo json_encode(['success' => false, 'error' => 'Não é possível deletar este usuário']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id");
    $stmt->execute(['id' => $data['id']]);
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
