<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT DISTINCT s.id, s.nome, s.codigo, t.nome as titulo, t.capa,
               COUNT(sp.id) as participantes_count,
               (s.lider_id = ?) as is_lider,
               u.username as lider_nome
        FROM salas s
        JOIN titulos t ON s.titulo_id = t.id
        JOIN usuarios u ON s.lider_id = u.id
        LEFT JOIN sala_participantes sp ON s.id = sp.sala_id AND sp.ativo = 1
        WHERE s.ativo = 1 AND s.is_publica = 1
        GROUP BY s.id, s.nome, s.codigo, t.nome, t.capa, s.lider_id, u.username
        ORDER BY s.criado_em DESC
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $salas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'salas' => $salas
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>