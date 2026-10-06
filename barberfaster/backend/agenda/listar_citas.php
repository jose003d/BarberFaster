<?php
// -----------------------------------------------------------------------------
// 1. Configuración de acceso y solicitudes CORS
// -----------------------------------------------------------------------------
// Permite que el frontend realice peticiones desde otro origen o puerto.
header("Access-Control-Allow-Origin: *");
// Indica los métodos HTTP permitidos por este endpoint.
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
// Indica las cabeceras que el frontend puede enviar.
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// El navegador puede enviar una petición OPTIONS antes de la petición real
// para comprobar si el servidor permite la comunicación (solicitud preflight).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Carga la conexión PDO con la base de datos.
require_once '../config/database.php';

// -----------------------------------------------------------------------------
// 2. Lectura de los filtros enviados por el frontend
// -----------------------------------------------------------------------------
// Los filtros se reciben mediante parámetros de la URL, por ejemplo:
// listar_citas.php?id_barbero=3&fecha=2026-09-22
$id_barbero  = $_GET['id_barbero'] ?? null;
$id_barberia = $_GET['id_barberia'] ?? null;
$fecha       = $_GET['fecha'] ?? null; // Opcional: formato YYYY-MM-DD

// Es obligatorio indicar al menos un barbero o una barbería para evitar
// devolver todas las citas de la base de datos sin ningún filtro.
if (!$id_barbero && !$id_barberia) {
    echo json_encode(["status" => "error", "mensaje" => "Se requiere ID de barbero o de barbería."]);
    exit();
}

try {
    // -------------------------------------------------------------------------
    // 3. Construcción de la consulta base
    // -------------------------------------------------------------------------
    // Se obtienen los datos de la cita, del cliente y los nombres de sus
    // servicios. Los signos ? son parámetros preparados y ayudan a evitar
    // inyecciones SQL.
    $sql = "
        SELECT 
            c.id_cita,
            c.id_barberia,
            c.id_barbero,
            c.dni_cliente,
            cl.nombre AS nombre_cliente,
            cl.telefono AS telefono_cliente,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.precio_total,
            c.estado,
            c.notas,
            GROUP_CONCAT(s.nombre SEPARATOR ', ') AS servicios_nombres
        FROM citas c
        INNER JOIN clientes cl ON c.dni_cliente = cl.dni
        LEFT JOIN cita_servicios cs ON c.id_cita = cs.id_cita
        LEFT JOIN servicios s ON cs.id_servicio = s.id_servicio
        WHERE 1=1
    ";

    // Contendrá los valores que sustituirán a los signos ? de la consulta.
    // Se mantiene el mismo orden en que se agregan las condiciones SQL.
    $params = [];

    // Agrega el filtro por barbero únicamente si fue enviado.
    if ($id_barbero) {
        $sql .= " AND c.id_barbero = ?";
        $params[] = $id_barbero;
    }

    // Agrega el filtro por barbería únicamente si fue enviado.
    if ($id_barberia) {
        $sql .= " AND c.id_barberia = ?";
        $params[] = $id_barberia;
    }

    // Permite consultar solamente las citas de una fecha concreta.
    if ($fecha) {
        $sql .= " AND c.fecha = ?";
        $params[] = $fecha;
    }

    // GROUP BY evita repetir una cita cuando tiene varios servicios.
    // GROUP_CONCAT reúne los nombres de esos servicios en un solo texto.
    // Finalmente, las citas se ordenan por fecha y hora de inicio.
    $sql .= " GROUP BY c.id_cita ORDER BY c.fecha ASC, c.hora_inicio ASC";

    // Prepara y ejecuta la consulta usando los filtros recopilados.
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    // Obtiene todas las filas como un arreglo asociativo.
    $citas = $stmt->fetchAll();

    // -------------------------------------------------------------------------
    // 4. Respuesta exitosa
    // -------------------------------------------------------------------------
    // Devuelve las citas en formato JSON para que el frontend pueda mostrarlas.
    echo json_encode([
        "status" => "success",
        "datos" => $citas
    ]);

} catch (Exception $e) {
    // Si ocurre un error durante la consulta, se devuelve una respuesta JSON
    // indicando el problema en lugar de detenerse con un error HTML.
    echo json_encode(["status" => "error", "mensaje" => "Error al obtener citas: " . $e->getMessage()]);
}