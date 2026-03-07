<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado']);
    exit;
}

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'ID do usuário não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT b.*, t.nome as titulo_nome 
        FROM bloqueios b
        LEFT JOIN titulos t ON b.tipo_bloqueio = 'titulo' AND b.valor = t.id
        WHERE b.user_id = :user_id 
        ORDER BY b.tipo_bloqueio, b.valor
    ");
    $stmt->execute(['user_id' => $userId]);
    $bloqueios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $bloqueios]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
