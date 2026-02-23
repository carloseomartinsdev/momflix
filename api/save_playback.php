<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

require_once '../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$idTitulo = $input['idTitulo'] ?? '';
$currentTime = $input['currentTime'] ?? 0;
$duration = $input['duration'] ?? 0;
$videoPath = $input['videoPath'] ?? '';

if (!$idTitulo) {
    echo json_encode(['success' => false, 'error' => 'ID não fornecido']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    $progress = $duration > 0 ? ($currentTime / $duration) * 100 : 0;
    
    $stmt = $pdo->prepare("
        INSERT INTO videos (id_titulo, user_id, current_time_sec, duration_sec, progress_percent, last_played, play_count)
        VALUES (:id_titulo, :user_id, :current_time, :duration, :progress, NOW(), 1)
        ON DUPLICATE KEY UPDATE
            current_time_sec = :current_time,
            duration_sec = :duration,
            progress_percent = :progress,
            last_played = NOW(),
            play_count = IF(VALUES(current_time_sec) < 5 AND current_time_sec < 5, play_count + 1, play_count)
    ");
    
    $stmt->execute([
        'id_titulo' => $idTitulo,
        'user_id' => $userId,
        'current_time' => $currentTime,
        'duration' => $duration,
        'progress' => $progress
    ]);
    
    // Atualizar campo rolo com o path do vídeo atual
    if ($videoPath) {
        $stmtRolo = $pdo->prepare("UPDATE titulos SET rolo = :rolo WHERE id = :id_titulo");
        $stmtRolo->execute(['rolo' => $videoPath, 'id_titulo' => $idTitulo]);
    }
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
