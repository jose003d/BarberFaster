<?php
// backend/barberos/atender_clientes.php
// Permite al ADMINISTRADOR indicar si él mismo también atiende clientes.
// Si lo activa, aparece como barbero de su barbería (reservas, horarios, servicios,
// agenda y métricas) usando su misma cuenta, sin crear un usuario BARBERO aparte.
//   GET  -> { status, atiende_clientes }
//   POST { atiende_clientes: true|false } -> { status, mensaje, atiende_clientes }
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare('SELECT atiende_clientes FROM usuarios WHERE id_usuario = :id_usuario LIMIT 1');
        $stmt->execute([':id_usuario' => $usuario['id_usuario']]);
        echo json_encode([
            'status' => 'success',
            'atiende_clientes' => (bool) $stmt->fetchColumn(),
        ]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
        exit();
    }

    $datos = json_decode(file_get_contents('php://input'), true);
    if (!is_array($datos) || !is_bool($datos['atiende_clientes'] ?? null)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica si atiendes clientes (sí o no).']);
        exit();
    }
    $atiende = $datos['atiende_clientes'];

    $stmt = $pdo->prepare('UPDATE usuarios SET atiende_clientes = :atiende WHERE id_usuario = :id_usuario');
    $stmt->execute([
        ':atiende' => $atiende ? 1 : 0,
        ':id_usuario' => $usuario['id_usuario'],
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => $atiende
            ? 'Ahora apareces como barbero de tu barbería. Asígnate servicios y horario.'
            : 'Ya no apareces como barbero para reservas.',
        'atiende_clientes' => $atiende,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Error al actualizar atiende_clientes: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo guardar la opción. ¿Se ejecutó la migración atiende_clientes?'], JSON_UNESCAPED_UNICODE);
}
