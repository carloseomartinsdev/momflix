<?php
// Proxy WebSocket via Server-Sent Events (SSE)
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');

session_start();

if (!isset($_SESSION['user_id'])) {
    echo "data: " . json_encode(['type' => 'error', 'message' => 'Não autenticado']) . "\n\n";
    exit;
}

$sala_id = $_GET['sala_id'] ?? 0;
$user_id = $_SESSION['user_id'];

if (!$sala_id) {
    echo "data: " . json_encode(['type' => 'error', 'message' => 'Sala ID obrigatório']) . "\n\n";
    exit;
}

require_once '../config/database.php';

// Verificar se usuário está na sala
$stmt = $pdo->prepare("SELECT 1 FROM sala_participantes WHERE sala_id = ? AND usuario_id = ? AND ativo = 1");
$stmt->execute([$sala_id, $user_id]);

if (!$stmt->fetch()) {
    echo "data: " . json_encode(['type' => 'error', 'message' => 'Usuário não está na sala']) . "\n\n";
    exit;
}

// Loop para enviar atualizações
$lastUpdate = 0;

while (true) {
    // Verificar se conexão ainda está ativa
    if (connection_aborted()) break;
    
    // Buscar último timestamp de atualização
    $stmt = $pdo->prepare("SELECT tempo_atual, pausado, timestamp_acao FROM salas WHERE id = ?");
    $stmt->execute([$sala_id]);
    $estado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($estado && $estado['timestamp_acao'] > $lastUpdate) {
        $lastUpdate = $estado['timestamp_acao'];
        
        echo "data: " . json_encode([
            'type' => 'player_state',
            'data' => [
                'tempo_atual' => floatval($estado['tempo_atual']),
                'pausado' => (bool)$estado['pausado'],
                'timestamp' => intval($estado['timestamp_acao'])
            ]
        ]) . "\n\n";
        
        ob_flush();
        flush();
    }
    
    sleep(1); // Verificar a cada segundo
}
?>
