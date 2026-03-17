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

    // Filmes: id_titulo bate direto com titulos.id
    $sqlFilmes = "
        SELECT t.id, t.nome, t.tipo, t.capa, t.is_novo, v.id_titulo AS rolo,
               v.progress_percent, v.current_time_sec, v.last_played
        FROM videos v
        INNER JOIN titulos t ON t.id = v.id_titulo
        WHERE v.user_id = ? AND v.progress_percent > 0 AND v.progress_percent < 95
    ";

    // Séries: id_titulo bate com episodios.id, pega o título pai
    $sqlSeries = "
        SELECT t.id, t.nome, t.tipo, t.capa, t.is_novo, v.id_titulo AS rolo,
               v.progress_percent, v.current_time_sec, v.last_played
        FROM videos v
        INNER JOIN episodios e ON e.id = v.id_titulo
        INNER JOIN titulos t ON t.id = e.titulo_id
        WHERE v.user_id = ? AND v.progress_percent > 0 AND v.progress_percent < 95
    ";

    $params = [$userId, $userId];

    $sql = "SELECT * FROM (($sqlFilmes) UNION ($sqlSeries)) AS continuar ORDER BY last_played DESC LIMIT " . (int)$limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $data]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
