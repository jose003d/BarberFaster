<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

header("Content-Type: application/json");
require_once "../config/database.php";

// ==========================
// BLOQUE 2: Asegurar columnas adicionales en tabla `eventos`
// (unificamos configuración y slots en la misma tabla)
// ==========================
try {
    // Agregar columnas si no existen (silencioso en caso de ya existir)
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS intervalo INT DEFAULT 30");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS servicio VARCHAR(100) NULL");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'DISPONIBLE'");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS observaciones TEXT NULL");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS metodo_validacion VARCHAR(20) NULL");
    $pdo->exec("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado_validacion VARCHAR(20) DEFAULT 'PENDIENTE'");
} catch (Exception $e) {
    // No detener la ejecución por errores en alter (entorno viejo), pero reportar para debugging
}

// ==========================
// BLOQUE 3: Función auxiliar para normalizar días
// ==========================
function normalizeDays($value) {
    if (is_array($value)) {
        $days = array_map('intval', $value);
    } elseif (is_string($value)) {
        $parts = array_filter(array_map('trim', explode(',', $value)));
        $days = array_map('intval', $parts);
    } else {
        return [];
    }

    return array_values(array_unique(array_filter($days, function ($day) {
        return $day >= 1 && $day <= 7;
    })));
}

try {
    // ==========================
    // BLOQUE 4: Recepción de parámetros
    // ==========================
    $id_usuario = $_GET['id_usuario'] ?? null;
    $id_barbero = $_GET['id_barbero'] ?? null;

    // ==========================
    // BLOQUE 5: Método GET → Obtener configuración de horario
    // ==========================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!$id_usuario && !$id_barbero) {
            echo json_encode(["success" => false, "error" => "Falta el id del usuario o del barbero"]);
            exit;
        }

        // Buscar barbero por usuario o id directo
        $barberoStmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos WHERE id_usuario = :id_usuario LIMIT 1");
        $barberoStmt->execute([":id_usuario" => $id_usuario]);
        $barbero = $barberoStmt->fetch(PDO::FETCH_ASSOC);

        if (!$barbero && $id_barbero) {
            $barberoStmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos WHERE id_barbero = :id_barbero LIMIT 1");
            $barberoStmt->execute([":id_barbero" => $id_barbero]);
            $barbero = $barberoStmt->fetch(PDO::FETCH_ASSOC);
        }

        // Fallback: primer barbero disponible
        if (!$barbero) {
            $fallbackStmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos ORDER BY id_barbero LIMIT 1");
            $fallbackStmt->execute();
            $barbero = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$barbero) {
            echo json_encode(["success" => false, "error" => "No se encontró un barbero asociado"]);
            exit;
        }

        // Obtener configuración de horario derivada desde eventos disponibles
        $eventsStmt = $pdo->prepare("SELECT start_datetime, end_datetime, intervalo FROM eventos WHERE id_barbero = :id_barbero AND disponible = 1 AND start_datetime >= NOW() ORDER BY start_datetime ASC LIMIT 200");
        $eventsStmt->execute([":id_barbero" => $barbero['id_barbero']]);
        $events = $eventsStmt->fetchAll(PDO::FETCH_ASSOC);

        $horario = [
            "dias_semana" => [1, 2, 3, 4, 5, 6, 7],
            "hora_inicio" => "09:00",
            "hora_fin" => "19:00",
            "intervalo_minutos" => 30,
        ];

        if ($events && count($events) > 0) {
            $dias = [];
            $minTime = null;
            $maxTime = null;
            $intervals = [];
            foreach ($events as $e) {
                $dt = new DateTime($e['start_datetime']);
                $dias[(int)$dt->format('N')] = true;
                $t = $dt->format('H:i');
                if ($minTime === null || $t < $minTime) $minTime = $t;
                $endDt = new DateTime($e['end_datetime']);
                $t2 = $endDt->format('H:i');
                if ($maxTime === null || $t2 > $maxTime) $maxTime = $t2;
                if (!empty($e['intervalo'])) $intervals[] = (int)$e['intervalo'];
            }
            $horario['dias_semana'] = array_values(array_map('intval', array_keys($dias)));
            if ($minTime) $horario['hora_inicio'] = $minTime;
            if ($maxTime) $horario['hora_fin'] = $maxTime;
            if (!empty($intervals)) $horario['intervalo_minutos'] = (int)$intervals[0];
        }

        echo json_encode(["success" => true, "horario" => $horario]);
        exit;
    }

    // ==========================
    // BLOQUE 6: Validación de método POST
    // ==========================
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "error" => "Método no permitido"]);
        exit;
    }

    // ==========================
    // BLOQUE 7: Procesamiento de datos POST
    // ==========================
    $data = json_decode(file_get_contents("php://input"), true);
    $id_usuario = $data['id_usuario'] ?? null;
    $id_barbero = $data['id_barbero'] ?? null;

    if (!$id_usuario && !$id_barbero) {
        echo json_encode(["success" => false, "error" => "Falta el id del usuario o del barbero"]);
        exit;
    }

    // Buscar barbero igual que en GET
    $barberoStmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos WHERE id_usuario = :id_usuario LIMIT 1");
    $barberoStmt->execute([":id_usuario" => $id_usuario]);
    $barbero = $barberoStmt->fetch(PDO::FETCH_ASSOC);

    if (!$barbero && $id_barbero) {
        $barberoStmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos WHERE id_barbero = :id_barbero LIMIT 1");
        $barberoStmt->execute([":id_barbero" => $id_barbero]);
        $barbero = $barberoStmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$barbero) {
        $fallbackStmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos ORDER BY id_barbero LIMIT 1");
        $fallbackStmt->execute();
        $barbero = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$barbero) {
        echo json_encode(["success" => false, "error" => "No se encontró un barbero asociado"]);
        exit;
    }

    // ==========================
    // BLOQUE 8: Validación y guardado de configuración (regenerar eventos)
    // ==========================
    $dias = normalizeDays($data['dias_semana'] ?? []);
    if (empty($dias)) {
        echo json_encode(["success" => false, "error" => "Selecciona al menos un día"]);
        exit;
    }

    $horaInicio = $data['hora_inicio'] ?? '09:00';
    $horaFin    = $data['hora_fin'] ?? '19:00';
    $intervalo  = max(10, (int)($data['intervalo_minutos'] ?? 30));

    // Eliminar slots futuros disponibles y regenerar con nuevos atributos
    $deleteStmt = $pdo->prepare("DELETE FROM eventos WHERE id_barbero = :id_barbero AND disponible = 1 AND start_datetime >= NOW()");
    $deleteStmt->execute([":id_barbero" => $barbero['id_barbero']]);

    $startDate = new DateTime('today');
    $endDate   = (new DateTime('today'))->modify('+90 days');
    $period    = new DatePeriod($startDate, new DateInterval('P1D'), $endDate);

    $insertStmt = $pdo->prepare("INSERT INTO eventos (id_barbero, id_barberia, start_datetime, end_datetime, disponible, intervalo, servicio, estado, observaciones, metodo_validacion, estado_validacion, titulo, tipo, color) VALUES (:id_barbero, :id_barberia, :start_datetime, :end_datetime, 1, :intervalo, NULL, 'DISPONIBLE', NULL, NULL, 'PENDIENTE', '✅ Disponible', 'DISPONIBLE', '#16a34a')");

    foreach ($period as $date) {
        if (!in_array((int)$date->format('N'), $dias, true)) {
            continue;
        }

        $slotStart = clone $date;
        [$startHour, $startMinute] = explode(':', $horaInicio);
        $slotStart->setTime((int)$startHour, (int)$startMinute);

        $slotEnd = clone $date;
        [$endHour, $endMinute] = explode(':', $horaFin);
        $slotEnd->setTime((int)$endHour, (int)$endMinute);

        while ($slotStart < $slotEnd) {
            $slotFinish = (clone $slotStart)->modify("+{$intervalo} minutes");
            if ($slotFinish > $slotEnd) {
                break;
            }

            $insertStmt->execute([
                ":id_barbero" => $barbero['id_barbero'],
                ":id_barberia" => $barbero['id_barberia'],
                ":start_datetime" => $slotStart->format('Y-m-d H:i:s'),
                ":end_datetime" => $slotFinish->format('Y-m-d H:i:s'),
                ":intervalo" => $intervalo,
            ]);

            $slotStart = $slotFinish;
        }
    }

    echo json_encode(["success" => true, "message" => "Horario guardado y eventos regenerados"]);
    exit;
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

