<?php
if (!isset($_GET['id'])) {
    http_response_code(404);
    exit;
}

$id = basename($_GET['id']);
$cachePath = __DIR__ . '/capas/' . $id . '.jpg';

// Se não existe no cache local, busca do path original no banco
if (!file_exists($cachePath)) {
    require_once __DIR__ . '/../config/database.php';

    // Tenta titulos primeiro, depois filmes_saga
    $stmt = $pdo->prepare("SELECT capa FROM titulos WHERE id = :id UNION SELECT capa FROM filmes_saga WHERE id = :id2 LIMIT 1");
    $stmt->execute(['id' => $id, 'id2' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $origem = $row['capa'] ?? null;
    if ($origem && file_exists($origem)) {
        copy($origem, $cachePath);
    }
}

if (!file_exists($cachePath)) {
    http_response_code(404);
    exit;
}

$lastModified = filemtime($cachePath);
$etag = '"' . $id . '-' . $lastModified . '"';

if (
    (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $lastModified)
) {
    http_response_code(304);
    exit;
}

header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=2592000, immutable');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
header('ETag: ' . $etag);
header('Content-Length: ' . filesize($cachePath));
readfile($cachePath);
