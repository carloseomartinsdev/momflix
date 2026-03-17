<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE episodios SET intro_start = :intro_start, intro_end = :intro_end, content_end = :content_end WHERE id = :id");
    $stmt->execute([
        'intro_start' => $data['intro_start'] ?? 0,
        'intro_end' => $data['intro_end'] ?? 0,
        'content_end' => $data['content_end'] ?? 0,
        'id' => $data['id']
    ]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
