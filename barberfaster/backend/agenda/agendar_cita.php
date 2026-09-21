<?php
// Configuración de cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Respuesta inmediata para peticiones Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];

    $idBarbero  = (int) ($data['id_barbero'] ?? 0);
    $idServicio = (int) ($data['id_servicio'] ?? 0);
    $dni        = trim((string) ($data['dni_cliente'] ?? ''));
    $start      = trim((string) ($data['start_datetime'] ?? ''));
    $end        = trim((string) ($data['end_datetime'] ?? ''));
    $nombre     = trim((string) ($data['nombre'] ?? ''));

    if (!$idBarbero || !$idServicio || !$dni || !$start || !$end || !$nombre) {
        throw new InvalidArgumentException("DNI, barbero, servicio, fecha y nombre son obligatorios");
    }

    $pdo->beginTransaction();

    // Validar servicio y barbería
    $service = $pdo->prepare("
        SELECT s.id_barberia, s.duracion_estimada 
        FROM servicios s 
        INNER JOIN barberos b ON b.id_barberia = s.id_barberia 
        WHERE s.id_servicio = :servicio AND b.id_barbero = :barbero AND s.estado = 1
    ");
    $service->execute([':servicio' => $idServicio, ':barbero' => $idBarbero]);
    $serviceData = $service->fetch(PDO::FETCH_ASSOC);

    if (!$serviceData) {
        throw new InvalidArgumentException("El servicio no pertenece a la barbería del barbero");
    }

    // Validar solapamiento de horarios ocupados
    $conflict = $pdo->prepare("
        SELECT id_evento 
        FROM eventos 
        WHERE id_barbero = :barbero 
          AND estado_disponibilidad = 'RESERVADO' 
          AND start_datetime < :end 
          AND end_datetime > :start 
        FOR UPDATE
    ");
    $conflict->execute([':barbero' => $idBarbero, ':start' => $start, ':end' => $end]);

    if ($conflict->fetch()) {
        throw new RuntimeException("El horario se solapa con una cita ocupada");
    }

    // Insertar o actualizar cliente
    $client = $pdo->prepare("
        INSERT INTO clientes (dni, nombre, apellido, telefono, correo) 
        VALUES (:dni, :nombre, :apellido, :telefono, :correo) 
        ON DUPLICATE KEY UPDATE 
            nombre = VALUES(nombre), 
            apellido = VALUES(apellido), 
            telefono = VALUES(telefono), 
            correo = VALUES(correo)
    ");
    $client->execute([
        ':dni'      => $dni,
        ':nombre'   => $nombre,
        ':apellido' => trim((string) ($data['apellido'] ?? '')),
        ':telefono' => trim((string) ($data['telefono'] ?? '')),
        ':correo'   => trim((string) ($data['correo'] ?? ''))
    ]);

    // Crear evento en la agenda
    $event = $pdo->prepare("
        INSERT INTO eventos (id_barbero, id_barberia, start_datetime, end_datetime, estado_disponibilidad) 
        VALUES (:barbero, :barberia, :start, :end, 'RESERVADO')
    ");
    $event->execute([
        ':barbero'  => $idBarbero,
        ':barberia' => $serviceData['id_barberia'],
        ':start'    => $start,
        ':end'      => $end
    ]);
    $idEvento = (int) $pdo->lastInsertId();

    // Crear cita asociada
    $appointment = $pdo->prepare("
        INSERT INTO citas (id_evento, id_servicio, dni_cliente, id_barbero, estado, observaciones) 
        VALUES (:evento, :servicio, :dni, :barbero, 'PENDIENTE', :observaciones)
    ");
    $appointment->execute([
        ':evento'       => $idEvento,
        ':servicio'     => $idServicio,
        ':dni'          => $dni,
        ':barbero'      => $idBarbero,
        ':observaciones'=> trim((string) ($data['observaciones'] ?? ''))
    ]);
    $idCita = (int) $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode([
        'success'        => true,
        'id_cita'        => $idCita,
        'id_evento'      => $idEvento,
        'start_datetime' => $start,
        'end_datetime'   => $end
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code($e instanceof InvalidArgumentException ? 400 : 409);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}