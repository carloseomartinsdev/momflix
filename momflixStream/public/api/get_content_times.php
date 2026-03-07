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
    echo json_encode(['success' => false, 'error' => 'Arquivo não especificado']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT intro_start, intro_end, content_end FROM episodios WHERE path LIKE :path");
    $stmt->execute(['path' => '%' . $arquivo]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo json_encode(['success' => true, 'data' => $result]);
    } else {
        echo json_encode(['success' => true, 'data' => null]);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
