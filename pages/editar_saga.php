<?php
session_start();
if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    header('Location: index.php');
    exit;
}

require_once 'config/database.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    die('ID não fornecido');
}

$stmt = $pdo->prepare("SELECT * FROM titulos WHERE id = ? AND is_saga = 1");
$stmt->execute([$id]);
$saga = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$saga) {
    die('Saga não encontrada');
}

$stmt = $pdo->prepare("SELECT * FROM filmes_saga WHERE saga_id = ? ORDER BY nome");
$stmt->execute([$id]);
$filmes = $stmt->fetchAll(PDO::FETCH_ASSOC);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $filmeId = $_POST['filme_id'];
    $stmt = $pdo->prepare("UPDATE filmes_saga SET nome = ?, sinopse = ?, duracao = ? WHERE id = ?");
    $stmt->execute([
        $_POST['nome'],
        $_POST['sinopse'],
        $_POST['duracao'],
        $filmeId
    ]);
    
    header("Location: editar_saga.php?id=$id");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Editar Saga - <?php echo htmlspecialchars($saga['nome']); ?></title>
    <link rel="stylesheet" href="assets/css/main.css">
    <style>
        body { padding: 20px; background: var(--bg-primary); }
        .filme-item { background: var(--bg-card); padding: 15px; margin: 10px 0; border-radius: 4px; border: 1px solid var(--border-light); }
        .filme-item h3 { margin: 0 0 10px 0; }
        .form-group { margin-bottom: 10px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; background: var(--bg-hover); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box; font-size: 14px; }
        .form-group textarea { min-height: 60px; resize: vertical; }
        .btn-save { background: var(--red-primary); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn-save:hover { background: var(--red-hover); }
    </style>
</head>
<body>
    <h1>Editar Saga: <?php echo htmlspecialchars($saga['nome']); ?></h1>
    
    <?php foreach ($filmes as $filme): ?>
    <div class="filme-item">
        <h3><?php echo htmlspecialchars($filme['nome']); ?></h3>
        <form method="POST">
            <input type="hidden" name="filme_id" value="<?php echo $filme['id']; ?>">
            <div class="form-group">
                <label>Nome:</label>
                <input type="text" name="nome" value="<?php echo htmlspecialchars($filme['nome']); ?>" required>
            </div>
            <div class="form-group">
                <label>Sinopse:</label>
                <textarea name="sinopse"><?php echo htmlspecialchars($filme['sinopse']); ?></textarea>
            </div>
            <div class="form-group">
                <label>Duração (min):</label>
                <input type="text" name="duracao" value="<?php echo htmlspecialchars($filme['duracao']); ?>">
            </div>
            <button type="submit" class="btn-save">💾 Salvar</button>
        </form>
    </div>
    <?php endforeach; ?>
</body>
</html>
