<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(["success" => false, "message" => "Método no permitido"]); exit; }

require_once "../config/database.php";
 $datos = json_decode(file_get_contents("php://input"), true);

 $camposObligatorios = ['nombre', 'direccion', 'ciudad', 'contacto_representante', 'nombre_representante'];
foreach ($camposObligatorios as $campo) {
    if (empty(trim($datos[$campo] ?? ''))) {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

try {
    $sql = "INSERT INTO barberias (nombre, descripcion, direccion, ciudad, latitud, longitud, telefono_barberia, calificacion_promedio, estado, contacto_representante, nombre_representante) 
            VALUES (:nombre, :descripcion, :direccion, :ciudad, :latitud, :longitud, :telefono_barberia, :calificacion_promedio, :estado, :contacto_representante, :nombre_representante)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre'                => trim($datos['nombre']),
        ':descripcion'           => trim($datos['descripcion'] ?? null),
        ':direccion'             => trim($datos['direccion']),
        ':ciudad'                => trim($datos['ciudad']),
        ':latitud'               => !empty($datos['latitud']) ? floatval($datos['latitud']) : null,
        ':longitud'              => !empty($datos['longitud']) ? floatval($datos['longitud']) : null,
        ':telefono_barberia'     => trim($datos['telefono_barberia'] ?? null),
        ':calificacion_promedio' => !empty($datos['calificacion_promedio']) ? floatval($datos['calificacion_promedio']) : 0.00,
        ':estado'                => trim($datos['estado'] ?? 'ACTIVO'),
        ':contacto_representante'=> trim($datos['contacto_representante']),
        ':nombre_representante'  => trim($datos['nombre_representante'])
    ]);

    echo json_encode(["success" => true, "message" => "Barbería creada", "id" => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al guardar barbería"]);
}