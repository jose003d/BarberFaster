<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";
$idBarbero = (int) ($_GET['id_barbero'] ?? 0);
if (!$idBarbero) { echo json_encode([]); exit; }
$fecha = trim((string) ($_GET['fecha'] ?? ''));
$sql = "SELECT id_evento, start_datetime, end_datetime, estado_disponibilidad FROM eventos WHERE id_barbero = :barbero";
$params = [':barbero' => $idBarbero];
if ($fecha !== '') { $sql .= " AND DATE(start_datetime) = :fecha"; $params[':fecha'] = $fecha; }
$sql .= " ORDER BY start_datetime";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$eventos = array_map(static function (array $evento): array {
    $disponible = ($evento['estado_disponibilidad'] ?? '') === 'DISPONIBLE';
    return [
        'id' => $evento['id_evento'],
        'title' => $disponible ? 'Disponible' : 'Ocupado',
        'start' => $evento['start_datetime'],
        'end' => $evento['end_datetime'],
        'color' => $disponible ? '#16a34a' : '#dc2626',
        'extendedProps' => [
            'disponible' => $disponible,
            'estado_disponibilidad' => $evento['estado_disponibilidad'] ?? null,
        ],
    ];
}, $stmt->fetchAll(PDO::FETCH_ASSOC));

echo json_encode($eventos);
