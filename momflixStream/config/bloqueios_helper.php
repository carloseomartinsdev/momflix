<?php
// Helper para filtrar conteúdos bloqueados
function getBloqueiosUsuario($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT tipo_bloqueio, valor FROM bloqueios WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $bloqueios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $tiposBloqueados = [];
    $titulosBloqueados = [];
    
    foreach ($bloqueios as $bloqueio) {
        if ($bloqueio['tipo_bloqueio'] === 'tipo') {
            $tiposBloqueados[] = $bloqueio['valor'];
        } else {
            $titulosBloqueados[] = $bloqueio['valor'];
        }
    }
    
    return ['tipos' => $tiposBloqueados, 'titulos' => $titulosBloqueados];
}

function aplicarFiltrosBloqueios(&$sql, &$params, $bloqueios) {
    if (!empty($bloqueios['tipos'])) {
        $placeholders = implode(',', array_fill(0, count($bloqueios['tipos']), '?'));
        $sql .= " AND t.tipo NOT IN ($placeholders)";
        foreach ($bloqueios['tipos'] as $tipo) {
            $params[] = $tipo;
        }
    }
    
    if (!empty($bloqueios['titulos'])) {
        $placeholders = implode(',', array_fill(0, count($bloqueios['titulos']), '?'));
        $sql .= " AND t.id NOT IN ($placeholders)";
        foreach ($bloqueios['titulos'] as $titulo) {
            $params[] = $titulo;
        }
    }
}
