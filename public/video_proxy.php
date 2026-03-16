<?php
// COPIE ESTE ARQUIVO PARA O SERVIDOR ONLINE
$LOCAL_SERVER = 'http://167.249.16.174'; // Ex: http://123.456.789.0:8080/public

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit('ID não fornecido');
}

$url = $LOCAL_SERVER . '/stream?id=' . urlencode($_GET['id']);
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
    $trimmed = trim($header);
    
    // Repassar status HTTP
    if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $trimmed, $matches)) {
        http_response_code((int)$matches[1]);
    }
    // Repassar headers importantes
    elseif (strpos($header, ':') !== false) {
        list($name, $value) = explode(':', $header, 2);
        $name = strtolower(trim($name));
        if (in_array($name, ['content-type', 'content-length', 'content-range', 'accept-ranges'])) {
            header(trim($header));
        }
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
