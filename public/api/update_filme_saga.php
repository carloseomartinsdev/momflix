<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado']);
    exit;
}

require_once '../config/database.php';

$filmeId = $_POST['filme_id'] ?? null;
if (!$filmeId) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE filmes_saga SET nome = ?, sinopse = ?, duracao = ? WHERE id = ?");
    $stmt->execute([
        $_POST['nome'],
        $_POST['sinopse'],
        $_POST['duracao'],
        $filmeId
    ]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
