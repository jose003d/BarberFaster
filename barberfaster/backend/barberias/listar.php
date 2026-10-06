<?php
// Este archivo devuelve la lista de barberías en formato JSON.
// Se usa principalmente para cargar las barberías activas en el frontend.

// Configuración de CORS para permitir peticiones desde otro dominio.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Si el navegador hace una solicitud OPTIONS (preflight), se responde OK y termina.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a la base de datos.
require_once '../config/database.php';

// Lee el parámetro ?activas=true o ?activas=false desde la URL.
// Por defecto, si no llega nada, se asume true.
$solo_activas = $_GET['activas'] ?? 'true';

try {
    // Base de la consulta para traer todas las barberías.
    $sql = "SELECT id_barberia, nombre, direccion, ciudad, telefono, estado, foto FROM barberias";

    // Si el frontend pidió solo las activas, agregamos filtro.
    if ($solo_activas === 'true') {
        $sql .= " WHERE estado = 'ACTIVA'";
    }

    // Ordena alfabéticamente por nombre.
    $sql .= " ORDER BY nombre ASC";

    // Ejecuta la consulta.
    $stmt = $pdo->query($sql);
    $barberias = $stmt->fetchAll();

    // Devuelve el resultado en JSON.
    echo json_encode([
        "status" => "success",
        "datos" => $barberias,
        "barberias" => $barberias
    ]);
} catch (Exception $e) {
    // Si hay un error en la consulta, lo devuelve como JSON.
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al listar barberías: " . $e->getMessage()
    ]);
}
