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

if (!isset($_FILES['thumbnail']) || !isset($_POST['arquivo'])) {
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

try {
    $arquivo = $_POST['arquivo'];
    $file = $_FILES['thumbnail'];
    
    // Buscar episodio pelo path
    $stmt = $pdo->prepare("SELECT id FROM episodios WHERE path LIKE :path");
    $stmt->execute(['path' => "%$arquivo%"]);
    $episodio = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$episodio) {
        echo json_encode(['success' => false, 'error' => 'Episódio não encontrado']);
        exit;
    }
    
    // Criar diretório de thumbnails se não existir
    $thumbDir = '../thumbnails';
    if (!file_exists($thumbDir)) {
        mkdir($thumbDir, 0755, true);
    }
    
    // Nome do arquivo baseado no id do episodio
    $filename = $episodio['id'] . '.jpg';
    $filepath = $thumbDir . '/' . $filename;
    
    // Mover arquivo
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Atualizar banco de dados
        $stmt = $pdo->prepare("UPDATE episodios SET thumbnail = :thumb WHERE id = :id");
        $stmt->execute([
            'thumb' => $filename,
            'id' => $episodio['id']
        ]);
        
        echo json_encode(['success' => true, 'thumbnail' => $filename]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erro ao salvar arquivo']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
