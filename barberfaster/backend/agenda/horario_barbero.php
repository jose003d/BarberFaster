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
// BLOQUE 2: Creación de tabla si no existe
// ==========================
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS barbero_horarios (
        id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
        id_barbero INT NOT NULL,
        dias_semana VARCHAR(50) NOT NULL DEFAULT '',
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        intervalo_minutos INT NOT NULL DEFAULT 30,
        estado TINYINT(1) NOT NULL DEFAULT 1,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_barbero_horario (id_barbero)
    )");
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
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

        // Obtener configuración de horario
        $configStmt = $pdo->prepare("SELECT dias_semana, hora_inicio, hora_fin, intervalo_minutos FROM barbero_horarios WHERE id_barbero = :id_barbero LIMIT 1");
        $configStmt->execute([":id_barbero" => $barbero['id_barbero']]);
        $config = $configStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "horario" => $config ? [
                "dias_semana" => normalizeDays($config['dias_semana']),
                "hora_inicio" => $config['hora_inicio'],
                "hora_fin" => $config['hora_fin'],
                "intervalo_minutos" => (int)$config['intervalo_minutos'],
            ] : [
                "dias_semana" => [],
                "hora_inicio" => "09:00",
                "hora_fin" => "19:00",
                "intervalo_minutos" => 30,
            ]
        ]);
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
    // BLOQUE 8: Validación y guardado de configuración
    // ==========================
    $dias = normalizeDays($data['dias_semana'] ?? []);
    if (empty($dias)) {
        echo json_encode(["success" => false, "error" => "Selecciona al menos un día"]);
        exit;
    }

    $horaInicio = $data['hora_inicio'] ?? '09:00';
    $horaFin    = $data['hora_fin'] ?? '19:00';
    $intervalo  = max(10, (int)($data['intervalo_minutos'] ?? 30));

    // Insertar o actualizar configuración
    $existing = $pdo->prepare("SELECT id_configuracion FROM barbero_horarios WHERE id_barbero = :id_barbero LIMIT 1");
    $existing->execute([":id_barbero" => $barbero['id_barbero']]);
    $config = $existing->fetch(PDO::FETCH_ASSOC);

    if ($config) {
        $saveStmt = $pdo->prepare("UPDATE barbero_horarios SET dias_semana = :dias_semana, hora_inicio = :hora_inicio, hora_fin = :hora_fin, intervalo_minutos = :intervalo WHERE id_barbero = :id_barbero");
    } else {
        $saveStmt = $pdo->prepare("INSERT INTO barbero_horarios (id_barbero, dias_semana, hora_inicio, hora_fin, intervalo_minutos) VALUES (:id_barbero, :dias_semana, :hora_inicio, :hora_fin, :intervalo)");
    }

    $saveStmt->execute([
        ":id_barbero" => $barbero['id_barbero'],
        ":dias_semana" => implode(',', $dias),
        ":hora_inicio" => $horaInicio,
        ":hora_fin"    => $horaFin,
        ":intervalo"   => $intervalo,
    ]);

    // ==========================
    // BLOQUE 9: Regeneración de eventos disponibles
    // ==========================
    $deleteStmt = $pdo->prepare("DELETE FROM eventos WHERE id_barbero = :id_barbero AND disponible = 1 AND start_datetime >= NOW()");
    $deleteStmt->execute([":id_barbero" => $barbero['id_barbero']]);

    $startDate = new DateTime('today');
    $endDate   = (new DateTime('today'))->modify('+90 days');
    $period    = new DatePeriod($startDate, new DateInterval('P1D'), $endDate);

    $insertStmt = $pdo->prepare("INSERT INTO eventos (id_barbero, id_barberia, start_datetime, end_datetime, disponible) VALUES (:id_barbero, :id_barberia, :start_datetime, :end_datetime, 1)");

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

