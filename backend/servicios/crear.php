<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(["success" => false, "message" => "Método no permitido"]); exit; }

require_once "../config/database.php";
 $datos = json_decode(file_get_contents("php://input"), true);

 $camposObligatorios = ['id_barberia', 'nombre', 'precio', 'duracion_minutos'];
foreach ($camposObligatorios as $campo) {
    if (!isset($datos[$campo]) || ($datos[$campo] === '' && $datos[$campo] !== 0)) {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

if (!is_numeric($datos['precio']) || $datos['precio'] < 0) {
    echo json_encode(["success" => false, "message" => "El precio debe ser un número válido"]);
    exit;
}

try {
    $sql = "INSERT INTO servicios (id_barberia, nombre, descripcion, precio, duracion_minutos, activo) 
            VALUES (:id_barberia, :nombre, :descripcion, :precio, :duracion_minutos, :activo)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_barberia'       => intval($datos['id_barberia']),
        ':nombre'            => trim($datos['nombre']),
        ':descripcion'       => trim($datos['descripcion'] ?? null),
        ':precio'            => floatval($datos['precio']),
        ':duracion_minutos'  => intval($datos['duracion_minutos']),
        ':activo'            => isset($datos['activo']) ? intval($datos['activo']) : 1
    ]);

    echo json_encode(["success" => true, "message" => "Servicio creado", "id" => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al guardar servicio"]);
}