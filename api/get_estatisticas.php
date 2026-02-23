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

try {
    // Total de títulos
    $stmt = $pdo->query("SELECT COUNT(*) FROM titulos");
    $total_titulos = $stmt->fetchColumn();
    
    // Por tipo
    $stmt = $pdo->query("SELECT tipo, COUNT(*) as total FROM titulos GROUP BY tipo");
    $porTipo = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Total de episódios
    $stmt = $pdo->query("SELECT COUNT(*) FROM episodios");
    $total_episodios = $stmt->fetchColumn();
    
    // Novidades
    $stmt = $pdo->query("SELECT COUNT(*) FROM titulos WHERE is_novo = 1");
    $novidades = $stmt->fetchColumn();
    
    // Total de gêneros
    $stmt = $pdo->query("SELECT COUNT(DISTINCT genero_id) FROM titulo_genero");
    $total_generos = $stmt->fetchColumn();
    
    // Mais assistido
    $stmt = $pdo->query("
        SELECT t.nome, SUM(v.play_count) as total_views
        FROM titulos t
        JOIN videos v ON t.id = v.id_titulo
        GROUP BY t.id
        ORDER BY total_views DESC
        LIMIT 1
    ");
    $maisAssistido = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stats = [
        'total_titulos' => $total_titulos,
        'filmes' => $porTipo['filme'] ?? 0,
        'series' => $porTipo['serie'] ?? 0,
        'bls' => $porTipo['bl'] ?? 0,
        'animes' => $porTipo['anime'] ?? 0,
        'donghuas' => $porTipo['donghua'] ?? 0,
        'total_episodios' => $total_episodios,
        'novidades' => $novidades,
        'total_generos' => $total_generos,
        'mais_assistido' => $maisAssistido['nome'] ?? 'Nenhum'
    ];
    
    echo json_encode(['success' => true, 'data' => $stats]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
