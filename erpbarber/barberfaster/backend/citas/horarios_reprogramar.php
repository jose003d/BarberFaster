<?php
// Turnos libres para mover una cita del cliente: GET ?id_cita=N&fecha=YYYY-MM-DD.
//
// Usa las mismas reglas que reprogramar_cliente.php y agendar_cita.php: horario y días
// de la barbería, franjas de 30 minutos, la duración real de los servicios de la cita,
// nada en el pasado y ningún cruce con otras citas del mismo barbero (sin contar la
// propia cita). Así el cliente solo ve horas que sí se pueden elegir.

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../agenda/utilidades_horario.php';
require_once __DIR__ . '/../verificacion/comun.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(405, false, 'Método no permitido.');
}

try {
    $cliente = obtenerClienteAutenticado($pdo);
} catch (Throwable $e) {
    error_log('Error al validar sesión para ver turnos libres: ' . $e->getMessage());
    responder(500, false, 'No se pudo validar la sesión del cliente.');
}
if ($cliente === false) {
    responder(401, false, 'La sesión venció o los datos no coinciden. Verifica nuevamente tu WhatsApp.');
}

$idCita = filter_var($_GET['id_cita'] ?? null, FILTER_VALIDATE_INT);
$fecha = (string) ($_GET['fecha'] ?? '');
$zona = new DateTimeZone('America/Bogota');
$fechaValidada = DateTimeImmutable::createFromFormat('!Y-m-d', $fecha, $zona);
if (!$idCita || $idCita < 1 || !$fechaValidada || $fechaValidada->format('Y-m-d') !== $fecha) {
    responder(422, false, 'Indica una cita y una fecha válidas.');
}

$ahora = new DateTimeImmutable('now', $zona);
if ($fecha < $ahora->format('Y-m-d')) {
    responder(422, false, 'No puedes mover tu cita a un día que ya pasó.');
}

try {
    $stmt = $pdo->prepare("
        SELECT c.id_cita, c.id_barbero, c.fecha, c.hora_inicio, c.estado,
               b.hora_apertura, b.hora_cierre, b.dias_trabajo
        FROM citas c
        INNER JOIN barberias b ON b.id_barberia = c.id_barberia
        WHERE c.id_cita = ? AND c.dni_cliente = ?
    ");
    $stmt->execute([$idCita, $cliente['dni']]);
    $cita = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$cita || !in_array($cita['estado'], ['PENDIENTE', 'CONFIRMADA'], true)) {
        responder(409, false, 'Solo puedes cambiar el horario de tus citas pendientes o confirmadas.');
    }

    $stmtDuracion = $pdo->prepare("
        SELECT COALESCE(SUM(s.duracion_minutos), 0)
        FROM cita_servicios cs
        INNER JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE cs.id_cita = ?
    ");
    $stmtDuracion->execute([$idCita]);
    $duracion = (int) $stmtDuracion->fetchColumn();

    $apertura = horaAMinutos((string) $cita['hora_apertura']);
    $cierre = horaAMinutos((string) $cita['hora_cierre']);
    if ($duracion < 1 || $apertura === null || $cierre === null || $cierre <= $apertura) {
        responder(409, false, 'No se pudo calcular el horario de esta cita.');
    }

    $diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    $diaElegido = $diasSemana[(int) $fechaValidada->format('N') - 1];
    $abre = in_array($diaElegido, explode(',', (string) $cita['dias_trabajo']), true);

    $turnos = [];
    if ($abre) {
        // Citas del mismo barbero ese día, sin contar la que se va a mover.
        $stmtOcupadas = $pdo->prepare("
            SELECT hora_inicio, hora_fin
            FROM citas
            WHERE id_barbero = ? AND fecha = ? AND id_cita <> ?
              AND estado NOT IN ('CANCELADA', 'cancelada')
        ");
        $stmtOcupadas->execute([$cita['id_barbero'], $fecha, $idCita]);
        $ocupadas = array_map(static fn (array $fila): array => [
            horaAMinutos((string) $fila['hora_inicio']),
            horaAMinutos((string) $fila['hora_fin']),
        ], $stmtOcupadas->fetchAll(PDO::FETCH_ASSOC));

        $esHoy = $fecha === $ahora->format('Y-m-d');
        $minutoActual = ((int) $ahora->format('G') * 60) + (int) $ahora->format('i');
        $actual = $cita['fecha'] === $fecha ? horaAMinutos((string) $cita['hora_inicio']) : null;

        for ($inicio = $apertura; $inicio + $duracion <= $cierre; $inicio += 30) {
            if ($esHoy && $inicio <= $minutoActual) {
                continue;
            }
            $fin = $inicio + $duracion;
            foreach ($ocupadas as [$ocupadaInicio, $ocupadaFin]) {
                if ($ocupadaInicio !== null && $ocupadaFin !== null && $inicio < $ocupadaFin && $fin > $ocupadaInicio) {
                    continue 2;
                }
            }
            $turnos[] = [
                'hora' => substr((string) minutosAHora($inicio), 0, 5),
                'hora_fin' => substr((string) minutosAHora($fin), 0, 5),
                'actual' => $inicio === $actual,
            ];
        }
    }

    $nombresDias = ['LUNES' => 'lunes', 'MARTES' => 'martes', 'MIERCOLES' => 'miércoles', 'JUEVES' => 'jueves', 'VIERNES' => 'viernes', 'SABADO' => 'sábados', 'DOMINGO' => 'domingos'];
    responder(200, true, $abre ? 'Turnos disponibles.' : "La barbería no atiende los {$nombresDias[$diaElegido]}.", [
        'fecha' => $fecha,
        'abre' => $abre,
        'duracion_minutos' => $duracion,
        'turnos' => $turnos,
    ]);
} catch (Throwable $e) {
    error_log('Error al calcular turnos para reprogramar: ' . $e->getMessage());
    responder(500, false, 'No se pudieron cargar los turnos disponibles.');
}
