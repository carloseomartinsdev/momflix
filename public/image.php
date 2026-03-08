<?php
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $path = __DIR__ . '/capas/' . $id . '.jpg';
    
    if (file_exists($path)) {
        header('Content-Type: image/jpeg');
        readfile($path);
    } else {
        http_response_code(404);
    }
} else {
    http_response_code(404);
}
?>
