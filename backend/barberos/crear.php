<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(["success" => false, "message" => "Método no permitido"]); exit; }

require_once "../config/database.php";
 $datos = json_decode(file_get_contents("php://input"), true);

 $camposObligatorios = ['id_barberia', 'especialidad', 'presentacion', 'nombre', 'telefono'];
foreach ($camposObligatorios as $campo) {
    if (empty(trim($datos[$campo] ?? '')) && $datos[$campo] !== 0 && $datos[$campo] !== '0') {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

try {
    $sql = "INSERT INTO barberos (id_barberia, especialidad, presentacion, nombre, telefono) 
            VALUES (:id_barberia, :especialidad, :presentacion, :nombre, :telefono)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_barberia'  => intval($datos['id_barberia']),
        ':especialidad' => trim($datos['especialidad']),
        ':presentacion' => trim($datos['presentacion']),
        ':nombre'       => trim($datos['nombre']),
        ':telefono'     => trim($datos['telefono'])
    ]);

    echo json_encode(["success" => true, "message" => "Barbero creado", "id" => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al guardar barbero"]);
}