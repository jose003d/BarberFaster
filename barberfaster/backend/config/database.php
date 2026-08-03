<?php
// ==========================
// BLOQUE 1: Configuración de conexión a la base de datos
// ==========================
$host = "127.0.0.1";   // Usar IP directa evita problemas con sockets
$db   = "barberfaster";
$user = "root";
$pass = "";

try {
    // ==========================
    // BLOQUE 2: Creación de conexión PDO
    // ==========================
    $pdo = new PDO(
        "mysql:host=$host;port=3306;dbname=$db;charset=utf8", 
        $user, 
        $pass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    // ==========================
    // BLOQUE 3: Manejo de errores de conexión
    // ==========================
    echo json_encode([
        "success" => false,
        "error"   => "Error de conexión: " . $e->getMessage()
    ]);
    exit;
}
