<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config/database.php";

 $stmt = $pdo->query("SELECT * FROM Clientes ORDER BY id_usuario DESC");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));