<?php
if (!isset($_GET['id'])) {
    http_response_code(404);
    exit;
}

$id = basename($_GET['id']); // sanitize
$path = __DIR__ . '/capas/' . $id . '.jpg';

if (!file_exists($path)) {
    http_response_code(404);
    exit;
}

$lastModified = filemtime($path);
$etag = '"' . md5($id . $lastModified) . '"';

// Check if browser already has this version
if (
    (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $lastModified)
) {
    http_response_code(304);
    exit;
}

header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=2592000, immutable'); // 30 dias
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
header('ETag: ' . $etag);
header('Content-Length: ' . filesize($path));
readfile($path);
