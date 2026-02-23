<?php
// Script para resetar senha do usuário
require_once 'config/database.php';

$username = 'carlos';
$newPassword = 'password'; // Altere para a senha desejada

$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET password = :password WHERE username = :username");
    $stmt->execute([
        'password' => $hashedPassword,
        'username' => $username
    ]);
    
    echo "Senha do usuário '$username' atualizada com sucesso!\n";
    echo "Nova senha: $newPassword\n";
    echo "Hash: $hashedPassword\n";
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
