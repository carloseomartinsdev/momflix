<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado']);
    exit;
}

require_once '../config/database.php';

$id = $_POST['id'] ?? null;
if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE titulos SET nome = ?, sinopse = ?, ano = ?, duracao = ?, classificacao = ?, diretor = ?, elenco = ?, rolo = ? WHERE id = ?");
    $stmt->execute([
        $_POST['nome'],
        $_POST['sinopse'],
        $_POST['ano'],
        $_POST['duracao'],
        $_POST['classificacao'],
        $_POST['diretor'],
        $_POST['elenco'],
        $_POST['rolo'] ?? '',
        $id
    ]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
