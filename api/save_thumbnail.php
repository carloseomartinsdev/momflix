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

if (!isset($_FILES['thumbnail']) || !isset($_POST['id'])) {
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

try {
    $id = $_POST['id'];
    $file = $_FILES['thumbnail'];

    $thumbDir = '../thumbnails';
    if (!file_exists($thumbDir)) {
        mkdir($thumbDir, 0755, true);
    }

    $filename = $id . '.jpg';
    $filepath = $thumbDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        $stmt = $pdo->prepare("UPDATE episodios SET thumbnail = :thumb WHERE id = :id");
        $stmt->execute([
            'thumb' => $filename,
            'id' => $id
        ]);

        echo json_encode(['success' => true, 'thumbnail' => $filename]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erro ao salvar arquivo']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
