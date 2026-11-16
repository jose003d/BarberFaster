<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

$datos = json_decode(file_get_contents('php://input'), true);
if (!is_array($datos)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensaje' => 'Los datos enviados no son válidos.']);
    exit();
}

$campos = [];
foreach ([
    'nombre_barberia',
    'direccion',
    'ciudad',
    'telefono_barberia',
    'nombre_admin',
    'documento_admin',
    'telefono_admin',
    'correo_admin',
] as $campo) {
    $valor = $datos[$campo] ?? '';
    $campos[$campo] = is_string($valor) || is_numeric($valor) ? trim((string) $valor) : '';
}

if (
    $campos['nombre_barberia'] === ''
    || strlen($campos['nombre_barberia']) > 100
    || $campos['direccion'] === ''
    || strlen($campos['direccion']) > 150
    || $campos['ciudad'] === ''
    || strlen($campos['ciudad']) > 80
    || $campos['telefono_barberia'] === ''
    || strlen($campos['telefono_barberia']) > 20
    || $campos['nombre_admin'] === ''
    || strlen($campos['nombre_admin']) > 150
    || $campos['documento_admin'] === ''
    || strlen($campos['documento_admin']) > 30
    || strlen($campos['telefono_admin']) > 20
    || !filter_var($campos['correo_admin'], FILTER_VALIDATE_EMAIL)
    || strlen($campos['correo_admin']) > 120
) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'mensaje' => 'Revisa los datos de la barbería y del administrador.']);
    exit();
}

try {
    $stmtDuplicado = $pdo->prepare("
        SELECT id_solicitud
        FROM solicitudes_barberia
        WHERE correo_admin = :correo
          AND estado = 'PENDIENTE'
        LIMIT 1
    ");
    $stmtDuplicado->execute([':correo' => $campos['correo_admin']]);
    if ($stmtDuplicado->fetchColumn()) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'Ya existe una solicitud pendiente con ese correo.']);
        exit();
    }

    $stmt = $pdo->prepare("
        INSERT INTO solicitudes_barberia
            (nombre_barberia, direccion, ciudad, telefono_barberia,
             nombre_admin, documento_admin, telefono_admin, correo_admin)
        VALUES
            (:nombre_barberia, :direccion, :ciudad, :telefono_barberia,
             :nombre_admin, :documento_admin, :telefono_admin, :correo_admin)
    ");
    $stmt->execute($campos);

    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Solicitud enviada. El equipo de BarberFaster revisará los datos.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Error al registrar solicitud de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo enviar la solicitud. Inténtalo nuevamente.']);
}
