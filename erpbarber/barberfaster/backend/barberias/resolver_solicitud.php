<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

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
    requerirRol($pdo, ['SUPERADMIN']);
    $datos = json_decode(file_get_contents('php://input'), true);
    if (!is_array($datos)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'Los datos enviados no son válidos.']);
        exit();
    }

    $idSolicitud = filter_var($datos['id_solicitud'] ?? null, FILTER_VALIDATE_INT);
    $accion = $datos['accion'] ?? null;
    if (
        !$idSolicitud
        || $idSolicitud < 1
        || !is_string($accion)
        || !in_array($accion, ['aprobar', 'rechazar'], true)
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'La solicitud o la acción no son válidas.']);
        exit();
    }

    $pdo->beginTransaction();
    $stmtSolicitud = $pdo->prepare("
        SELECT *
        FROM solicitudes_barberia
        WHERE id_solicitud = :id_solicitud
        LIMIT 1
        FOR UPDATE
    ");
    $stmtSolicitud->execute([':id_solicitud' => $idSolicitud]);
    $solicitud = $stmtSolicitud->fetch();

    if (!$solicitud || $solicitud['estado'] !== 'PENDIENTE') {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'La solicitud ya fue atendida o no existe.']);
        exit();
    }

    if ($accion === 'rechazar') {
        $stmt = $pdo->prepare("
            UPDATE solicitudes_barberia
            SET estado = 'RECHAZADA', resuelto_en = CURRENT_TIMESTAMP
            WHERE id_solicitud = :id_solicitud
        ");
        $stmt->execute([':id_solicitud' => $idSolicitud]);
        $pdo->commit();

        echo json_encode(['status' => 'success', 'mensaje' => 'La solicitud fue rechazada.']);
        exit();
    }

    $stmtDuplicado = $pdo->prepare("
        SELECT documento, correo
        FROM usuarios
        WHERE documento = :documento OR correo = :correo
        LIMIT 1
    ");
    $stmtDuplicado->execute([
        ':documento' => $solicitud['documento_admin'],
        ':correo' => $solicitud['correo_admin'],
    ]);
    $duplicado = $stmtDuplicado->fetch();
    if ($duplicado) {
        $mensaje = $duplicado['documento'] === $solicitud['documento_admin']
            ? 'El documento del administrador ya pertenece a una cuenta.'
            : 'El correo del administrador ya pertenece a una cuenta.';
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => $mensaje]);
        exit();
    }

    $stmtBarberia = $pdo->prepare("
        INSERT INTO barberias (nombre, direccion, ciudad, telefono, estado)
        VALUES (:nombre, :direccion, :ciudad, :telefono, 'ACTIVA')
    ");
    $stmtBarberia->execute([
        ':nombre' => $solicitud['nombre_barberia'],
        ':direccion' => $solicitud['direccion'],
        ':ciudad' => $solicitud['ciudad'],
        ':telefono' => $solicitud['telefono_barberia'],
    ]);
    $idBarberia = (int) $pdo->lastInsertId();

    $contrasenaTemporal = bin2hex(random_bytes(6));
    $hash = password_hash($contrasenaTemporal, PASSWORD_DEFAULT);
    if (!is_string($hash)) {
        throw new RuntimeException('No se pudo generar la contraseña inicial del administrador.');
    }

    $stmtAdmin = $pdo->prepare("
        INSERT INTO usuarios
            (id_barberia, documento, nombre_completo, telefono, correo, password, rol, estado, debe_cambiar_contrasena)
        VALUES
            (:id_barberia, :documento, :nombre, :telefono, :correo, :password, 'ADMINISTRADOR', 'ACTIVO', 1)
    ");
    $stmtAdmin->execute([
        ':id_barberia' => $idBarberia,
        ':documento' => $solicitud['documento_admin'],
        ':nombre' => $solicitud['nombre_admin'],
        ':telefono' => $solicitud['telefono_admin'],
        ':correo' => $solicitud['correo_admin'],
        ':password' => $hash,
    ]);

    $stmtResolver = $pdo->prepare("
        UPDATE solicitudes_barberia
        SET estado = 'APROBADA',
            id_barberia = :id_barberia,
            resuelto_en = CURRENT_TIMESTAMP
        WHERE id_solicitud = :id_solicitud
    ");
    $stmtResolver->execute([
        ':id_barberia' => $idBarberia,
        ':id_solicitud' => $idSolicitud,
    ]);
    $pdo->commit();

    $correoEnviado = false;
    $remitente = getenv('PASSWORD_RESET_FROM');
    if (is_string($remitente) && filter_var($remitente, FILTER_VALIDATE_EMAIL)) {
        $asunto = 'Datos de acceso de tu barberia - BarberFaster';
        $mensajeCorreo = implode("\n", [
            "Hola {$solicitud['nombre_admin']},",
            '',
            "Tu solicitud fue aprobada y la barberia {$solicitud['nombre_barberia']} ya esta activa en BarberFaster.",
            '',
            'Datos de tu barberia:',
            "Nombre: {$solicitud['nombre_barberia']}",
            "Direccion: {$solicitud['direccion']}",
            "Ciudad: {$solicitud['ciudad']}",
            "Telefono: {$solicitud['telefono_barberia']}",
            '',
            'Datos para iniciar sesion:',
            "Correo: {$solicitud['correo_admin']}",
            "Documento: {$solicitud['documento_admin']}",
            "Contrasena temporal: {$contrasenaTemporal}",
            '',
            'Por seguridad, el sistema te pedira cambiar la contrasena temporal al iniciar sesion.',
            'Si no solicitaste esta barberia, contacta al equipo de BarberFaster.',
        ]);
        $cabeceras = "From: BarberFaster <{$remitente}>\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n";

        try {
            $correoEnviado = mail(
                $solicitud['correo_admin'],
                $asunto,
                $mensajeCorreo,
                $cabeceras
            );
        } catch (Throwable $errorCorreo) {
            error_log('No se pudo enviar el correo de acceso de la barberia aprobada: ' . $errorCorreo->getMessage());
        }
    } else {
        error_log('PASSWORD_RESET_FROM no está configurado; no se envió el correo de acceso de la barbería.');
    }

    if (!$correoEnviado) {
        error_log('PHP mail() no pudo enviar el correo de acceso a ' . $solicitud['correo_admin'] . '.');
    }

    echo json_encode([
        'status' => 'success',
        'mensaje' => $correoEnviado
            ? 'La barbería fue aprobada y los datos de acceso se enviaron al correo registrado.'
            : 'La barbería fue aprobada, pero no se pudo enviar el correo. Usa los datos de acceso de respaldo y configura el servicio de correo.',
        'correo_enviado' => $correoEnviado,
        'barberia' => [
            'id_barberia' => $idBarberia,
            'nombre' => $solicitud['nombre_barberia'],
            'direccion' => $solicitud['direccion'],
            'ciudad' => $solicitud['ciudad'],
            'telefono' => $solicitud['telefono_barberia'],
        ],
        'administrador' => array_filter([
            'documento' => $solicitud['documento_admin'],
            'correo' => $solicitud['correo_admin'],
            'contrasena_temporal' => $correoEnviado ? null : $contrasenaTemporal,
        ], static fn ($valor) => $valor !== null),
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($error->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'El documento o correo ya está registrado.']);
        exit();
    }
    error_log('Error al resolver solicitud de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo resolver la solicitud.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al resolver solicitud de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo resolver la solicitud.']);
}
