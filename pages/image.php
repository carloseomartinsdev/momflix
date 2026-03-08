<?php
if (isset($_GET['path']) && file_exists($_GET['path'])) {
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
    
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
        readfile($path);
    }
} else {
    http_response_code(404);
}
?>
