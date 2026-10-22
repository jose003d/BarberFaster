<?php
// Este archivo devuelve los barberos activos de una barbería específica.
// Se usa para cargar la lista de barberos en el frontend.

// Permite peticiones desde cualquier origen del frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

// Responde a peticiones OPTIONS para evitar errores de CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a la base de datos.
require_once '../config/database.php';

// Captura el id_barberia de forma flexible: GET, POST o por defecto 1.
$id_barberia = $_GET['id_barberia'] ?? $_POST['id_barberia'] ?? 1;

try {
    // Consulta solo los barberos activos de la barbería seleccionada.
    $stmt = $pdo->prepare("
        SELECT
            b.id_barbero,
            b.id_barberia,
            b.nombre,
            b.apellido,
            b.email,
            b.telefono,
            b.documento,
            b.especialidad,
            b.estado,
            CASE
                WHEN b.foto_datos IS NOT NULL THEN CONCAT(
                    '/erpbarber/barberfaster/backend/barberos/foto.php?id_barbero=',
                    b.id_barbero,
                    '&v=',
                    UNIX_TIMESTAMP()
                )
                ELSE b.foto
            END AS foto,
            COALESCE(AVG(r.calificacion), 0) AS calificacion_promedio,
            COUNT(r.id_resena) AS cantidad_calificaciones
        FROM barberos b
        LEFT JOIN citas c ON c.id_barbero = b.id_barbero
        LEFT JOIN resenas r ON r.id_cita = c.id_cita
        WHERE b.id_barberia = ? AND b.estado = 'ACTIVO'
        GROUP BY b.id_barbero
    ");
    $stmt->execute([$id_barberia]);
    $barberos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Devuelve la lista de barberos como JSON.
    echo json_encode($barberos);

} catch (Exception $e) {
    // En caso de error, devuelve un JSON con el mensaje.
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al listar barberos: " . $e->getMessage()
    ]);
}