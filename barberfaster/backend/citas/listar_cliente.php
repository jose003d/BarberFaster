<?php
// backend/citas/listar_cliente.php
// Este archivo devuelve todas las citas de un cliente con información asociada.
// Incluye nombre de la barbería, nombre del barbero y servicios contratados.

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Obtiene el DNI del cliente desde la URL, por ejemplo: ?dni_cliente=12345678
$dni_cliente = $_GET['dni_cliente'] ?? null;

// Valida que el DNI venga en la petición.
if (!$dni_cliente) {
    echo json_encode(["status" => "error", "mensaje" => "El DNI del cliente es obligatorio."]);
    exit();
}

try {
    // Consulta las citas del cliente con joins a barberías, barberos y servicios.
    $stmt = $pdo->prepare("
        SELECT 
            c.id_cita,
            c.id_barberia,
            b.nombre AS nombre_barberia,
            c.id_barbero,
            bar.nombre AS nombre_barbero,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.precio_total,
            c.estado,
            c.notas,
            GROUP_CONCAT(s.nombre SEPARATOR ', ') AS servicios_nombres
        FROM citas c
        INNER JOIN barberias b ON c.id_barberia = b.id_barberia
        INNER JOIN barberos bar ON c.id_barbero = bar.id_barbero
        LEFT JOIN cita_servicios cs ON c.id_cita = cs.id_cita
        LEFT JOIN servicios s ON cs.id_servicio = s.id_servicio
        WHERE c.dni_cliente = ?
        GROUP BY c.id_cita
        ORDER BY c.fecha DESC, c.hora_inicio DESC
    ");
    $stmt->execute([$dni_cliente]);
    $citas = $stmt->fetchAll();

    // Respuesta con la lista de citas.
    echo json_encode([
        "status" => "success",
        "datos" => $citas
    ]);
} catch (Exception $e) {
    // Si ocurre un error, lo retorna como JSON.
    echo json_encode(["status" => "error", "mensaje" => "Error al listar las citas del cliente: " . $e->getMessage()]);
}