<?php
// backend/clientes/desactivarc.php
// Alterna el estado de un cliente entre ACTIVO e INACTIVO.
// Si se envía "estado", se fija ese valor en lugar de alternar.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    requerirRol($pdo, ['SUPERADMIN']);

    $data = json_decode(file_get_contents('php://input'), true);
    $dni = is_array($data) && isset($data['dni']) && is_scalar($data['dni'])
        ? trim((string) $data['dni'])
        : '';
    $estadoSolicitado = is_array($data) && isset($data['estado']) && is_scalar($data['estado'])
        ? strtoupper(trim((string) $data['estado']))
        : null;

    if (
        !preg_match('/^\d{1,20}$/', $dni)
        || ($estadoSolicitado !== null && !in_array($estadoSolicitado, ['ACTIVO', 'INACTIVO'], true))
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un cliente y un estado válidos.']);
        exit();
    }

    $pdo->beginTransaction();

    $consulta = $pdo->prepare('SELECT estado FROM clientes WHERE dni = ? FOR UPDATE');
    $consulta->execute([$dni]);
    $estadoActual = $consulta->fetchColumn();

    if ($estadoActual === false) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró el cliente.']);
        exit();
    }

    $nuevoEstado = $estadoSolicitado ?? ($estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO');

    $actualizar = $pdo->prepare('UPDATE clientes SET estado = ? WHERE dni = ?');
    $actualizar->execute([$nuevoEstado, $dni]);
    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Estado del cliente actualizado.',
        'dni' => $dni,
        'estado' => $nuevoEstado,
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al cambiar el estado de un cliente: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el estado del cliente.']);
}
