<?php
session_start();
require_once 'config/database.php';

$path = null;

// Se tiver parâmetro 'id', buscar no banco
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $episodio_id = $_GET['ep'] ?? null;
    
    try {
        if ($episodio_id) {
            // Buscar episódio específico
            $stmt = $pdo->prepare("SELECT path FROM episodios WHERE id = ?");
            $stmt->execute([$episodio_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $path = $result['path'];
            }
        } else {
            // Buscar título (filme)
            $stmt = $pdo->prepare("SELECT path, pasta_titulo FROM titulos WHERE id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $path = $result['path'] ?: $result['pasta_titulo'];
            }
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo 'Erro no banco de dados';
        exit;
    }
} elseif (isset($_GET['path'])) {
    // Usar path diretamente (compatibilidade) - ajustar Midias para Mideas
    $path = str_replace('Midias', 'Mideas', $_GET['path']);
}

if ($path && file_exists($path)) {
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
    echo 'Arquivo não encontrado - ID: ' . ($_GET['id'] ?? 'N/A') . ' - Path: ' . ($path ?? 'N/A');
}
?>
