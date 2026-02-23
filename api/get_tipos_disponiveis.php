<?php
session_start();
require_once '../config/database.php';
require_once '../config/bloqueios_helper.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$bloqueios = getBloqueiosUsuario($pdo, $_SESSION['user_id']);

$todosTipos = ['filme', 'serie', 'bl', 'anime', 'donghua'];
$tiposDisponiveis = [];

foreach ($todosTipos as $tipo) {
    if (!in_array($tipo, $bloqueios['tipos'])) {
        $tiposDisponiveis[] = $tipo;
    }
}

echo json_encode($tiposDisponiveis);
