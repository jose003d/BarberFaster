<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y conexión
// ==========================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 2: Consulta de barberos activos
    // ==========================
    $sql = "
        SELECT 
            b.id_barbero, 
            b.id_usuario, 
            u.nombre, 
            u.apellido, 
            u.telefono, 
            bar.nombre AS barberia
        FROM barberos b
        JOIN usuarios u ON b.id_usuario = u.id_usuario
        JOIN barberias bar ON b.id_barberia = bar.id_barberia
        WHERE u.estado = 1
    ";

    $stmt = $pdo->query($sql);

    // ==========================
    // BLOQUE 3: Respuesta en formato JSON
    // ==========================
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    // ==========================
    // BLOQUE 4: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
