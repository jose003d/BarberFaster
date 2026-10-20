<?php
// backend/config/database.php

$host    = "localhost";
$db      = "barberfaster";
$user    = "root";      // Ajusta si tienes clave en XAMPP/WAMP
$pass    = "";          // Ajusta si tienes clave en XAMPP/WAMP
$charset = "utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, $options);
} catch (\PDOException $e) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "mensaje" => "Error crítico de conexión a la base de datos: " . $e->getMessage()
    ]);
    exit();
}