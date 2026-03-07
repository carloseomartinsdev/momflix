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

$arquivo = $_GET['arquivo'] ?? '';

if (!$arquivo) {
    echo json_encode(['exists' => false]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT thumbnail FROM episodios WHERE path LIKE :path");
    $stmt->execute(['path' => "%$arquivo%"]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $exists = $result && $result['thumbnail'] && file_exists('../thumbnails/' . $result['thumbnail']);
    
    echo json_encode(['exists' => $exists]);
    
} catch (Exception $e) {
    echo json_encode(['exists' => false]);
}
