<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../config/database.php';
require_once '../config/bloqueios_helper.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$termo = $_GET['termo'] ?? '';
$tipo = $_GET['tipo'] ?? 'todos';
$genero = $_GET['genero'] ?? 'todos';

try {
    $userId = $_SESSION['user_id'];
    $bloqueios = getBloqueiosUsuario($pdo, $userId);
    
    $sql = "
        SELECT DISTINCT t.id, t.nome, t.tipo, t.capa, t.is_novo, t.rolo
        FROM titulos t
        LEFT JOIN titulo_genero tg ON t.id = tg.titulo_id
        LEFT JOIN generos g ON tg.genero_id = g.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($termo) {
        $sql .= " AND LOWER(t.nome) LIKE LOWER(?)";
        $params[] = "%$termo%";
    }
    
    if ($tipo !== 'todos') {
        $sql .= " AND t.tipo = ?";
        $params[] = $tipo;
    }
    
    if ($genero !== 'todos') {
        $sql .= " AND g.genero = ?";
        $params[] = $genero;
    }
    
    aplicarFiltrosBloqueios($sql, $params, $bloqueios);
    
    $sql .= " GROUP BY t.id ORDER BY t.nome";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $titulos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $titulos]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
