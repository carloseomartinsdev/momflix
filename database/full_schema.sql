-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 23/02/2026 às 15:33
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `mom_flix`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `bloqueios`
--

CREATE TABLE `bloqueios` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tipo_bloqueio` enum('titulo','tipo') NOT NULL,
  `valor` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `episodios`
--

CREATE TABLE `episodios` (
  `id` varchar(8) NOT NULL,
  `titulo_id` varchar(8) NOT NULL,
  `temporada` varchar(100) NOT NULL,
  `tag` varchar(100) NOT NULL,
  `path` text NOT NULL,
  `titulo_episodio` varchar(255) DEFAULT NULL,
  `duracao` varchar(100) DEFAULT NULL,
  `sinopse` text DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `intro_start` int(11) DEFAULT 0,
  `intro_end` int(11) DEFAULT 0,
  `content_end` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estatisticas`
--

CREATE TABLE `estatisticas` (
  `id` int(11) NOT NULL DEFAULT 1,
  `total_titulos` int(11) DEFAULT 0,
  `filmes` int(11) DEFAULT 0,
  `series` int(11) DEFAULT 0,
  `bls` int(11) DEFAULT 0,
  `animes` int(11) DEFAULT 0,
  `donghuas` int(11) DEFAULT 0,
  `sagas` int(11) DEFAULT 0,
  `total_episodios` int(11) DEFAULT 0,
  `novidades` int(11) DEFAULT 0,
  `contador_atualizacoes` int(11) DEFAULT 0,
  `ultima_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `filmes_saga`
--

CREATE TABLE `filmes_saga` (
  `id` varchar(8) NOT NULL,
  `saga_id` varchar(8) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `path` text DEFAULT NULL,
  `capa` text DEFAULT NULL,
  `duracao` varchar(100) DEFAULT NULL,
  `sinopse` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `generos`
--

CREATE TABLE `generos` (
  `id` int(11) NOT NULL,
  `genero` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `temporadas`
--

CREATE TABLE `temporadas` (
  `id` int(11) NOT NULL,
  `titulo_id` varchar(8) NOT NULL,
  `nome_temporada` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `titulos`
--

CREATE TABLE `titulos` (
  `id` varchar(8) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `nome_normalizado` varchar(255) NOT NULL,
  `tipo` enum('filme','serie','bl','anime','donghua') NOT NULL,
  `hd` varchar(50) NOT NULL,
  `capa` text DEFAULT NULL,
  `pasta_titulo` text NOT NULL,
  `path` text DEFAULT NULL,
  `is_saga` tinyint(1) DEFAULT 0,
  `rolo` varchar(255) DEFAULT NULL,
  `duracao` varchar(100) DEFAULT NULL,
  `classificacao` varchar(50) DEFAULT NULL,
  `sinopse` text DEFAULT NULL,
  `ano` varchar(10) DEFAULT NULL,
  `diretor` text DEFAULT NULL,
  `elenco` text DEFAULT NULL,
  `adicionado_em` decimal(16,6) NOT NULL,
  `is_novo` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `titulos_bloqueados`
--

CREATE TABLE `titulos_bloqueados` (
  `user_id` int(11) NOT NULL,
  `pasta_titulo` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `titulo_genero`
--

CREATE TABLE `titulo_genero` (
  `titulo_id` varchar(8) NOT NULL,
  `genero_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `profile_icon` varchar(10) DEFAULT '?',
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `videos`
--

CREATE TABLE `videos` (
  `id_titulo` varchar(8) NOT NULL,
  `user_id` int(11) NOT NULL,
  `current_time_sec` decimal(10,2) DEFAULT 0.00,
  `duration_sec` decimal(10,2) DEFAULT 0.00,
  `progress_percent` decimal(5,2) DEFAULT 0.00,
  `play_count` int(11) DEFAULT 0,
  `last_played` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `bloqueios`
--
ALTER TABLE `bloqueios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bloqueio` (`user_id`,`tipo_bloqueio`,`valor`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Índices de tabela `episodios`
--
ALTER TABLE `episodios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_titulo_id` (`titulo_id`);

--
-- Índices de tabela `estatisticas`
--
ALTER TABLE `estatisticas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `filmes_saga`
--
ALTER TABLE `filmes_saga`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_saga_id` (`saga_id`);

--
-- Índices de tabela `generos`
--
ALTER TABLE `generos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `genero` (`genero`),
  ADD KEY `idx_genero` (`genero`);

--
-- Índices de tabela `temporadas`
--
ALTER TABLE `temporadas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_titulo_id` (`titulo_id`);

--
-- Índices de tabela `titulos`
--
ALTER TABLE `titulos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_nome` (`nome`),
  ADD KEY `idx_is_novo` (`is_novo`),
  ADD KEY `idx_rolo` (`rolo`);
ALTER TABLE `titulos` ADD FULLTEXT KEY `idx_busca` (`nome`,`sinopse`,`elenco`);

--
-- Índices de tabela `titulos_bloqueados`
--
ALTER TABLE `titulos_bloqueados`
  ADD KEY `idx_user_id` (`user_id`);

--
-- Índices de tabela `titulo_genero`
--
ALTER TABLE `titulo_genero`
  ADD PRIMARY KEY (`titulo_id`,`genero_id`),
  ADD KEY `genero_id` (`genero_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`);

--
-- Índices de tabela `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id_titulo`,`user_id`),
  ADD KEY `idx_user_progress` (`user_id`,`progress_percent`),
  ADD KEY `idx_last_played` (`last_played`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `bloqueios`
--
ALTER TABLE `bloqueios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `generos`
--
ALTER TABLE `generos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `temporadas`
--
ALTER TABLE `temporadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `bloqueios`
--
ALTER TABLE `bloqueios`
  ADD CONSTRAINT `bloqueios_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `episodios`
--
ALTER TABLE `episodios`
  ADD CONSTRAINT `episodios_ibfk_1` FOREIGN KEY (`titulo_id`) REFERENCES `titulos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `filmes_saga`
--
ALTER TABLE `filmes_saga`
  ADD CONSTRAINT `filmes_saga_ibfk_1` FOREIGN KEY (`saga_id`) REFERENCES `titulos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `temporadas`
--
ALTER TABLE `temporadas`
  ADD CONSTRAINT `temporadas_ibfk_1` FOREIGN KEY (`titulo_id`) REFERENCES `titulos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `titulos_bloqueados`
--
ALTER TABLE `titulos_bloqueados`
  ADD CONSTRAINT `titulos_bloqueados_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `titulo_genero`
--
ALTER TABLE `titulo_genero`
  ADD CONSTRAINT `titulo_genero_ibfk_1` FOREIGN KEY (`titulo_id`) REFERENCES `titulos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `titulo_genero_ibfk_2` FOREIGN KEY (`genero_id`) REFERENCES `generos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`id_titulo`) REFERENCES `titulos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `videos_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
