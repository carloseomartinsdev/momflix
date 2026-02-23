-- Resetar todas as novidades
UPDATE titulos SET is_novo = 0;

-- OU marcar apenas os últimos 20 títulos adicionados como novos
-- UPDATE titulos SET is_novo = 0;
-- UPDATE titulos SET is_novo = 1 ORDER BY adicionado_em DESC LIMIT 20;
