<?php
// backend/usuarios/login.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$email    = $data['email'] ?? null;
$password = $data['password'] ?? null;

if (!$email || !$password) {
    echo json_encode(["status" => "error", "mensaje" => "Correo y contraseña son obligatorios."]);
    exit();
}

try {
    // Buscar en la tabla de barberos o usuarios según el correo
    $stmt = $pdo->prepare("
        SELECT b.id_barbero, b.id_barberia, b.nombre, b.especialidad, b.estado 
        FROM barberos b 
        WHERE b.nombre = ? AND b.estado = 'ACTIVO'
    ");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if ($usuario) {
        echo json_encode([
            "status" => "success",
            "mensaje" => "Inicio de sesión exitoso.",
            "usuario" => [
                "id_barbero"  => $usuario['id_barbero'],
                "id_barberia" => $usuario['id_barberia'],
                "nombre"      => $usuario['nombre'],
                "rol"         => "BARBERO"
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "mensaje" => "Credenciales inválidas o usuario inactivo."]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error en el inicio de sesión: " . $e->getMessage()]);
}