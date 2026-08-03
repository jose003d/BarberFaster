<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config/database.php";
 $data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id_servicio'])) {
    echo json_encode(["success" => false, "message" => "ID de servicio requerido"]);
    exit;
}

if (empty(trim($data['nombre'] ?? ''))) {
    echo json_encode(["success" => false, "message" => "El nombre es obligatorio"]);
    exit;
}

try {
    $sql = "UPDATE servicios SET 
                id_barberia = :id_barberia, 
                nombre = :nombre, 
                descripcion = :descripcion, 
                precio = :precio, 
                duracion_minutos = :duracion_minutos, 
                activo = :activo
            WHERE id_servicio = :id_servicio";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":id_servicio"       => $data['id_servicio'],
        ":id_barberia"       => intval($data['id_barberia']),
        ":nombre"            => trim($data['nombre']),
        ":descripcion"       => trim($data['descripcion'] ?? null),
        ":precio"            => floatval($data['precio']),
        ":duracion_minutos"  => intval($data['duracion_minutos']),
        ":activo"            => isset($data['activo']) ? intval($data['activo']) : 1
    ]);

    echo json_encode(["success" => true, "message" => "Servicio actualizado correctamente"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al actualizar en la base de datos"]);
}