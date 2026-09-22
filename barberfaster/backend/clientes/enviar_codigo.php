<?php
// backend/clientes/enviar_codigo.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$telefono = $data['telefono'] ?? null;

if (!$telefono) {
    echo json_encode(["status" => "error", "mensaje" => "El número de teléfono es requerido."]);
    exit();
}

// Generar código numérico de 4 dígitos
$codigo = rand(1000, 9999);

// TODO: Integrar servicio de mensajería (Twilio, UltraMsg, API WhatsApp local, etc.)
// Por ahora simulamos la generación correcta del token en sesión/respuesta de pruebas:

echo json_encode([
    "status" => "success",
    "mensaje" => "Código de verificación enviado correctamente a " . $telefono,
    "codigo_demo" => $codigo // Solo para pruebas de desarrollo
]);