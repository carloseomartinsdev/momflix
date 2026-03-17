<?php
if (!isset($_GET['path']) || !file_exists($_GET['path'])) {
    http_response_code(404);
    exit;
}

$path = $_GET['path'];
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

$mimeTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'bmp' => 'image/bmp',
    'webp' => 'image/webp'
];

if (!isset($mimeTypes[$ext])) {
    http_response_code(404);
    exit;
}

$lastModified = filemtime($path);
$etag = '"' . md5($path . $lastModified) . '"';

if (
    (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $lastModified)
) {
    http_response_code(304);
    exit;
}

header('Content-Type: ' . $mimeTypes[$ext]);
header('Cache-Control: public, max-age=2592000, immutable'); // 30 dias
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
header('ETag: ' . $etag);
header('Content-Length: ' . filesize($path));
readfile($path);
