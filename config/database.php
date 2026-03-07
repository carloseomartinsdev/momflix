<?php
// Configuração do Banco de Dados
define('DB_HOST', 'mysql832.umbler.com:41890');
define('DB_NAME', 'momflix');
define('DB_USER', 'momflix');
define('DB_PASS', '89XyllYVt_Ki#');
define('DB_CHARSET', 'utf8mb4');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET,
        DB_USER,
        DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro de conexão com banco de dados']);
    exit;
}
