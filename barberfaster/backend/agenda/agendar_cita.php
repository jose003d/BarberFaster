<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 2: Recepción y validación de datos
    // ==========================
    $data = json_decode(file_get_contents("php://input"), true);

    $id_evento     = $data['id_evento']     ?? null;
    $dni           = $data['dni']           ?? null;
    $nombre        = $data['nombre']        ?? '';
    $apellido      = $data['apellido']      ?? '';
    $telefono      = $data['telefono']      ?? '';
    $correo        = $data['correo']        ?? '';
    $observaciones = $data['observaciones'] ?? '';
    $start         = $data['start']         ?? null;
    $end           = $data['end']           ?? null;
    $id_barbero    = $data['id_barbero']    ?? null;
    $id_cliente    = $data['cliente_id']    ?? null;

    // Validación de campos obligatorios
    if ((!$id_evento && (!$start || !$end || !$id_barbero)) || !$dni || !$nombre || !$correo) {
        echo json_encode(["success" => false, "error" => "Faltan datos obligatorios"]);
        exit;
    }

    // Normalizar fechas si vienen en ISO
    if ($start) {
        $fechaInicio = new DateTime($start);
        $start = $fechaInicio->format('Y-m-d H:i:s');
    }
    if ($end) {
        $fechaFin = new DateTime($end);
        $end = $fechaFin->format('Y-m-d H:i:s');
    }

    // ==========================
    // BLOQUE 3: Creación o actualización de cliente
    // ==========================
    $cliente = null;
    if ($id_cliente) {
        $stmt = $pdo->prepare("SELECT id_cliente, dni FROM clientes WHERE id_cliente = :id_cliente LIMIT 1");
        $stmt->execute([':id_cliente' => $id_cliente]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$cliente && $dni) {
        $stmt = $pdo->prepare("SELECT id_cliente, dni FROM clientes WHERE dni = :dni LIMIT 1");
        $stmt->execute([':dni' => $dni]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$cliente) {
        $insertCliente = $pdo->prepare("INSERT INTO clientes (dni, nombre, apellido, telefono, correo) VALUES (:dni, :nombre, :apellido, :telefono, :correo)");
        $insertCliente->execute([
            ':dni'      => $dni,
            ':nombre'   => $nombre,
            ':apellido' => $apellido,
            ':telefono' => $telefono,
            ':correo'   => $correo,
        ]);
        $cliente_id = $pdo->lastInsertId();
    } else {
        $updateCliente = $pdo->prepare("UPDATE clientes SET dni = :dni, nombre = :nombre, apellido = :apellido, telefono = :telefono, correo = :correo WHERE id_cliente = :id_cliente");
        $updateCliente->execute([
            ':dni'        => $dni,
            ':nombre'     => $nombre,
            ':apellido'   => $apellido,
            ':telefono'   => $telefono,
            ':correo'     => $correo,
            ':id_cliente' => $cliente['id_cliente'],
        ]);
        $cliente_id = $cliente['id_cliente'];
    }

    // ==========================
    // BLOQUE 4: Verificación de disponibilidad del evento
    // ==========================
    $evento = null;
    if ($id_evento) {
        $stmt = $pdo->prepare("SELECT * FROM eventos WHERE id_evento = :id AND disponible = 1");
        $stmt->execute([':id' => $id_evento]);
        $evento = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$evento && $start && $end && $id_barbero) {
        $stmt = $pdo->prepare("SELECT * FROM eventos WHERE id_barbero = :id_barbero AND start_datetime = :start AND end_datetime = :end AND disponible = 1 LIMIT 1");
        $stmt->execute([
            ':id_barbero' => $id_barbero,
            ':start'      => $start,
            ':end'        => $end,
        ]);
        $evento = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $nuevoEvento = false;
    if (!$evento) {
        $barberoStmt = $pdo->prepare("SELECT id_barberia FROM barberos WHERE id_barbero = :id_barbero LIMIT 1");
        $barberoStmt->execute([':id_barbero' => $id_barbero]);
        $barberoData = $barberoStmt->fetch(PDO::FETCH_ASSOC);

        if (!$barberoData) {
            echo json_encode(["success" => false, "error" => "No se encontró al barbero asociado"]);
            exit;
        }

        $insertStmt = $pdo->prepare("INSERT INTO eventos (titulo, start_datetime, end_datetime, disponible, tipo, color, id_barbero, id_barberia, clientes_dni) VALUES ('OCUPADO', :start, :end, 0, 'OCUPADO', '#dc2626', :id_barbero, :id_barberia, :dni)");
        $insertStmt->execute([
            ':start'      => $start,
            ':end'        => $end,
            ':id_barbero' => $id_barbero,
            ':id_barberia'=> $barberoData['id_barberia'],
            ':dni'        => $dni,
        ]);
        $id_evento = $pdo->lastInsertId();
        $evento = ['id_evento' => $id_evento, 'id_barbero' => $id_barbero, 'id_barberia' => $barberoData['id_barberia'], 'disponible' => 0];
        $nuevoEvento = true;
    }

    if (!$evento || (!$nuevoEvento && isset($evento['disponible']) && !$evento['disponible'])) {
        echo json_encode(["success" => false, "error" => "Este horario ya no está disponible"]);
        exit;
    }

    if (!$nuevoEvento) {
        $pdo->prepare("UPDATE eventos SET disponible = 0, tipo = 'OCUPADO', color = '#dc2626', clientes_dni = :dni WHERE id_evento = :id")
            ->execute([':dni' => $dni, ':id' => $id_evento]);
    }

    $pdo->prepare("INSERT INTO citas (id_evento, estado, observaciones, fecha_creacion, clientes_dni, Barberos_id_barbero) VALUES (:id_evento, 'PENDIENTE', :obs, NOW(), :dni, :id_barbero)")
        ->execute([
            ':id_evento'  => $id_evento,
            ':obs'        => $observaciones,
            ':dni'        => $dni,
            ':id_barbero' => $evento['id_barbero'],
        ]);

    // ==========================
    // BLOQUE 4: Creación o actualización de cliente
    // ==========================
    $stmt = $pdo->prepare("SELECT dni FROM clientes WHERE dni = :dni");
    $stmt->execute([':dni' => $dni]);

    if (!$stmt->fetch()) {
        // Insertar nuevo cliente
        $pdo->prepare("
            INSERT INTO clientes (dni, nombre, apellido, telefono, correo) 
            VALUES (:dni, :nombre, :apellido, :telefono, :correo)
        ")->execute([
            ':dni' => $dni, 
            ':nombre' => $nombre, 
            ':apellido' => $apellido, 
            ':telefono' => $telefono, 
            ':correo' => $correo
        ]);
    } else {
        // Actualizar datos de cliente existente
        $pdo->prepare("
            UPDATE clientes 
            SET nombre = :nombre, apellido = :apellido, telefono = :telefono, correo = :correo 
            WHERE dni = :dni
        ")->execute([
            ':dni' => $dni, 
            ':nombre' => $nombre, 
            ':apellido' => $apellido, 
            ':telefono' => $telefono, 
            ':correo' => $correo
        ]);
    }

    // ==========================
    // BLOQUE 5: Actualización del evento (marcar como ocupado)
    // ==========================
    $pdo->prepare("
        UPDATE eventos 
        SET disponible = 0, tipo = 'OCUPADO', color = '#dc2626', clientes_dni = :dni 
        WHERE id_evento = :id
    ")->execute([':dni' => $dni, ':id' => $id_evento]);

    // ==========================
    // BLOQUE 6: Creación de la cita
    // ==========================
    $pdo->prepare("
        INSERT INTO citas (id_evento, estado, observaciones, fecha_creacion, clientes_dni, Barberos_id_barbero)
        VALUES (:id_evento, 'PENDIENTE', :obs, NOW(), :dni, :id_barbero)
    ")->execute([
        ':id_evento'  => $id_evento,
        ':obs'        => $observaciones,
        ':dni'        => $dni,
        ':id_barbero' => $evento['id_barbero']
    ]);

    // ==========================
    // BLOQUE 7: Respuesta final
    // ==========================
    echo json_encode(["success" => true, "message" => "¡Cita agendada con éxito!"]);

} catch (Exception $e) {
    // Manejo de errores
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
