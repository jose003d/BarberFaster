<?php
// backend/agenda/validar_disponibilidad.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$id_barbero  = $_GET['id_barbero'] ?? null;
$fecha       = $_GET['fecha'] ?? null;         // Formato: YYYY-MM-DD
$hora_inicio = $_GET['hora_inicio'] ?? null;   // Formato: HH:MM:SS
$servicios   = $_GET['servicios'] ?? [];       // Array de IDs de servicios

if (!$id_barbero || !$fecha || !$hora_inicio || empty($servicios)) {
    echo json_encode(["status" => "error", "mensaje" => "Faltan parámetros de consulta."]);
    exit();
}

try {
    // 1. Calcular duración total sumando servicios
    if (!is_array($servicios)) {
        $servicios = explode(',', $servicios);
    }
    $placeholders = implode(',', array_fill(0, count($servicios), '?'));
    $stmtServ = $pdo->prepare("SELECT SUM(duracion_minutos) FROM servicios WHERE id_servicio IN ($placeholders)");
    $stmtServ->execute($servicios);
    $duracionTotal = (int)$stmtServ->fetchColumn();

    if ($duracionTotal === 0) {
        echo json_encode(["status" => "error", "mensaje" => "Servicios no válidos."]);
        exit();
    }

    // 2. Calcular hora_fin deseada
    $inicioDT = new DateTime("$fecha $hora_inicio");
    $finDT    = (clone $inicioDT)->modify("+$duracionTotal minutes");
    $hora_fin = $finDT->format('H:i:s');

    // 3. Comprobar si el barbero labora ese día
    $diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    $numDia = date('w', strtotime($fecha));
    $diaNombre = $diasSemana[$numDia];

    $stmtHorario = $pdo->prepare("SELECT hora_inicio, hora_fin FROM barbero_horarios WHERE id_barbero = ? AND dia_semana = ?");
    $stmtHorario->execute([$id_barbero, $diaNombre]);
    $jornada = $stmtHorario->fetch();

    if (!$jornada) {
        echo json_encode(["disponible" => false, "mensaje" => "El barbero no labora el día $diaNombre."]);
        exit();
    }

    if ($hora_inicio < $jornada['hora_inicio'] || $hora_fin > $jornada['hora_fin']) {
        echo json_encode(["disponible" => false, "mensaje" => "El rango solicitado sobrepasa el horario del barbero."]);
        exit();
    }

    // 4. Verificar solapamiento exacto
    $stmtCheck = $pdo->prepare("
        SELECT id_cita, hora_inicio, hora_fin 
        FROM citas 
        WHERE id_barbero = ? AND fecha = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
          AND (? < hora_fin AND ? > hora_inicio)
    ");
    $stmtCheck->execute([$id_barbero, $fecha, $hora_inicio, $hora_fin]);
    $colisiones = $stmtCheck->fetchAll();

    if (count($colisiones) === 0) {
        echo json_encode([
            "disponible" => true,
            "hora_inicio" => $hora_inicio,
            "hora_fin" => $hora_fin,
            "duracion_minutos" => $duracionTotal
        ]);
        exit();
    }

    // 5. SI HAY COLISIÓN: Buscar el hueco libre más cercano dentro del horario laboral
    $stmtTodas = $pdo->prepare("
        SELECT hora_inicio, hora_fin 
        FROM citas 
        WHERE id_barbero = ? AND fecha = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
        ORDER BY hora_inicio ASC
    ");
    $stmtTodas->execute([$id_barbero, $fecha]);
    $citasOcupadas = $stmtTodas->fetchAll();

    $sugerencia = calcularSugerencia($jornada, $citasOcupadas, $inicioDT, $duracionTotal);

    echo json_encode([
        "disponible" => false,
        "mensaje" => "La franja seleccionada ya está ocupada.",
        "sugerencia" => $sugerencia
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al validar: " . $e->getMessage()]);
}

function calcularSugerencia($jornada, $citas, $deseadoDT, $duracion) {
    $apertura = strtotime($jornada['hora_inicio']);
    $cierre   = strtotime($jornada['hora_fin']);
    $deseado  = $deseadoDT->getTimestamp();
    $duracionSec = $duracion * 60;

    $huecos = [];
    $puntero = $apertura;

    foreach ($citas as $c) {
        $inicioCita = strtotime($c['hora_inicio']);
        $finCita    = strtotime($c['hora_fin']);

        if (($inicioCita - $puntero) >= $duracionSec) {
            $huecos[] = ['inicio' => $puntero, 'fin' => $puntero + $duracionSec];
        }
        if ($finCita > $puntero) {
            $puntero = $finCita;
        }
    }

    if (($cierre - $puntero) >= $duracionSec) {
        $huecos[] = ['inicio' => $puntero, 'fin' => $puntero + $duracionSec];
    }

    if (empty($huecos)) return null;

    usort($huecos, function($a, $b) use ($deseado) {
        return abs($a['inicio'] - $deseado) - abs($b['inicio'] - $deseado);
    });

    return [
        "hora_inicio_sugerida" => date('H:i:s', $huecos[0]['inicio']),
        "hora_fin_sugerida"    => date('H:i:s', $huecos[0]['fin']),
        "duracion_minutos"     => $duracion
    ];
}