<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username'])) {
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

try {
    if (!empty($data['id'])) {
        // Atualizar
        if (!empty($data['password'])) {
            $stmt = $pdo->prepare("UPDATE usuarios SET username = :username, password = :password, is_admin = :is_admin WHERE id = :id");
            $stmt->execute([
                'username' => $data['username'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'is_admin' => $data['is_admin'] ? 1 : 0,
                'id' => $data['id']
            ]);
        } else {
            $stmt = $pdo->prepare("UPDATE usuarios SET username = :username, is_admin = :is_admin WHERE id = :id");
            $stmt->execute([
                'username' => $data['username'],
                'is_admin' => $data['is_admin'] ? 1 : 0,
                'id' => $data['id']
            ]);
        }
    } else {
        // Criar
        if (empty($data['password'])) {
            echo json_encode(['success' => false, 'error' => 'Senha é obrigatória para novos usuários']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, password, is_admin) VALUES (:username, :password, :is_admin)");
        $stmt->execute([
            'username' => $data['username'],
            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
            'is_admin' => $data['is_admin'] ? 1 : 0
        ]);
    }
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
