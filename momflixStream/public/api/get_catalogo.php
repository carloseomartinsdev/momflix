<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$tipo = $_GET['tipo'] ?? 'todos';

try {
    $userId = $_SESSION['user_id'];
    
    // Buscar bloqueios do usuário
    $stmtBloqueios = $pdo->prepare("SELECT tipo_bloqueio, valor FROM bloqueios WHERE user_id = :user_id");
    $stmtBloqueios->execute(['user_id' => $userId]);
    $bloqueios = $stmtBloqueios->fetchAll(PDO::FETCH_ASSOC);
    
    $tiposBloqueados = [];
    $titulosBloqueados = [];
    
    foreach ($bloqueios as $bloqueio) {
        if ($bloqueio['tipo_bloqueio'] === 'tipo') {
            $tiposBloqueados[] = $bloqueio['valor'];
        } else {
            $titulosBloqueados[] = $bloqueio['valor'];
        }
    }
    
    $sql = "SELECT id, nome, tipo, capa, is_novo, is_saga, rolo FROM titulos WHERE 1=1";
    $params = [];
    
    if ($tipo !== 'todos') {
        $sql .= " AND tipo = :tipo";
        $params['tipo'] = $tipo;
    }
    
    if (!empty($tiposBloqueados)) {
        $placeholders = implode(',', array_fill(0, count($tiposBloqueados), '?'));
        $sql .= " AND tipo NOT IN ($placeholders)";
        $params = array_merge($params, $tiposBloqueados);
    }
    
    if (!empty($titulosBloqueados)) {
        $placeholders = implode(',', array_fill(0, count($titulosBloqueados), '?'));
        $sql .= " AND id NOT IN ($placeholders)";
        $params = array_merge($params, $titulosBloqueados);
    }
    
    $sql .= " ORDER BY RAND()";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($params));
    
    $titulos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $titulos]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
