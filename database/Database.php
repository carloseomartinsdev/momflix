<?php
/**
 * Classe Database - Gerenciamento de conexão MySQL para Momflix
 */
class Database {
    private static $instance = null;
    private $conn;
    
    private $host = 'localhost';
    private $db_name = 'mom_flix';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    
    private function __construct() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            die("Erro de conexão: " . $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    // Prevenir clonagem
    private function __clone() {}
    
    // Prevenir unserialize
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Classe CatalogoDB - Operações de catálogo no banco de dados
 */
class CatalogoDB {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Buscar todos os títulos com filtros opcionais
     */
    public function buscarTitulos($filtros = []) {
        $sql = "SELECT t.*, GROUP_CONCAT(DISTINCT g.nome ORDER BY g.nome SEPARATOR ', ') as generos_lista
                FROM titulos t
                LEFT JOIN titulo_genero tg ON t.id = tg.titulo_id
                LEFT JOIN generos g ON tg.genero_id = g.id";
        
        $where = [];
        $params = [];
        
        if (!empty($filtros['tipo'])) {
            $where[] = "t.tipo = :tipo";
            $params[':tipo'] = $filtros['tipo'];
        }
        
        if (!empty($filtros['busca'])) {
            $where[] = "MATCH(t.nome, t.sinopse, t.genero, t.elenco) AGAINST(:busca IN NATURAL LANGUAGE MODE)";
            $params[':busca'] = $filtros['busca'];
        }
        
        if (!empty($filtros['is_novo'])) {
            $where[] = "t.is_novo = 1";
        }
        
        if (!empty($filtros['genero'])) {
            $where[] = "g.nome = :genero";
            $params[':genero'] = $filtros['genero'];
        }
        
        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        
        $sql .= " GROUP BY t.id ORDER BY t.nome";
        
        if (!empty($filtros['limit'])) {
            $sql .= " LIMIT :limit";
        }
        
        $stmt = $this->db->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if (!empty($filtros['limit'])) {
            $stmt->bindValue(':limit', (int)$filtros['limit'], PDO::PARAM_INT);
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Buscar título por ID com todos os relacionamentos
     */
    public function buscarTituloPorId($id) {
        $sql = "SELECT * FROM titulos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $titulo = $stmt->fetch();
        
        if (!$titulo) {
            return null;
        }
        
        // Buscar gêneros
        $sql = "SELECT g.nome FROM generos g
                INNER JOIN titulo_genero tg ON g.id = tg.genero_id
                WHERE tg.titulo_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $titulo['generos'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Buscar vídeos (filmes simples)
        $sql = "SELECT path FROM videos WHERE titulo_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $titulo['videos'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Buscar filmes de saga
        if ($titulo['is_saga']) {
            $sql = "SELECT * FROM filmes_saga WHERE titulo_id = :id ORDER BY ordem";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id]);
            $titulo['saga_info'] = $stmt->fetchAll();
            
            foreach ($titulo['saga_info'] as &$filme) {
                $filme['videos'] = json_decode($filme['videos'], true);
            }
        }
        
        // Buscar temporadas e episódios (séries)
        if (in_array($titulo['tipo'], ['serie', 'bl', 'anime', 'donghua'])) {
            $sql = "SELECT * FROM temporadas WHERE titulo_id = :id ORDER BY ordem";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id]);
            $temporadas = $stmt->fetchAll();
            
            foreach ($temporadas as &$temp) {
                $sql = "SELECT * FROM episodios WHERE temporada_id = :temp_id ORDER BY ordem";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([':temp_id' => $temp['id']]);
                $temp['episodios'] = $stmt->fetchAll();
            }
            
            $titulo['series_info'] = $temporadas;
        }
        
        return $titulo;
    }
    
    /**
     * Buscar novidades
     */
    public function buscarNovidades($limit = 20) {
        return $this->buscarTitulos(['is_novo' => true, 'limit' => $limit]);
    }
    
    /**
     * Buscar estatísticas
     */
    public function buscarEstatisticas() {
        $sql = "SELECT * FROM estatisticas WHERE id = 1";
        $stmt = $this->db->query($sql);
        return $stmt->fetch();
    }
    
    /**
     * Buscar todos os gêneros
     */
    public function buscarGeneros() {
        $sql = "SELECT nome FROM generos ORDER BY nome";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    /**
     * Buscar títulos por tipo
     */
    public function buscarPorTipo($tipo) {
        return $this->buscarTitulos(['tipo' => $tipo]);
    }
    
    /**
     * Buscar episódio por ID
     */
    public function buscarEpisodioPorId($id) {
        $sql = "SELECT e.*, t.nome as serie_nome, temp.nome_temporada
                FROM episodios e
                INNER JOIN titulos t ON e.titulo_id = t.id
                INNER JOIN temporadas temp ON e.temporada_id = temp.id
                WHERE e.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }
}
?>
