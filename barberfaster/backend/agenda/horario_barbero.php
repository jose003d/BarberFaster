<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['success' => true, 'horario' => null, 'message' => 'La agenda se define mediante eventos de rango']);
    exit;
}
http_response_code(410);
echo json_encode(['success' => false, 'error' => 'La configuración por bloques fijos fue retirada; cree eventos con start_datetime y end_datetime']);
