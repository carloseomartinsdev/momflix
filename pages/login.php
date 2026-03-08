<?php
session_start();
header('Content-Type: application/json');

require_once 'config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(['success' => false, 'error' => 'Usuário e senha são obrigatórios']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, password, is_admin FROM usuarios WHERE username = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'isAdmin' => (bool)$user['is_admin']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Usuário ou senha inválidos']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
}
