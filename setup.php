<?php
// Script de setup rápido do banco de dados
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    // Conectar sem selecionar banco
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Criando banco de dados...<br>";
    $pdo->exec("DROP DATABASE IF EXISTS mom_flix");
    $pdo->exec("CREATE DATABASE mom_flix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE mom_flix");
    
    echo "Criando tabelas...<br>";
    
    // Tabela usuarios
    $pdo->exec("
        CREATE TABLE usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo "Inserindo usuários padrão...<br>";
    $hashedPassword = password_hash('password', PASSWORD_DEFAULT);
    
    $pdo->exec("
        INSERT INTO usuarios (id, username, password, is_admin) VALUES
        (1, 'carlos', '$hashedPassword', TRUE),
        (2, 'visitante', '$hashedPassword', FALSE),
        (3, 'ricardo', '$hashedPassword', FALSE)
    ");
    
    echo "<br><strong>✅ Setup concluído com sucesso!</strong><br><br>";
    echo "Usuários criados:<br>";
    echo "- carlos (admin) - senha: password<br>";
    echo "- visitante - senha: password<br>";
    echo "- ricardo - senha: password<br>";
    echo "<br><a href='login.html'>Ir para Login</a>";
    
} catch (PDOException $e) {
    echo "❌ Erro: " . $e->getMessage();
}
