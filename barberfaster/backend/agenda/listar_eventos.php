<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y conexión
// ==========================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

// ==========================
// BLOQUE 2: Validación de parámetros de entrada
// ==========================
$id_barbero = $_GET['id_barbero'] ?? null;
if (!$id_barbero) {
    echo json_encode([]);
    exit;
}

try {
    // ==========================
    // BLOQUE 3: Consulta de eventos futuros del barbero
    // ==========================
    $sql = "
        SELECT id_evento, titulo, start_datetime, end_datetime, disponible, tipo, color
        FROM eventos
        WHERE id_barbero = :id_barbero
        AND start_datetime >= NOW()
        ORDER BY start_datetime ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_barbero' => $id_barbero]);
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==========================
    // BLOQUE 4: Formateo de resultados para FullCalendar
    // ==========================
    $resultado = array_map(function($e) {
        return [
            'id'    => $e['id_evento'],
            'title' => $e['disponible'] ? '✅ Disponible' : '❌ Ocupado',
            'start' => $e['start_datetime'],
            'end'   => $e['end_datetime'],
            'color' => $e['disponible'] ? '#16a34a' : '#dc2626',
            'extendedProps' => [
                'disponible' => (bool)$e['disponible'],
                'tipo'       => $e['tipo'],
            ]
        ];
    }, $eventos);

    // ==========================
    // BLOQUE 5: Respuesta en formato JSON
    // ==========================
    echo json_encode($resultado);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 6: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
