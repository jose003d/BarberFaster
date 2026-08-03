<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config/database.php";
 $data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id_barbero'])) {
    echo json_encode(["success" => false, "message" => "ID de barbero requerido"]);
    exit;
}

 $camposObligatorios = ['id_barberia', 'especialidad', 'presentacion', 'nombre', 'telefono'];
foreach ($camposObligatorios as $campo) {
    if (empty(trim($data[$campo] ?? '')) && $data[$campo] !== 0) {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

try {
    $sql = "UPDATE barberos SET 
                id_barberia = :id_barberia, 
                especialidad = :especialidad, 
                presentacion = :presentacion, 
                nombre = :nombre, 
                telefono = :telefono
            WHERE id_barbero = :id_barbero";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":id_barbero"   => $data['id_barbero'],
        ":id_barberia"  => intval($data['id_barberia']),
        ":especialidad" => trim($data['especialidad']),
        ":presentacion" => trim($data['presentacion']),
        ":nombre"       => trim($data['nombre']),
        ":telefono"     => trim($data['telefono'])
    ]);

    echo json_encode(["success" => true, "message" => "Barbero actualizado correctamente"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al actualizar en la base de datos"]);
}