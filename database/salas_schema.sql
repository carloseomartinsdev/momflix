-- Tabela de salas
CREATE TABLE IF NOT EXISTS salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    lider_id INT NOT NULL,
    titulo_id VARCHAR(8) NOT NULL,
    episodio_id VARCHAR(8) DEFAULT NULL,
    tempo_atual DECIMAL(10,2) DEFAULT 0,
    pausado BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (lider_id) REFERENCES usuarios(id),
    FOREIGN KEY (titulo_id) REFERENCES titulos(id),
    FOREIGN KEY (episodio_id) REFERENCES episodios(id)
);

-- Tabela de participantes da sala
CREATE TABLE IF NOT EXISTS sala_participantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    entrou_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE KEY unique_participante (sala_id, usuario_id)
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS sala_mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para performance
CREATE INDEX idx_salas_codigo ON salas(codigo);
CREATE INDEX idx_sala_participantes_sala ON sala_participantes(sala_id);
CREATE INDEX idx_sala_mensagens_sala ON sala_mensagens(sala_id);