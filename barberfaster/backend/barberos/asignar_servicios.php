<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    $sesion = requerirRol($pdo, ['ADMINISTRADOR', 'SUPERADMIN']);
    $idBarbero = $_SERVER['REQUEST_METHOD'] === 'GET'
        ? filter_var($_GET['id_barbero'] ?? null, FILTER_VALIDATE_INT)
        : null;
    $datos = null;

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $datos = json_decode(file_get_contents('php://input'), true);
        $idBarbero = filter_var(
            is_array($datos) ? ($datos['id_barbero'] ?? null) : null,
            FILTER_VALIDATE_INT
        );
    } elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
        exit();
    }

    if (!$idBarbero || $idBarbero < 1) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un barbero válido.']);
        exit();
    }

    $stmtBarbero = $pdo->prepare("
        SELECT id_barberia
        FROM usuarios
        WHERE id_usuario = :id_usuario AND rol = 'BARBERO'
        LIMIT 1
    ");
    $stmtBarbero->execute([':id_usuario' => $idBarbero]);
    $idBarberia = $stmtBarbero->fetchColumn();
    if (
        $idBarberia === false
        || ($sesion['rol'] === 'ADMINISTRADOR' && (int) $idBarberia !== $sesion['id_barberia'])
    ) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró el barbero de esa barbería.']);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare('SELECT id_servicio FROM barbero_servicios WHERE id_barbero = :id_barbero');
        $stmt->execute([':id_barbero' => $idBarbero]);
        $servicios = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
        echo json_encode(['status' => 'success', 'servicios' => $servicios]);
        exit();
    }

    $serviciosIds = $datos['servicios_ids'] ?? [];
    if (!is_array($serviciosIds) || count($serviciosIds) > 100) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'La lista de servicios no es válida.']);
        exit();
    }

    $serviciosIds = array_values(array_unique(array_map(
        static fn($id) => filter_var($id, FILTER_VALIDATE_INT),
        $serviciosIds
    )));
    if (in_array(false, $serviciosIds, true) || in_array(null, $serviciosIds, true)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'La lista de servicios contiene identificadores no válidos.']);
        exit();
    }

    $stmtServicio = $pdo->prepare("
        SELECT id_servicio
        FROM servicios
        WHERE id_servicio = :id_servicio
          AND id_barberia = :id_barberia
          AND estado = 'ACTIVO'
        LIMIT 1
    ");
    foreach ($serviciosIds as $idServicio) {
        if ($idServicio < 1) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'mensaje' => 'La lista de servicios contiene identificadores no válidos.']);
            exit();
        }
        $stmtServicio->execute([
            ':id_servicio' => $idServicio,
            ':id_barberia' => $idBarberia,
        ]);
        if (!$stmtServicio->fetchColumn()) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'mensaje' => 'Todos los servicios deben pertenecer a la misma barbería y estar activos.']);
            exit();
        }
    }

    $pdo->beginTransaction();
    $stmtDelete = $pdo->prepare('DELETE FROM barbero_servicios WHERE id_barbero = :id_barbero');
    $stmtDelete->execute([':id_barbero' => $idBarbero]);
    $stmtInsert = $pdo->prepare("
        INSERT INTO barbero_servicios (id_barbero, id_servicio)
        VALUES (:id_barbero, :id_servicio)
    ");
    foreach ($serviciosIds as $idServicio) {
        $stmtInsert->execute([
            ':id_barbero' => $idBarbero,
            ':id_servicio' => $idServicio,
        ]);
    }
    $pdo->commit();

    echo json_encode(['status' => 'success', 'mensaje' => 'Asignaciones actualizadas correctamente.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al asignar servicios a un barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron actualizar las asignaciones.']);
}
