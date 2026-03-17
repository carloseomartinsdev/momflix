<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$idTitulo = $_GET['idTitulo'] ?? '';

if (!$idTitulo) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT titulo_episodio, tag, temporada FROM episodios WHERE id = ? LIMIT 1");
    $stmt->execute([$idTitulo]);
    $episodio = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($episodio) {
        echo json_encode(['success' => true, 'episodio' => $episodio]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Episódio não encontrado']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
