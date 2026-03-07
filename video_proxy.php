<?php
// ARQUIVO PARA O SERVIDOR ONLINE
// Este arquivo faz proxy do vídeo do servidor local

$LOCAL_SERVER = 'http://SEU_IP:PORTA'; // Ex: http://123.456.789.0:8080

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit('ID não fornecido');
}

$id = $_GET['id'];
$ep = $_GET['ep'] ?? null;

// Montar URL do servidor local
$url = $LOCAL_SERVER . '/video_stream.php?id=' . urlencode($id);
if ($ep) {
    $url .= '&ep=' . urlencode($ep);
}

// Iniciar requisição ao servidor local
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 0);

// Repassar range header se existir
if (isset($_SERVER['HTTP_RANGE'])) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Range: ' . $_SERVER['HTTP_RANGE']]);
}

// Callback para repassar headers
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    
    if (count($header) >= 2) {
        $name = strtolower(trim($header[0]));
        $value = trim($header[1]);
        
        // Repassar headers importantes
        if (in_array($name, ['content-type', 'content-length', 'content-range', 'accept-ranges'])) {
            header($header[0] . ': ' . $value);
        }
    } elseif (strpos($header, 'HTTP/') === 0) {
        header($header);
    }
    
    return $len;
});

// Executar e repassar conteúdo
curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo 'Erro ao conectar ao servidor local';
}

curl_close($ch);
?>
