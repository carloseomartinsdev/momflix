-- Adicionar campos faltantes na tabela salas se não existirem
ALTER TABLE salas 
ADD COLUMN IF NOT EXISTS timestamp_acao BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS titulo_path TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_publica BOOLEAN DEFAULT FALSE;

-- Garantir que a tabela de mensagens existe
CREATE TABLE IF NOT EXISTS sala_mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Verificar estrutura das tabelas
DESCRIBE salas;
DESCRIBE sala_mensagens;