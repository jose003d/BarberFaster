<?php

declare(strict_types=1);

require_once '../config/database.php';
require_once '../agenda/horarios_utils.php';
require_once '../verificacion/comun.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método no permitido.');
}

try {
    $cliente = obtenerClienteAutenticado($pdo);
} catch (Throwable $e) {
    error_log('Error al validar sesión para reprogramar cita: ' . $e->getMessage());
    responder(500, false, 'No se pudo validar la sesión del cliente.');
}
if ($cliente === false) {
    responder(401, false, 'La sesión venció o los datos no coinciden. Verifica nuevamente tu WhatsApp.');
}

$datos = obtenerJsonBody();
$idCita = filter_var($datos['id_cita'] ?? null, FILTER_VALIDATE_INT);
$fecha = obtenerTexto($datos, 'fecha');
$horaInicioSolicitada = obtenerTexto($datos, 'hora_inicio');

if ($idCita === false || $idCita < 1 || $fecha === '' || $horaInicioSolicitada === '') {
    responder(400, false, 'Indica una cita, fecha y hora válidas.');
}

try {
    $pdo->beginTransaction();

    $stmtCita = $pdo->prepare("
        SELECT id_cita, id_barberia, id_barbero, fecha, estado
        FROM citas
        WHERE id_cita = ? AND dni_cliente = ?
        FOR UPDATE
    ");
    $stmtCita->execute([$idCita, $cliente['dni']]);
    $cita = $stmtCita->fetch();
    if (!$cita || !in_array($cita['estado'], ['PENDIENTE', 'CONFIRMADA'], true)) {
        throw new RuntimeException('Solo puedes reprogramar tus citas pendientes o confirmadas.', 409);
    }

    $stmtBarbero = $pdo->prepare("
        SELECT id_barbero
        FROM barberos
        WHERE id_barbero = ? AND id_barberia = ?
        FOR UPDATE
    ");
    $stmtBarbero->execute([$cita['id_barbero'], $cita['id_barberia']]);
    if (!$stmtBarbero->fetchColumn()) {
        throw new RuntimeException('No se encontró el barbero de esta cita.', 409);
    }

    $stmtHorario = $pdo->prepare("
        SELECT hora_apertura, hora_cierre
        FROM barberias
        WHERE id_barberia = ?
    ");
    $stmtHorario->execute([$cita['id_barberia']]);
    $horario = $stmtHorario->fetch();
    if (!$horario) {
        throw new RuntimeException('No se encontró el horario de la barbería.', 409);
    }

    $stmtDuracion = $pdo->prepare("
        SELECT COALESCE(SUM(s.duracion_minutos), 0)
        FROM cita_servicios cs
        INNER JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE cs.id_cita = ?
    ");
    $stmtDuracion->execute([$idCita]);
    $duracion = (int)$stmtDuracion->fetchColumn();
    if ($duracion < 1) {
        throw new RuntimeException('No se pudo calcular la duración de esta cita.', 409);
    }

    $zonaHoraria = new DateTimeZone('America/Bogota');
    $fechaValidada = DateTime::createFromFormat('!Y-m-d', $fecha, $zonaHoraria);
    $erroresFecha = DateTime::getLastErrors();
    $inicioMinutos = horaAMinutos($horaInicioSolicitada);
    $aperturaMinutos = horaAMinutos((string)$horario['hora_apertura']);
    $cierreMinutos = horaAMinutos((string)$horario['hora_cierre']);
    if (
        !$fechaValidada ||
        ($erroresFecha && ($erroresFecha['warning_count'] > 0 || $erroresFecha['error_count'] > 0)) ||
        $fechaValidada->format('Y-m-d') !== $fecha ||
        $inicioMinutos === null ||
        $aperturaMinutos === null ||
        $cierreMinutos === null ||
        $cierreMinutos <= $aperturaMinutos
    ) {
        throw new RuntimeException('La fecha o la hora seleccionada no son válidas.', 422);
    }

    $finMinutos = $inicioMinutos + $duracion;
    if (
        $inicioMinutos < $aperturaMinutos ||
        ($inicioMinutos - $aperturaMinutos) % 30 !== 0 ||
        $finMinutos > $cierreMinutos
    ) {
        throw new RuntimeException('El turno debe estar dentro del horario y comenzar en una franja de 30 minutos.', 422);
    }

    $ahora = new DateTime('now', $zonaHoraria);
    $hoy = (clone $ahora)->setTime(0, 0);
    $minutoActual = ((int)$ahora->format('G') * 60) + (int)$ahora->format('i');
    if ($fechaValidada < $hoy || ($fecha === $hoy->format('Y-m-d') && $inicioMinutos <= $minutoActual)) {
        throw new RuntimeException('No puedes reprogramar una cita para una fecha u hora que ya pasó.', 422);
    }

    $horaInicio = minutosAHora($inicioMinutos);
    $horaFin = minutosAHora($finMinutos);
    $stmtDisponibilidad = $pdo->prepare("
        SELECT id_cita
        FROM citas
        WHERE id_barbero = ?
          AND fecha = ?
          AND estado NOT IN ('CANCELADA', 'cancelada')
          AND id_cita <> ?
          AND ? < hora_fin
          AND ? > hora_inicio
        FOR UPDATE
    ");
    $stmtDisponibilidad->execute([
        $cita['id_barbero'],
        $fecha,
        $idCita,
        $horaInicio,
        $horaFin,
    ]);
    if ($stmtDisponibilidad->fetchColumn()) {
        throw new RuntimeException('Ese horario ya está ocupado. Selecciona otro.', 409);
    }

    $stmtActualizar = $pdo->prepare("
        UPDATE citas
        SET fecha = ?, hora_inicio = ?, hora_fin = ?
        WHERE id_cita = ? AND dni_cliente = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
    ");
    $stmtActualizar->execute([$fecha, $horaInicio, $horaFin, $idCita, $cliente['dni']]);
    $pdo->commit();

    responder(200, true, 'La cita se reprogramó correctamente.', [
        'id_cita' => $idCita,
        'fecha' => $fecha,
        'hora_inicio' => $horaInicio,
        'hora_fin' => $horaFin,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($e instanceof RuntimeException && $e->getCode() >= 400 && $e->getCode() < 500) {
        responder((int)$e->getCode(), false, $e->getMessage());
    }

    error_log('Error al reprogramar cita de cliente: ' . $e->getMessage());
    responder(500, false, 'No se pudo reprogramar la cita.');
}
