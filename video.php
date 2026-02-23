<?php
if (isset($_GET['path']) && file_exists($_GET['path'])) {
    $path = $_GET['path'];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    
    $mimeTypes = [
        'mp4' => 'video/mp4',
        'mkv' => 'video/x-matroska',
        'avi' => 'video/x-msvideo',
        'mov' => 'video/quicktime',
        'wmv' => 'video/x-ms-wmv',
        'flv' => 'video/x-flv'
    ];
    
    if (isset($mimeTypes[$ext])) {
        $size = filesize($path);
        $start = 0;
        $end = $size - 1;
        
        header('Accept-Ranges: bytes');
        
        if (isset($_SERVER['HTTP_RANGE'])) {
            $range = $_SERVER['HTTP_RANGE'];
            if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
                $start = intval($matches[1]);
                if (!empty($matches[2])) {
                    $end = intval($matches[2]);
                }
            }
            
            header('HTTP/1.1 206 Partial Content');
            header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
            header('Content-Length: ' . ($end - $start + 1));
        } else {
            header('Content-Length: ' . $size);
        }
        
        header('Content-Type: ' . $mimeTypes[$ext]);
        
        $file = fopen($path, 'rb');
        fseek($file, $start);
        
        $buffer = 8192;
        $pos = $start;
        while (!feof($file) && $pos <= $end) {
            if ($pos + $buffer > $end) {
                $buffer = $end - $pos + 1;
            }
            echo fread($file, $buffer);
            $pos += $buffer;
        }
        fclose($file);
    }
} else {
    http_response_code(404);
    echo 'Arquivo não encontrado';
}
?>
