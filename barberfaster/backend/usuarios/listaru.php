<?php


header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}
// ... resto de tu código original aquí ...

// ... AQUÍ VA TU CÓDIGO EXISTENTE DE CONEXIÓN A BASE DE DATOS Y CONSULTAS ...
require_once "../config/database.php";

$stmt = $pdo->query("SELECT id_usuario, nombre, email, telefono, rol, estado FROM Usuarios ORDER BY id_usuario DESC");
$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($usuarios);
?>
