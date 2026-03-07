<?php
header('Content-Type: application/json');
session_start();
require_once '../config/database.php';
require_once '../config/bloqueios_helper.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$limit = $_GET['limit'] ?? 10;

try {
    $userId = $_SESSION['user_id'];
    $bloqueios = getBloqueiosUsuario($pdo, $userId);
    
    $sql = "
        SELECT t.id, t.nome, t.tipo, t.capa, t.is_novo, t.rolo, t.path,
               v.progress_percent, v.current_time_sec
        FROM titulos t
        INNER JOIN videos v ON t.id = v.id_titulo
        WHERE v.user_id = ? AND v.progress_percent > 0 AND v.progress_percent < 95
    ";
    
    $params = [$userId];
    aplicarFiltrosBloqueios($sql, $params, $bloqueios);
    
    $sql .= " ORDER BY v.last_played DESC LIMIT " . (int)$limit;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $data]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
