<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';
require_once '../../config/bloqueios_helper.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    $bloqueios = getBloqueiosUsuario($pdo, $userId);
    
    $sql = "
        SELECT 
            g.genero,
            t.id, t.nome, t.tipo, t.capa, t.is_novo,
            COALESCE(v.play_count, 0) as views
        FROM titulos t
        JOIN titulo_genero tg ON t.id = tg.titulo_id
        JOIN generos g ON tg.genero_id = g.id
        LEFT JOIN videos v ON t.id = v.id_titulo AND v.user_id = ?
        WHERE 1=1
    ";
    
    $params = [$userId];
    aplicarFiltrosBloqueios($sql, $params, $bloqueios);
    
    $sql .= " ORDER BY g.genero, v.play_count DESC, RAND()";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $titulos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $porGenero = [];
    $generoViews = [];
    
    foreach ($titulos as $titulo) {
        $genero = $titulo['genero'];
        unset($titulo['genero']);
        
        if (!isset($porGenero[$genero])) {
            $porGenero[$genero] = [];
            $generoViews[$genero] = 0;
        }
        $porGenero[$genero][] = $titulo;
        $generoViews[$genero] += $titulo['views'];
    }
    
    // Ordenar por views do usuário (mais assistidos primeiro)
    arsort($generoViews);
    $porGeneroOrdenado = [];
    foreach ($generoViews as $genero => $views) {
        $porGeneroOrdenado[$genero] = $porGenero[$genero];
    }
    
    echo json_encode(['success' => true, 'data' => $porGeneroOrdenado]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
