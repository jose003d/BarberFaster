<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$solo_activas = $_GET['activas'] ?? 'true';

try {
    $sql = "SELECT id_barberia, nombre, direccion, ciudad, telefono, estado, foto FROM barberias";

    if ($solo_activas === 'true') {
        $sql .= " WHERE estado = 'ACTIVA'";
    }

    $sql .= " ORDER BY nombre ASC";

    $stmt = $pdo->query($sql);
    $barberias = $stmt->fetchAll();

    echo json_encode([
        "status" => "success",
        "datos" => $barberias,
        "barberias" => $barberias
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al listar barberías: " . $e->getMessage()
    ]);
}
