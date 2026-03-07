<?php
// COPIE ESTE ARQUIVO PARA O SERVIDOR ONLINE
$LOCAL_SERVER = 'http://SEU_IP:PORTA/public/stream'; // Ex: http://123.456.789.0:8080/public/stream

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit('ID não fornecido');
}

$url = $LOCAL_SERVER . '/stream.php?id=' . urlencode($_GET['id']);
if (isset($_GET['ep'])) $url .= '&ep=' . urlencode($_GET['ep']);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 0);

if (isset($_SERVER['HTTP_RANGE'])) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Range: ' . $_SERVER['HTTP_RANGE']]);
}

curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    
    if (count($header) >= 2) {
        $name = strtolower(trim($header[0]));
        if (in_array($name, ['content-type', 'content-length', 'content-range', 'accept-ranges'])) {
            header($header[0] . ': ' . trim($header[1]));
        }
    } elseif (strpos($header, 'HTTP/') === 0) {
        header($header);
    }
    
    return $len;
});

curl_exec($ch);
if (curl_errno($ch)) {
    http_response_code(500);
    echo 'Erro ao conectar ao servidor local';
}
curl_close($ch);
?>
