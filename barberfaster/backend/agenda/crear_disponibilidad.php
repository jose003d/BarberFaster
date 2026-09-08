<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
require_once "../config/database.php";

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
    $pdo->exec("CREATE TABLE IF NOT EXISTS barbero_horarios (
        id_barbero INT NOT NULL PRIMARY KEY,
        id_barberia INT NOT NULL,
        dias_semana VARCHAR(50) NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        intervalo_minutos INT NOT NULL DEFAULT 30,
        actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_barbero_horario_barbero FOREIGN KEY (id_barbero) REFERENCES barberos(id_barbero) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
} catch (Exception $e) {
    // Ignorar si la tabla ya existe.
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $id_barbero = $data['id_barbero'] ?? null;
    $id_barberia = $data['id_barberia'] ?? null;
    $dias = normalizeDays($data['dias_semana'] ?? []);
    $horaInicio = $data['hora_inicio'] ?? '09:00';
    $horaFin = $data['hora_fin'] ?? '19:00';
    $intervalo = max(10, (int)($data['intervalo_minutos'] ?? 30));

    if (!$id_barbero || !$id_barberia || empty($dias)) {
        echo json_encode(["success" => false, "error" => "Faltan datos para guardar la disponibilidad"]);
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
        ':id_barbero' => $id_barbero,
        ':id_barberia' => $id_barberia,
        ':dias_semana' => implode(',', $dias),
        ':hora_inicio' => $horaInicio,
        ':hora_fin' => $horaFin,
        ':intervalo_minutos' => $intervalo,
    ]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
