<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    requerirRol($pdo, ['SUPERADMIN']);
    try {
        $stmt = $pdo->prepare('SELECT dni, nombre, telefono, email AS correo, estado FROM clientes ORDER BY nombre ASC');
        $stmt->execute();
    } catch (PDOException $errorColumna) {
        // Base sin la migración 20261126210000_clientes_estado: se listan todos como activos
        // hasta que el cron de migraciones agregue la columna.
        if ($errorColumna->getCode() !== '42S22') {
            throw $errorColumna;
        }
        error_log('clientes.estado no existe todavía; se lista sin estado.');
        $stmt = $pdo->prepare("SELECT dni, nombre, telefono, email AS correo, 'ACTIVO' AS estado FROM clientes ORDER BY nombre ASC");
        $stmt->execute();
    }
    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll()]);
} catch (Throwable $error) {
    error_log('Error al listar clientes: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar los clientes.']);
}
