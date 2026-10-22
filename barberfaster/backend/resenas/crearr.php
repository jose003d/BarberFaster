<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../verificacion/comun.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método no permitido.');
}

$datos = obtenerJsonBody();
$tokenSesion = isset($datos['sesion_cliente']) && is_string($datos['sesion_cliente'])
    ? $datos['sesion_cliente']
    : null;

try {
    $cliente = obtenerClienteAutenticado($pdo, $tokenSesion);
} catch (Throwable $e) {
    error_log('Error al validar sesión para calificar cita: ' . $e->getMessage());
    responder(500, false, 'No se pudo validar la sesión del cliente.');
}
if ($cliente === false) {
    responder(401, false, 'La sesión venció o los datos no coinciden. Verifica nuevamente tu WhatsApp.');
}

$idCita = filter_var($datos['id_cita'] ?? null, FILTER_VALIDATE_INT);
$calificacion = filter_var($datos['calificacion'] ?? null, FILTER_VALIDATE_INT);
if ($idCita === false || $idCita < 1 || $calificacion === false || $calificacion < 1 || $calificacion > 5) {
    responder(400, false, 'Selecciona una cita y una calificación de 1 a 5 estrellas.');
}

try {
    $pdo->beginTransaction();

    $stmtCita = $pdo->prepare("
        SELECT id_cita
        FROM citas
        WHERE id_cita = ? AND dni_cliente = ? AND estado = 'COMPLETADA'
        FOR UPDATE
    ");
    $stmtCita->execute([$idCita, $cliente['dni']]);
    if (!$stmtCita->fetchColumn()) {
        $pdo->rollBack();
        responder(404, false, 'Solo puedes calificar una cita completada que te pertenezca.');
    }

    $stmtResena = $pdo->prepare("
        INSERT INTO resenas (id_cita, dni_cliente, calificacion)
        VALUES (?, ?, ?)
    ");
    $stmtResena->execute([$idCita, $cliente['dni'], $calificacion]);
    $pdo->commit();

    responder(201, true, 'Gracias por calificar a tu barbero.');
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ((int)($e->errorInfo[1] ?? 0) === 1062) {
        responder(409, false, 'Esta cita ya tiene una calificación.');
    }
    error_log('Error de base de datos al guardar calificación: ' . $e->getMessage());
    responder(500, false, 'No se pudo guardar la calificación.');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al guardar calificación: ' . $e->getMessage());
    responder(500, false, 'No se pudo guardar la calificación.');
}
