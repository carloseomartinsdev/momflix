<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';
require_once '../../config/bloqueios_helper.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$tipo = $_GET['tipo'] ?? 'filme';
$limit = (int)($_GET['limit'] ?? 20);

try {
    $userId = $_SESSION['user_id'];
    $bloqueios = getBloqueiosUsuario($pdo, $userId);
    
    $sql = "
        SELECT 
            t.id, t.nome, t.tipo, t.capa, t.is_novo,
            SUM(v.play_count) as total_views
        FROM titulos t
        LEFT JOIN videos v ON t.id = v.id_titulo 
            AND v.last_played >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        WHERE t.tipo = ?
    ";
    
    $params = [$tipo];
    aplicarFiltrosBloqueios($sql, $params, $bloqueios);
    
    $sql .= " GROUP BY t.id ORDER BY total_views DESC, t.nome LIMIT $limit";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $titulos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $titulos]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
