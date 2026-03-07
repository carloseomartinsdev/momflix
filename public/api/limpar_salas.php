<?php
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

try {
    // Desativar salas sem participantes ativos há mais de 1 hora
    $stmt = $pdo->prepare("
        UPDATE salas s 
        SET ativo = 0 
        WHERE s.ativo = 1 
        AND NOT EXISTS (
            SELECT 1 FROM sala_participantes sp 
            WHERE sp.sala_id = s.id 
            AND sp.ativo = 1 
            AND sp.entrou_em > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        )
    ");
    $stmt->execute();
    $salasDesativadas = $stmt->rowCount();
    
    // Desativar participantes inativos há mais de 1 hora
    $stmt = $pdo->prepare("
        UPDATE sala_participantes 
        SET ativo = 0 
        WHERE ativo = 1 
        AND entrou_em < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute();
    $participantesDesativados = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'salas_desativadas' => $salasDesativadas,
        'participantes_desativados' => $participantesDesativados
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
