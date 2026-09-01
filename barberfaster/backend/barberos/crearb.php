<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $id_usuario   = $data['id_usuario']   ?? null;
    $id_barberia  = $data['id_barberia']  ?? null;
    $especialidad = $data['especialidad'] ?? '';

    if (!$id_usuario || !$id_barberia) {
        echo json_encode([
            "success" => false,
            "error"   => "Faltan datos obligatorios (id_usuario o id_barberia)"
        ]);
        exit;
    }

    $sql = "INSERT INTO barberos (id_usuario, id_barberia, especialidad) 
            VALUES (:id_usuario, :id_barberia, :especialidad)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_usuario'   => $id_usuario,
        ':id_barberia'  => $id_barberia,
        ':especialidad' => $especialidad,
    ]);

    $id_barbero = $pdo->lastInsertId();
    echo json_encode([
        "success"    => true,
        "id_barbero" => (int)$id_barbero
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}
