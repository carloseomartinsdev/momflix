<?php
session_start();
header('Content-Type: application/json');

$sala_id = $_GET['sala_id'] ?? 0;
$last_player = $_GET['last_player'] ?? 0;
$last_chat = $_GET['last_chat'] ?? 0;

if (!$sala_id) {
    echo json_encode(['success' => false, 'error' => 'Sala ID obrigatório']);
    exit;
}

require_once '../../config/database.php';

// Long polling: espera até 25 segundos por novidades
$timeout = 25;
$start = time();

while ((time() - $start) < $timeout) {
    $response = ['success' => true, 'data' => []];
    $hasUpdate = false;

    // Estado do player
    $stmt = $pdo->prepare("SELECT tempo_atual, pausado, timestamp_acao FROM salas WHERE id = ?");
    $stmt->execute([$sala_id]);
    $estado = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($estado && $estado['timestamp_acao'] > $last_player) {
        $response['data']['player'] = [
            'tempo_atual' => floatval($estado['tempo_atual']),
            'pausado' => (bool)$estado['pausado'],
            'timestamp' => intval($estado['timestamp_acao'])
        ];
        $hasUpdate = true;
    }

    // Mensagens do chat
    $stmt = $pdo->prepare("
        SELECT m.id, m.mensagem, m.created_at, u.username, u.profile_icon
        FROM sala_mensagens m
        JOIN usuarios u ON m.usuario_id = u.id
        WHERE m.sala_id = ? AND m.id > ?
        ORDER BY m.id ASC
        LIMIT 20
    ");
    $stmt->execute([$sala_id, $last_chat]);
    $mensagens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($mensagens) {
        $response['data']['chat'] = $mensagens;
        $hasUpdate = true;
    }

    // Participantes (sempre envia)
    $stmt = $pdo->prepare("
        SELECT u.username, u.profile_icon, sp.is_lider
        FROM sala_participantes sp
        JOIN usuarios u ON sp.usuario_id = u.id
        WHERE sp.sala_id = ? AND sp.ativo = 1
    ");
    $stmt->execute([$sala_id]);
    $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response['data']['participantes'] = $participantes;

    // Se tem atualização, retorna imediatamente
    if ($hasUpdate) {
        echo json_encode($response);
        exit;
    }

    // Aguarda 2 segundos antes de verificar novamente
    sleep(2);
}

// Timeout: retorna vazio
echo json_encode(['success' => true, 'data' => ['participantes' => $participantes ?? []]]);

