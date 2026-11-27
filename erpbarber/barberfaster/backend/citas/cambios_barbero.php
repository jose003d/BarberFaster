<?php
// Consulta liviana para la agenda en vivo del barbero (?fecha=YYYY-MM-DD; hoy por defecto).
//
// El hosting compartido no puede mantener WebSockets abiertos, así que la agenda pregunta
// cada pocos segundos "¿cambió algo?". Este endpoint responde solo una huella del día
// (un resumen de IDs, estados y horas). La página vuelve a pedir la lista completa
// a listar_barbero_perfil.php únicamente cuando la huella cambia.

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    $usuario = requerirRol($pdo, ['BARBERO']);

    $ahora = new DateTimeImmutable('now', new DateTimeZone('America/Bogota'));
    $fecha = (string) ($_GET['fecha'] ?? $ahora->format('Y-m-d'));
    $fechaValida = DateTimeImmutable::createFromFormat('!Y-m-d', $fecha);
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'La fecha indicada no es válida.']);
        exit();
    }

    // Cualquier cita nueva, cancelada, confirmada, completada o movida cambia este texto.
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS total,
               COALESCE(GROUP_CONCAT(CONCAT(id_cita, ':', estado, ':', hora_inicio) ORDER BY id_cita SEPARATOR '|'), '') AS resumen
        FROM citas
        WHERE id_barbero = ? AND fecha = ?
    ");
    $stmt->execute([$usuario['id_usuario'], $fecha]);
    $fila = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'huella' => md5($fecha . '#' . $fila['total'] . '#' . $fila['resumen']),
    ]);
} catch (Throwable $error) {
    error_log('Error al revisar cambios de la agenda del barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo revisar la agenda.']);
}
