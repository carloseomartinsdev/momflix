<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';
require_once '../../config/bloqueios_helper.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$limit = $_GET['limit'] ?? 15;

try {
    $userId = $_SESSION['user_id'];
    $bloqueios = getBloqueiosUsuario($pdo, $userId);
    
    $sql = "
        SELECT t.id, t.nome, t.tipo, t.capa, t.is_novo, t.rolo,
               COALESCE(SUM(v.play_count), 0) as views
        FROM titulos t
        LEFT JOIN videos v ON t.id = v.id_titulo
        WHERE 1=1
    ";
    
    $params = [];
    aplicarFiltrosBloqueios($sql, $params, $bloqueios);
    
    $sql .= " GROUP BY t.id HAVING views > 0 ORDER BY views DESC LIMIT " . (int)$limit;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $data]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
