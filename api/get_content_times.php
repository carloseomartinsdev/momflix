<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$id = $_GET['id'] ?? '';

if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID não especificado']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT intro_start, intro_end, content_end FROM episodios WHERE id = ?");
    $stmt->execute([$id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $result ?: null]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
