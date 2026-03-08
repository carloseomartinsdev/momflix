<?php
set_time_limit(0);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

session_start();

$sala_id = $_GET['sala_id'] ?? 0;

if (!$sala_id) {
    echo "event: error\n";
    echo "data: " . json_encode(['message' => 'Sala ID obrigatório']) . "\n\n";
    exit;
}

require_once '../../config/database.php';

// Para teste, não verificar autenticação
$user_id = $_SESSION['user_id'] ?? 1;

$lastPlayerUpdate = 0;
$lastChatUpdate = 0;

// Enviar heartbeat inicial
echo "event: connected\n";
echo "data: " . json_encode(['sala_id' => $sala_id]) . "\n\n";
ob_flush();
flush();

while (true) {
    if (connection_aborted()) break;
    
    try {
    
    // Estado do player
    $stmt = $pdo->prepare("SELECT tempo_atual, pausado, timestamp_acao FROM salas WHERE id = ?");
    $stmt->execute([$sala_id]);
    $estado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($estado && $estado['timestamp_acao'] > $lastPlayerUpdate) {
        $lastPlayerUpdate = $estado['timestamp_acao'];
        
        echo "event: player\n";
        echo "data: " . json_encode([
            'tempo_atual' => floatval($estado['tempo_atual']),
            'pausado' => (bool)$estado['pausado'],
            'timestamp' => intval($estado['timestamp_acao'])
        ]) . "\n\n";
        
        ob_flush();
        flush();
    }
    
    // Mensagens do chat
    $stmt = $pdo->prepare("
        SELECT m.id, m.mensagem, m.created_at, u.username, u.profile_icon
        FROM sala_mensagens m
        JOIN usuarios u ON m.usuario_id = u.id
        WHERE m.sala_id = ? AND m.id > ?
        ORDER BY m.id ASC
        LIMIT 10
    ");
    $stmt->execute([$sala_id, $lastChatUpdate]);
    $mensagens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($mensagens) {
        foreach ($mensagens as $msg) {
            $lastChatUpdate = max($lastChatUpdate, $msg['id']);
            
            echo "event: chat\n";
            echo "data: " . json_encode([
                'id' => $msg['id'],
                'mensagem' => $msg['mensagem'],
                'username' => $msg['username'],
                'profile_icon' => $msg['profile_icon'],
                'created_at' => $msg['created_at']
            ]) . "\n\n";
            
            ob_flush();
            flush();
        }
    }
    
    // Participantes
    $stmt = $pdo->prepare("
        SELECT u.username, u.profile_icon, sp.is_lider
        FROM sala_participantes sp
        JOIN usuarios u ON sp.usuario_id = u.id
        WHERE sp.sala_id = ? AND sp.ativo = 1
    ");
    $stmt->execute([$sala_id]);
    $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "event: participantes\n";
    echo "data: " . json_encode($participantes) . "\n\n";
    
    ob_flush();
    flush();
    
    sleep(1);
    
    } catch (Exception $e) {
        echo "event: error\n";
        echo "data: " . json_encode(['message' => $e->getMessage()]) . "\n\n";
        ob_flush();
        flush();
        sleep(1);
    }
}
