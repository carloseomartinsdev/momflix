<?php
session_start();
header('Content-Type: application/json');

require_once '../config/database.php';

$idTitulo = $_GET['idTitulo'] ?? '';

if (!$idTitulo) {
    echo json_encode(['error' => 'ID do título não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT pasta_titulo FROM titulos WHERE id = ?");
    $stmt->execute([$idTitulo]);
    $titulo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$titulo) {
        echo json_encode(['error' => 'Título não encontrado']);
        exit;
    }
    
    $spritePath = $titulo['pasta_titulo'] . DIRECTORY_SEPARATOR . 'sprite.jpg';
    
    // Se não encontrar sprite.jpg, procura por sprite_*.jpg
    if (!file_exists($spritePath)) {
        $spriteFiles = glob($titulo['pasta_titulo'] . DIRECTORY_SEPARATOR . 'sprite_*.jpg');
        if (!empty($spriteFiles)) {
            $spritePath = $spriteFiles[0]; // Pega o primeiro encontrado
        }
    }
    
    if (file_exists($spritePath)) {
        // Converte para base64 e retorna inline
        $imageData = base64_encode(file_get_contents($spritePath));
        $base64 = 'data:image/jpeg;base64,' . $imageData;
        
        echo json_encode(['sprite' => $base64]);
    } else {
        echo json_encode(['sprite' => null]);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
