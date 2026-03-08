-- Recriar tabela de histórico
CREATE TABLE IF NOT EXISTS historico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo ENUM('filme', 'serie') NOT NULL,
    assistido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_data (usuario_id, assistido_em DESC)
);