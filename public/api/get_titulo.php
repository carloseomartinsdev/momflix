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

$id = $_GET['id'] ?? '';

if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT t.*, 
               GROUP_CONCAT(DISTINCT g.genero SEPARATOR ', ') as generos
        FROM titulos t
        LEFT JOIN titulo_genero tg ON t.id = tg.titulo_id
        LEFT JOIN generos g ON tg.genero_id = g.id
        WHERE t.id = :id
        GROUP BY t.id
    ");
    $stmt->execute(['id' => $id]);
    $titulo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$titulo) {
        echo json_encode(['success' => false, 'error' => 'Título não encontrado']);
        exit;
    }
    
    $titulo['views'] = 0;
    
    if (in_array($titulo['tipo'], ['serie', 'anime', 'bl', 'donghua'])) {
        $stmt = $pdo->prepare("
            SELECT id, temporada, tag, path, titulo_episodio, duracao, sinopse, thumbnail
            FROM episodios
            WHERE titulo_id = :id
            ORDER BY temporada, tag
        ");
        $stmt->execute(['id' => $id]);
        $episodios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $temporadas = [];
        foreach ($episodios as $ep) {
            if (!isset($temporadas[$ep['temporada']])) {
                $temporadas[$ep['temporada']] = [
                    'nome_temporada' => $ep['temporada'],
                    'episodios' => []
                ];
            }
            $temporadas[$ep['temporada']]['episodios'][] = $ep;
        }
        $titulo['temporadas'] = array_values($temporadas);
    }
    
    if ($titulo['is_saga']) {
        $stmt = $pdo->prepare("
            SELECT id, nome, path, capa, duracao, sinopse
            FROM filmes_saga
            WHERE saga_id = :id
            ORDER BY nome
        ");
        $stmt->execute(['id' => $id]);
        $titulo['filmes_saga'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'data' => $titulo]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
