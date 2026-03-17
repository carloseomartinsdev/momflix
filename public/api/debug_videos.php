<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Ver todos os registros de videos
$stmt = $pdo->query("
    SELECT v.id_titulo, v.user_id, v.progress_percent, v.last_played,
           t.nome AS titulo_nome,
           e.tag AS episodio_tag, e.titulo_id AS serie_id
    FROM videos v
    LEFT JOIN titulos t ON t.id = v.id_titulo
    LEFT JOIN episodios e ON e.id = v.id_titulo
    ORDER BY v.last_played DESC
    LIMIT 20
");

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'total' => count($rows),
    'data' => $rows
], JSON_PRETTY_PRINT);
