-- Adicionar coluna profile_icon na tabela usuarios se não existir
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS profile_icon VARCHAR(10) DEFAULT '👤';

-- Verificar estrutura da tabela
DESCRIBE usuarios;