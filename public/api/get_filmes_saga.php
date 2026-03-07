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

$sagaId = $_GET['saga_id'] ?? '';

if (!$sagaId) {
    echo json_encode(['success' => false, 'error' => 'ID da saga não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, nome, capa, duracao, sinopse, path
        FROM filmes_saga
        WHERE saga_id = :saga_id
        ORDER BY nome
    ");
    
    $stmt->execute(['saga_id' => $sagaId]);
    $filmes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Adicionar tipo filme para cada item
    foreach ($filmes as &$filme) {
        $filme['tipo'] = 'filme';
        $filme['is_novo'] = false;
        $filme['saga_id'] = $sagaId;
    }
    
    echo json_encode(['success' => true, 'data' => $filmes]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
