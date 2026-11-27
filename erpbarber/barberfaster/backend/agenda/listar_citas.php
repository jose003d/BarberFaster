<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

$idBarbero = null;
if (isset($_GET['id_barbero'])) {
    $idBarbero = filter_var($_GET['id_barbero'], FILTER_VALIDATE_INT);
    if (!$idBarbero || $idBarbero < 1) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'El barbero indicado no es válido.']);
        exit();
    }
}

$fecha = $_GET['fecha'] ?? null;
if ($fecha !== null) {
    $fechaValida = is_string($fecha) ? DateTime::createFromFormat('!Y-m-d', $fecha) : false;
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'La fecha indicada no es válida.']);
        exit();
    }
}

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);
    if ($usuario['rol'] === 'ADMINISTRADOR') {
        $idBarberia = $usuario['id_barberia'];
        if (!$idBarberia) {
            responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
        }
    } else {
        $idBarberia = filter_var($_GET['id_barberia'] ?? null, FILTER_VALIDATE_INT);
        if (!$idBarberia || $idBarberia < 1) {
            if (!$idBarbero) {
                http_response_code(422);
                echo json_encode(['status' => 'error', 'mensaje' => 'Selecciona una barbería válida.']);
                exit();
            }

            $stmtBarbero = $pdo->prepare("
                SELECT id_barberia
                FROM usuarios
                WHERE id_usuario = :id_usuario AND rol = 'BARBERO'
                LIMIT 1
            ");
            $stmtBarbero->execute([':id_usuario' => $idBarbero]);
            $idBarberia = filter_var($stmtBarbero->fetchColumn(), FILTER_VALIDATE_INT);
            if (!$idBarberia || $idBarberia < 1) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró el barbero indicado.']);
                exit();
            }
        }
    }

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
        WHERE c.id_barberia = ?
    ";
    $parametros = [$idBarberia];

    if ($idBarbero) {
        $sql .= ' AND c.id_barbero = ?';
        $parametros[] = $idBarbero;
    }
    if ($fecha !== null) {
        $sql .= ' AND c.fecha = ?';
        $parametros[] = $fecha;
    }

    $sql .= ' GROUP BY c.id_cita ORDER BY c.fecha ASC, c.hora_inicio ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);

    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll()]);
} catch (Throwable $error) {
    error_log('Error al obtener citas de la barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las citas.']);
}
