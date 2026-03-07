<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$arquivo = $_GET['arquivo'] ?? '';
$idTitulo = $_GET['idTitulo'] ?? '';

if (!$arquivo || !$idTitulo) {
    echo json_encode(['success' => false, 'error' => 'Parâmetros obrigatórios não fornecidos']);
    exit;
}

try {
    // Busca episódio pelo nome do arquivo
    $stmt = $pdo->prepare("
        SELECT titulo_episodio, tag, temporada 
        FROM episodios 
        WHERE titulo_id = ? AND path LIKE ?
        LIMIT 1
    ");
    $stmt->execute([$idTitulo, '%' . $arquivo]);
    $episodio = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($episodio) {
        echo json_encode(['success' => true, 'episodio' => $episodio]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Episódio não encontrado']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
