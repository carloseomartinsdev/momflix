<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

require_once '../../config/database.php';

$idTitulo = $_GET['idTitulo'] ?? '';

if (!$idTitulo) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("
        SELECT current_time_sec, duration_sec, progress_percent
        FROM videos
        WHERE id_titulo = :id_titulo AND user_id = :user_id
    ");
    
    $stmt->execute([
        'id_titulo' => $idTitulo,
        'user_id' => $userId
    ]);
    
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $data]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
