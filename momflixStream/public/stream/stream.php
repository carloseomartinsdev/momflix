<?php
require_once '../../config/database.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit('ID não fornecido');
}

$id = $_GET['id'];
$episodio_id = $_GET['ep'] ?? null;
$path = null;

try {
    if ($episodio_id) {
        $stmt = $pdo->prepare("SELECT path FROM episodios WHERE id = ?");
        $stmt->execute([$episodio_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) $path = $result['path'];
    } else {
        $stmt = $pdo->prepare("SELECT path, pasta_titulo FROM titulos WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) $path = $result['path'] ?: $result['pasta_titulo'];
    }
} catch (Exception $e) {
    http_response_code(500);
    exit('Erro no banco de dados');
}

if (!$path || !file_exists($path)) {
    http_response_code(404);
    exit('Vídeo não encontrado');
}

$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mimeTypes = [
    'mp4' => 'video/mp4',
    'mkv' => 'video/x-matroska',
    'avi' => 'video/x-msvideo',
    'mov' => 'video/quicktime',
    'wmv' => 'video/x-ms-wmv',
    'flv' => 'video/x-flv'
];

if (!isset($mimeTypes[$ext])) {
    http_response_code(415);
    exit('Formato não suportado');
}

$size = filesize($path);
$start = 0;
$end = $size - 1;

header('Accept-Ranges: bytes');
header('Content-Type: ' . $mimeTypes[$ext]);

if (isset($_SERVER['HTTP_RANGE'])) {
    if (preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $matches)) {
        $start = intval($matches[1]);
        if (!empty($matches[2])) $end = intval($matches[2]);
    }
    
    header('HTTP/1.1 206 Partial Content');
    header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
    header('Content-Length: ' . ($end - $start + 1));
} else {
    header('Content-Length: ' . $size);
}

$file = fopen($path, 'rb');
fseek($file, $start);

$buffer = 8192;
$pos = $start;
while (!feof($file) && $pos <= $end && connection_status() == 0) {
    if ($pos + $buffer > $end) {
        $buffer = $end - $pos + 1;
    }
    echo fread($file, $buffer);
    flush();
    $pos += $buffer;
}
fclose($file);
?>
