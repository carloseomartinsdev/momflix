<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

try {
    $stmt = $pdo->query("
        SELECT id, nome, tipo, capa, is_novo
        FROM titulos
        ORDER BY RAND()
        LIMIT 1
    ");
    
    $titulo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($titulo) {
        echo json_encode(['success' => true, 'data' => $titulo]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Nenhum título encontrado']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
