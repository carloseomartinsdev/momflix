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

$stmt = $pdo->prepare("SELECT * FROM titulos WHERE id = ?");
$stmt->execute([$id]);
$titulo = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$titulo) {
    die('Título não encontrado');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $pdo->prepare("UPDATE titulos SET nome = ?, sinopse = ?, ano = ?, duracao = ?, classificacao = ?, diretor = ?, elenco = ? WHERE id = ?");
    $stmt->execute([
        $_POST['nome'],
        $_POST['sinopse'],
        $_POST['ano'],
        $_POST['duracao'],
        $_POST['classificacao'],
        $_POST['diretor'],
        $_POST['elenco'],
        $id
    ]);
    
    echo "<script>alert('Salvo com sucesso!'); window.close();</script>";
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Editar - <?php echo htmlspecialchars($titulo['nome']); ?></title>
    <link rel="stylesheet" href="assets/css/main.css">
    <style>
        body { padding: 20px; background: var(--bg-primary); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 4px; color: var(--text-primary); box-sizing: border-box; }
        .form-group textarea { min-height: 100px; resize: vertical; }
        .btn-save { background: var(--red-primary); color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .btn-save:hover { background: var(--red-hover); }
    </style>
</head>
<body>
    <h1>Editar: <?php echo htmlspecialchars($titulo['nome']); ?></h1>
    <form method="POST">
        <div class="form-group">
            <label>Nome:</label>
            <input type="text" name="nome" value="<?php echo htmlspecialchars($titulo['nome']); ?>" required>
        </div>
        <div class="form-group">
            <label>Sinopse:</label>
            <textarea name="sinopse"><?php echo htmlspecialchars($titulo['sinopse']); ?></textarea>
        </div>
        <div class="form-group">
            <label>Ano:</label>
            <input type="text" name="ano" value="<?php echo htmlspecialchars($titulo['ano']); ?>">
        </div>
        <div class="form-group">
            <label>Duração:</label>
            <input type="text" name="duracao" value="<?php echo htmlspecialchars($titulo['duracao']); ?>">
        </div>
        <div class="form-group">
            <label>Classificação:</label>
            <input type="text" name="classificacao" value="<?php echo htmlspecialchars($titulo['classificacao']); ?>">
        </div>
        <div class="form-group">
            <label>Diretor:</label>
            <input type="text" name="diretor" value="<?php echo htmlspecialchars($titulo['diretor']); ?>">
        </div>
        <div class="form-group">
            <label>Elenco:</label>
            <input type="text" name="elenco" value="<?php echo htmlspecialchars($titulo['elenco']); ?>">
        </div>
        <button type="submit" class="btn-save">💾 Salvar</button>
    </form>
</body>
</html>
