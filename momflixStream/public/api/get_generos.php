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

try {
    $stmt = $pdo->query("
        SELECT DISTINCT g.genero 
        FROM generos g
        WHERE EXISTS (
            SELECT 1 FROM titulo_genero tg WHERE tg.genero_id = g.id
        )
        ORDER BY g.genero
    ");
    
    $generos = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode(['success' => true, 'data' => $generos]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
