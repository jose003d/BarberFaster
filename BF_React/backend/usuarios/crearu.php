<?php
// backend/usuarios/crearu.php
// Este archivo crea un usuario/barbero asociado a una barbería.
// En este proyecto, lo usan para registrar un barbero como empleado o usuario del sistema.

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a OPTIONS para evitar errores de CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON que llega desde el frontend.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae los campos del nuevo registro.
$id_barberia = $data['id_barberia'] ?? null;
$nombre      = $data['nombre'] ?? null;
$especialidad= $data['especialidad'] ?? 'Barbero Profesional';

// Valida que la barbería y el nombre vengan completos.
if (!$id_barberia || !$nombre) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la barbería y el nombre son requeridos."]);
    exit();
}

try {
    // Inserta el nuevo barbero en la tabla barberos con estado ACTIVO.
    $stmt = $pdo->prepare("
        INSERT INTO barberos (id_barberia, nombre, especialidad, estado)
        VALUES (?, ?, ?, 'ACTIVO')
    ");
    $stmt->execute([$id_barberia, $nombre, $especialidad]);

    // Devuelve éxito y el ID generado.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Usuario/Barbero registrado exitosamente.",
        "id_barbero" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    // Retorna el error si la inserción falla.
    echo json_encode(["status" => "error", "mensaje" => "Error al registrar usuario: " . $e->getMessage()]);
}