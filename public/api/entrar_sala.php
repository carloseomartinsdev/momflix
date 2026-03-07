<?php
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$codigo = strtoupper($data['codigo'] ?? '');
$sala_id = $data['sala_id'] ?? null;

if (empty($codigo) && !$sala_id) {
    echo json_encode(['success' => false, 'error' => 'Código ou ID da sala é obrigatório']);
    exit;
}

try {
    // Verificar se sala existe e está ativa
    if ($sala_id) {
        $stmt = $pdo->prepare("SELECT id, nome, lider_id, titulo_id, episodio_id FROM salas WHERE id = ? AND ativo = 1");
        $stmt->execute([$sala_id]);
    } else {
        $stmt = $pdo->prepare("SELECT id, nome, lider_id, titulo_id, episodio_id FROM salas WHERE codigo = ? AND ativo = 1");
        $stmt->execute([$codigo]);
    }
    $sala = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$sala) {
        echo json_encode(['success' => false, 'error' => 'Sala não encontrada']);
        exit;
    }
    
    // Adicionar participante (ou reativar se já existir)
    $stmt = $pdo->prepare("INSERT INTO sala_participantes (sala_id, usuario_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE ativo = 1, entrou_em = CURRENT_TIMESTAMP");
    $stmt->execute([$sala['id'], $_SESSION['user_id']]);
    
    echo json_encode([
        'success' => true,
        'sala' => $sala
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao entrar na sala']);
}
?>
