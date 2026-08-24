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

// Asegurar columnas nuevas en eventos (no falla si ya existen)
try {
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS intervalo INT DEFAULT 30");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS servicio VARCHAR(100) NULL");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'DISPONIBLE'");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS observaciones TEXT NULL");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS metodo_validacion VARCHAR(20) NULL");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado_validacion VARCHAR(20) DEFAULT 'PENDIENTE'");
} catch (Exception $e) {
    // ignore
}

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
    if ($dni) {
        $stmt = $pdo->prepare("SELECT dni FROM clientes WHERE dni = :dni LIMIT 1");
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
    } else {
        $updateCliente = $pdo->prepare("UPDATE clientes SET nombre = :nombre, apellido = :apellido, telefono = :telefono, correo = :correo WHERE dni = :dni");
        $updateCliente->execute([
            ':dni'        => $dni,
            ':nombre'     => $nombre,
            ':apellido'   => $apellido,
            ':telefono'   => $telefono,
            ':correo'     => $correo,
        ]);
    }

    // ==========================
    // BLOQUE 4: Verificación de disponibilidad del evento y validación de código
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

        $insertStmt = $pdo->prepare("INSERT INTO eventos (titulo, start_datetime, end_datetime, disponible, tipo, color, id_barbero, id_barberia, clientes_dni, estado, observaciones, metodo_validacion, estado_validacion) VALUES ('OCUPADO', :start, :end, 0, 'OCUPADO', '#dc2626', :id_barbero, :id_barberia, :dni, 'OCUPADO', :obs, :metodo, 'VERIFICADO')");
        $insertStmt->execute([
            ':start'      => $start,
            ':end'        => $end,
            ':id_barbero' => $id_barbero,
            ':id_barberia'=> $barberoData['id_barberia'],
            ':dni'        => $dni,
            ':obs'        => $observaciones,
            ':metodo'     => $data['metodo_validacion'] ?? null,
        ]);
        $id_evento = $pdo->lastInsertId();
        $evento = ['id_evento' => $id_evento, 'id_barbero' => $id_barbero, 'id_barberia' => $barberoData['id_barberia'], 'disponible' => 0];
        $nuevoEvento = true;
    }

    // Validar que el slot esté disponible
    if (!$evento || (!$nuevoEvento && isset($evento['disponible']) && !$evento['disponible'])) {
        echo json_encode(["success" => false, "error" => "Este horario ya no está disponible"]);
        exit;
    }

    // Verificar código de validación solo si se envió uno
    $codigo = $data['validation_code'] ?? null;
    if ($codigo) {
        try {
            $valStmt = $pdo->prepare("CREATE TABLE IF NOT EXISTS validaciones (id INT AUTO_INCREMENT PRIMARY KEY, dni VARCHAR(50), codigo VARCHAR(20), metodo VARCHAR(20), estado VARCHAR(20) DEFAULT 'PENDIENTE', creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, valido_hasta DATETIME)");
            $valStmt->execute();
        } catch (Exception $e) {
            // ignore
        }

        $checkVal = $pdo->prepare("SELECT id, estado, valido_hasta FROM validaciones WHERE dni = :dni AND codigo = :codigo ORDER BY creado_at DESC LIMIT 1");
        $checkVal->execute([':dni' => $dni, ':codigo' => $codigo]);
        $val = $checkVal->fetch(PDO::FETCH_ASSOC);
        if (!$val) {
            echo json_encode(["success" => false, "error" => "Código de validación inválido"]);
            exit;
        }
        if (isset($val['valido_hasta']) && $val['valido_hasta'] < date('Y-m-d H:i:s')) {
            echo json_encode(["success" => false, "error" => "Código expirado"]);
            exit;
        }
        // Marcar validación
        $pdo->prepare("UPDATE validaciones SET estado = 'VERIFICADO' WHERE id = :id")->execute([':id' => $val['id']]);
    }

    if (!$nuevoEvento) {
        $pdo->prepare("UPDATE eventos SET disponible = 0, tipo = 'OCUPADO', color = '#dc2626', clientes_dni = :dni, estado = 'OCUPADO', observaciones = :obs, metodo_validacion = :metodo, estado_validacion = 'VERIFICADO' WHERE id_evento = :id")
            ->execute([':dni' => $dni, ':id' => $id_evento, ':obs' => $observaciones, ':metodo' => $data['metodo_validacion'] ?? null]);
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
