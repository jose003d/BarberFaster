<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../tiempo_real/pusher.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);
    $data = json_decode(file_get_contents('php://input'), true);
    $idCita = filter_var(
        is_array($data) ? ($data['id_cita'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    if (!$idCita || $idCita < 1) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica una cita válida.']);
        exit();
    }

    $sql = "UPDATE citas SET estado = 'CANCELADA' WHERE id_cita = :id_cita";
    $parametros = [':id_cita' => $idCita];
    if ($usuario['rol'] === 'ADMINISTRADOR') {
        $sql .= ' AND id_barberia = :id_barberia';
        $parametros[':id_barberia'] = $usuario['id_barberia'];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró la cita de esa barbería.']);
        exit();
    }

    notificarCambioCita($pdo, $idCita, 'CANCELADA');
    echo json_encode(['status' => 'success', 'mensaje' => 'La cita ha sido cancelada correctamente.']);
} catch (Throwable $error) {
    error_log('Error al cancelar una cita: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cancelar la cita.']);
}
