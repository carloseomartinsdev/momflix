<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';
require_once '../../config/bloqueios_helper.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$limit = $_GET['limit'] ?? 10;

try {
    $userId = $_SESSION['user_id'];

    $sql = "
        SELECT 
            COALESCE(t.id, t2.id) AS id,
            COALESCE(t.nome, t2.nome) AS nome,
            COALESCE(t.tipo, t2.tipo) AS tipo,
            COALESCE(t.capa, t2.capa) AS capa,
            COALESCE(t.is_novo, t2.is_novo) AS is_novo,
            v.id_titulo AS rolo,
            v.progress_percent,
            v.current_time_sec,
            v.last_played
        FROM videos v
        LEFT JOIN titulos t ON t.id = v.id_titulo
        LEFT JOIN episodios e ON e.id = v.id_titulo
        LEFT JOIN titulos t2 ON t2.id = e.titulo_id
        WHERE v.user_id = ?
          AND v.progress_percent > 0
          AND v.progress_percent < 95
          AND (t.id IS NOT NULL OR e.id IS NOT NULL)
        ORDER BY v.last_played DESC
        LIMIT " . (int)$limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $data]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
