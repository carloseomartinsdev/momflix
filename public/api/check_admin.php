<?php
header('Content-Type: application/json');
session_start();

echo json_encode([
    'isLoggedIn' => isset($_SESSION['user_id']),
    'isAdmin' => isset($_SESSION['is_admin']) && $_SESSION['is_admin']
]);
