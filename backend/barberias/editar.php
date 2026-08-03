<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config/database.php";
 $data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id_barberia'])) {
    echo json_encode(["success" => false, "message" => "ID de barbería requerido"]);
    exit;
}

 $camposObligatorios = ['nombre', 'direccion', 'ciudad', 'contacto_representante', 'nombre_representante'];
foreach ($camposObligatorios as $campo) {
    if (empty(trim($data[$campo] ?? ''))) {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

try {
    $sql = "UPDATE barberias SET 
                nombre = :nombre, 
                descripcion = :descripcion, 
                direccion = :direccion, 
                ciudad = :city, 
                latitud = :latitud, 
                longitud = :longitud, 
                telefono_barberia = :telefono_barberia, 
                calificacion_promedio = :calificacion_promedio, 
                estado = :estado, 
                contacto_representante = :contacto_representante, 
                nombre_representante = :nombre_representante
            WHERE id_barberia = :id_barberia";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":id_barberia"           => $data['id_barberia'],
        ":nombre"                => trim($data['nombre']),
        ":descripcion"           => trim($data['descripcion'] ?? null),
        ":direccion"             => trim($data['direccion']),
        ":city"                  => trim($data['ciudad']),
        ":latitud"               => !empty($data['latitud']) ? floatval($data['latitud']) : null,
        ":longitud"              => !empty($data['longitud']) ? floatval($data['longitud']) : null,
        ":telefono_barberia"     => trim($data['telefono_barberia'] ?? null),
        ":calificacion_promedio" => !empty($data['calificacion_promedio']) ? floatval($data['calificacion_promedio']) : 0.00,
        ":estado"                => trim($data['estado'] ?? 'ACTIVO'),
        ":contacto_representante"=> trim($data['contacto_representante']),
        ":nombre_representante"  => trim($data['nombre_representante'])
    ]);

    echo json_encode(["success" => true, "message" => "Barbería actualizada correctamente"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al actualizar en la base de datos"]);
}