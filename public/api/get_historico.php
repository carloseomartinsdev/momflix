<?php
header('Content-Type: application/json');
session_start();
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    $isAdmin = $_SESSION['is_admin'] ?? false;
    $targetUserId = $_GET['user_id'] ?? null;
    
    if ($targetUserId && $isAdmin) {
        // Admin vendo histórico de um usuário específico
        $stmt = $pdo->prepare("
            SELECT 
                u.username,
                t.nome as titulo,
                v.progress_percent,
                v.play_count,
                v.last_played
            FROM videos v
            INNER JOIN usuarios u ON v.user_id = u.id
            INNER JOIN titulos t ON v.id_titulo = t.id
            WHERE v.user_id = :user_id
            ORDER BY v.last_played DESC
            LIMIT 100
        ");
        $stmt->execute(['user_id' => $targetUserId]);
    } else {
        // Todos veem apenas o seu próprio histórico
        $stmt = $pdo->prepare("
            SELECT 
                t.nome as titulo,
                v.progress_percent,
                v.play_count,
                v.last_played
            FROM videos v
            INNER JOIN titulos t ON v.id_titulo = t.id
            WHERE v.user_id = :user_id
            ORDER BY v.last_played DESC
            LIMIT 100
        ");
        $stmt->execute(['user_id' => $userId]);
    }
    
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $data, 'isAdmin' => $isAdmin && $targetUserId]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
