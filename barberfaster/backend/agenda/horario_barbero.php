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
// BLOQUE 2: Funciones auxiliares
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

function resolveBarbero($pdo, $id_usuario = null, $id_barbero = null) {
    if ($id_usuario) {
        $stmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos WHERE id_usuario = :id_usuario LIMIT 1");
        $stmt->execute([":id_usuario" => $id_usuario]);
        $barbero = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($barbero) {
            return $barbero;
        }
    }

    if ($id_barbero) {
        $stmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos WHERE id_barbero = :id_barbero LIMIT 1");
        $stmt->execute([":id_barbero" => $id_barbero]);
        $barbero = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($barbero) {
            return $barbero;
        }
    }

    $stmt = $pdo->prepare("SELECT id_barbero, id_barberia FROM barberos ORDER BY id_barbero LIMIT 1");
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS barbero_horarios (
        id_barbero INT NOT NULL PRIMARY KEY,
        id_barberia INT NOT NULL,
        dias_semana VARCHAR(50) NOT NULL DEFAULT '',
        hora_inicio TIME NOT NULL DEFAULT '09:00:00',
        hora_fin TIME NOT NULL DEFAULT '19:00:00',
        intervalo_minutos INT NOT NULL DEFAULT 30,
        actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_barbero_horario_barbero FOREIGN KEY (id_barbero) REFERENCES barberos(id_barbero) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
} catch (Exception $e) {
    // Ignorar errores si la tabla ya existe o no se puede crear en entornos antiguos.
}

try {
    // ==========================
    // BLOQUE 3: Recepción de parámetros
    // ==========================
    $id_usuario = $_GET['id_usuario'] ?? null;
    $id_barbero = $_GET['id_barbero'] ?? null;

    // ==========================
    // BLOQUE 4: Método GET → obtener configuración del horario desde barbero_horarios
    // ==========================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!$id_usuario && !$id_barbero) {
            echo json_encode(["success" => false, "error" => "Falta el id del usuario o del barbero"]);
            exit;
        }

        $barbero = resolveBarbero($pdo, $id_usuario, $id_barbero);
        if (!$barbero) {
            echo json_encode(["success" => false, "error" => "No se encontró un barbero asociado"]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT dias_semana, hora_inicio, hora_fin, intervalo_minutos FROM barbero_horarios WHERE id_barbero = :id_barbero LIMIT 1");
        $stmt->execute([":id_barbero" => $barbero['id_barbero']]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        $horario = [
            "dias_semana" => [],
            "hora_inicio" => "09:00",
            "hora_fin" => "19:00",
            "intervalo_minutos" => 30,
        ];

        if ($config) {
            $diasSemana = normalizeDays($config['dias_semana'] ?? []);
            if (!empty($diasSemana)) {
                $horario['dias_semana'] = $diasSemana;
            }

            if (!empty($config['hora_inicio'])) {
                $horario['hora_inicio'] = substr($config['hora_inicio'], 0, 5);
            }
            if (!empty($config['hora_fin'])) {
                $horario['hora_fin'] = substr($config['hora_fin'], 0, 5);
            }
            if (!empty($config['intervalo_minutos'])) {
                $horario['intervalo_minutos'] = (int)$config['intervalo_minutos'];
            }
        }

        echo json_encode(["success" => true, "horario" => $horario]);
        exit;
    }

    // ==========================
    // BLOQUE 5: Validación de método POST
    // ==========================
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "error" => "Método no permitido"]);
        exit;
    }

    // ==========================
    // BLOQUE 6: Procesamiento de datos POST
    // ==========================
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        echo json_encode(["success" => false, "error" => "JSON inválido"]);
        exit;
    }

    $id_usuario = $data['id_usuario'] ?? null;
    $id_barbero = $data['id_barbero'] ?? null;

    if (!$id_usuario && !$id_barbero) {
        echo json_encode(["success" => false, "error" => "Falta el id del usuario o del barbero"]);
        exit;
    }

    $barbero = resolveBarbero($pdo, $id_usuario, $id_barbero);
    if (!$barbero) {
        echo json_encode(["success" => false, "error" => "No se encontró un barbero asociado"]);
        exit;
    }

    // ==========================
    // BLOQUE 7: Validación y guardado en la tabla dedicada
    // ==========================
    $dias = normalizeDays($data['dias_semana'] ?? []);
    if (empty($dias)) {
        echo json_encode(["success" => false, "error" => "Selecciona al menos un día"]);
        exit;
    }

    $horaInicio = trim((string)($data['hora_inicio'] ?? '09:00'));
    $horaFin = trim((string)($data['hora_fin'] ?? '19:00'));
    $intervalo = max(10, (int)($data['intervalo_minutos'] ?? 30));

    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $horaInicio) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $horaFin)) {
        echo json_encode(["success" => false, "error" => "Las horas deben tener formato HH:MM"]);
        exit;
    }

    if ($horaInicio >= $horaFin) {
        echo json_encode(["success" => false, "error" => "La hora de inicio debe ser menor que la de fin"]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO barbero_horarios (id_barbero, id_barberia, dias_semana, hora_inicio, hora_fin, intervalo_minutos, actualizado_en)
        VALUES (:id_barbero, :id_barberia, :dias_semana, :hora_inicio, :hora_fin, :intervalo_minutos, NOW())
        ON DUPLICATE KEY UPDATE
            id_barberia = VALUES(id_barberia),
            dias_semana = VALUES(dias_semana),
            hora_inicio = VALUES(hora_inicio),
            hora_fin = VALUES(hora_fin),
            intervalo_minutos = VALUES(intervalo_minutos),
            actualizado_en = NOW()
    ");

    $stmt->execute([
        ':id_barbero' => $barbero['id_barbero'],
        ':id_barberia' => $barbero['id_barberia'],
        ':dias_semana' => implode(',', $dias),
        ':hora_inicio' => $horaInicio,
        ':hora_fin' => $horaFin,
        ':intervalo_minutos' => $intervalo,
    ]);

    echo json_encode(["success" => true, "message" => "Horario guardado correctamente"]);
    exit;
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

