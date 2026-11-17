<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
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
    $sesion = requerirRol($pdo, ['ADMINISTRADOR', 'SUPERADMIN']);
    $data = json_decode(file_get_contents('php://input'), true);
    $idBarbero = filter_var(
        is_array($data) ? ($data['id_barbero'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    $dia = strtoupper(trim((string) ($data['dia_semana'] ?? '')));
    $horaInicio = (string) ($data['hora_inicio'] ?? '');
    $horaFin = (string) ($data['hora_fin'] ?? '');
    $diasValidos = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

    if (
        !$idBarbero
        || $idBarbero < 1
        || !in_array($dia, $diasValidos, true)
        || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $horaInicio)
        || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $horaFin)
        || $horaFin <= $horaInicio
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa el barbero, el día y el horario ingresados.']);
        exit();
    }

    $stmtBarbero = $pdo->prepare("
        SELECT id_barberia
        FROM usuarios
        WHERE id_usuario = :id_usuario AND (rol = 'BARBERO' OR (rol = 'ADMINISTRADOR' AND atiende_clientes = 1))
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

    $stmt = $pdo->prepare("
        INSERT INTO barbero_horarios (id_barbero, dia_semana, hora_inicio, hora_fin)
        VALUES (:id_barbero, :dia_semana, :hora_inicio, :hora_fin)
        ON DUPLICATE KEY UPDATE
            hora_inicio = VALUES(hora_inicio),
            hora_fin = VALUES(hora_fin)
    ");
    $stmt->execute([
        ':id_barbero' => $idBarbero,
        ':dia_semana' => $dia,
        ':hora_inicio' => strlen($horaInicio) === 5 ? $horaInicio . ':00' : $horaInicio,
        ':hora_fin' => strlen($horaFin) === 5 ? $horaFin . ':00' : $horaFin,
    ]);

    echo json_encode(['status' => 'success', 'mensaje' => 'Horario del barbero actualizado correctamente.']);
} catch (Throwable $error) {
    error_log('Error al guardar el horario de un barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo guardar el horario.']);
}
