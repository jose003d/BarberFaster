<?php
// -----------------------------------------------------------------------------
// 1. Configuración de la respuesta y acceso CORS
// -----------------------------------------------------------------------------
// Permite que el frontend realice peticiones desde otro dominio o puerto.
header("Access-Control-Allow-Origin: *");
// Este endpoint únicamente necesita recibir peticiones GET y OPTIONS.
header("Access-Control-Allow-Methods: GET, OPTIONS");
// Indica las cabeceras que el navegador puede incluir en la petición. 
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// Indica que la respuesta se enviará en formato JSON y con codificación UTF-8.
header("Content-Type: application/json; charset=UTF-8");

// Responde a la solicitud preflight del navegador sin consultar la base de datos.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Carga la conexión PDO con la base de datos.
require_once '../config/database.php';

// -----------------------------------------------------------------------------
// 2. Lectura y validación del filtro
// -----------------------------------------------------------------------------
// El ID del barbero se recibe como parámetro de la URL, por ejemplo:
// listar_eventos.php?id_barbero=3
$id_barbero = $_GET['id_barbero'] ?? null;

// Sin un barbero no se puede determinar qué eventos deben devolverse.
if (!$id_barbero) {
    echo json_encode([
        "status" => "error",
        "mensaje" => "Se requiere el ID del barbero."
    ]);
    exit();
}

try {
    // -------------------------------------------------------------------------
    // 3. Consulta de las citas del barbero
    // -------------------------------------------------------------------------
    // Se prepara la consulta con un marcador ? para insertar el ID de forma
    // segura y evitar inyecciones SQL.
    $stmt = $pdo->prepare(
        "SELECT
            /* Identificador que utilizará el calendario para el evento. */
            c.id_cita AS id,
            /* El calendario necesita la fecha y hora completas de inicio y fin. */
            CONCAT(c.fecha, ' ', c.hora_inicio) AS start,
            CONCAT(c.fecha, ' ', c.hora_fin) AS end,
            /* Convierte los estados internos en títulos comprensibles. */
            CASE
                WHEN c.estado = 'PENDIENTE' THEN 'Cita pendiente'
                WHEN c.estado = 'CONFIRMADA' THEN 'Cita confirmada'
                WHEN c.estado = 'COMPLETADA' THEN 'Cita completada'
                WHEN c.estado = 'CANCELADA' THEN 'Cita cancelada'
                ELSE 'Cita'
            END AS title,
            /* También se conserva el estado original para el frontend. */
            c.estado,
            c.dni_cliente,
            cl.nombre AS cliente,
            c.precio_total,
            /* Si no hay notas, devuelve una cadena vacía en lugar de NULL. */
            COALESCE(c.notas, '') AS observaciones
        FROM citas c
        /* LEFT JOIN permite mostrar la cita aunque el cliente no exista. */
        LEFT JOIN clientes cl ON cl.dni = c.dni_cliente
        WHERE c.id_barbero = ?
        /* Ordena cronológicamente los eventos del calendario. */
        ORDER BY c.fecha ASC, c.hora_inicio ASC"
    );

    // Sustituye el marcador ? por el ID recibido en la URL.
    $stmt->execute([$id_barbero]);
    // Obtiene todas las citas como un arreglo asociativo.
    $eventos = $stmt->fetchAll();

    // Devuelve directamente la lista de eventos en formato JSON.
    echo json_encode($eventos);
} catch (Exception $e) {
    // Si falla la consulta, informa al frontend con código HTTP 500.
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al obtener eventos del barbero: " . $e->getMessage()
    ]);
}
