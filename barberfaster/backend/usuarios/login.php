<?php
// backend/usuarios/login.php
// Este archivo autentica a un usuario/barbero con correo y contraseña.
// En el código actual, aparentemente valida usando el nombre y no la contraseña real.

// Permite que el frontend haga peticiones desde otro origen.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a peticiones OPTIONS para evitar errores de CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON del request.
$data = json_decode(file_get_contents("php://input"), true);

// Obtiene email y password del request.
$email    = $data['email'] ?? null;
$password = $data['password'] ?? null;

// Valida que ambos campos lleguen completos.
if (!$email || !$password) {
    echo json_encode(["status" => "error", "mensaje" => "Correo y contraseña son obligatorios."]);
    exit();
}

try {
    // Busca un barbero activo cuyo nombre coincida con el email recibido.
    // Nota: este código no compara la contraseña real; solo valida el nombre y estado.
    $stmt = $pdo->prepare("
        SELECT b.id_barbero, b.id_barberia, b.nombre, b.especialidad, b.estado 
        FROM barberos b 
        WHERE b.nombre = ? AND b.estado = 'ACTIVO'
    ");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if ($usuario) {
        // Si encontró el usuario, responde éxito y devuelve sus datos básicos.
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
        // Si no existe o está inactivo, responde error.
        echo json_encode(["status" => "error", "mensaje" => "Credenciales inválidas o usuario inactivo."]);
    }
} catch (Exception $e) {
    // Si falla la consulta, devuelve el detalle del error.
    echo json_encode(["status" => "error", "mensaje" => "Error en el inicio de sesión: " . $e->getMessage()]);
}