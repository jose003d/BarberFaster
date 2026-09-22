<?php
// backend/clientes/verificar_codigo.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$codigo_ingresado = $data['codigo'] ?? null;
$codigo_esperado  = $data['codigo_esperado'] ?? null;

if (!$codigo_ingresado || !$codigo_esperado) {
    echo json_encode(["status" => "error", "mensaje" => "Faltan parámetros para verificar."]);
    exit();
}

if ((string)$codigo_ingresado === (string)$codigo_esperado) {
    echo json_encode([
        "status" => "success",
        "valido" => true,
        "mensaje" => "Código verificado exitosamente."
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "valido" => false,
        "mensaje" => "El código ingresado es incorrecto."
    ]);
}