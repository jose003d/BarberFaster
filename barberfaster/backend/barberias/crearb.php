<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 2: Recepción de datos del formulario
    // ==========================
    $nombre    = $_POST['nombre']    ?? '';
    $direccion = $_POST['direccion'] ?? '';
    $ciudad    = $_POST['ciudad']    ?? '';
    $telefono  = $_POST['telefono']  ?? '';
    $estado    = $_POST['estado']    ?? 1;

    // ==========================
    // BLOQUE 3: Manejo de subida de imagen
    // ==========================
    $fotoNombre = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $targetDir = __DIR__ . "/../uploads/";

        // Crear directorio si no existe
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        // Generar nombre único para la foto
        $extension  = strtolower(pathinfo($_FILES["foto"]["name"], PATHINFO_EXTENSION));
        $fotoNombre = time() . "_" . uniqid() . "." . $extension;

        // Mover archivo al directorio de destino
        if (!move_uploaded_file($_FILES["foto"]["tmp_name"], $targetDir . $fotoNombre)) {
            throw new Exception("No se pudo guardar la imagen.");
        }
    }

    // ==========================
    // BLOQUE 4: Inserción en la base de datos
    // ==========================
    $sql = "INSERT INTO barberias (nombre, direccion, ciudad, telefono, estado, fotos) 
            VALUES (:nombre, :direccion, :ciudad, :telefono, :estado, :fotos)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre'    => $nombre,
        ':direccion' => $direccion,
        ':ciudad'    => $ciudad,
        ':telefono'  => $telefono,
        ':estado'    => $estado,
        ':fotos'     => $fotoNombre
    ]);

    // ==========================
    // BLOQUE 5: Respuesta en formato JSON
    // ==========================
    echo json_encode([
        "success"     => true,
        "id_barberia" => (int) $pdo->lastInsertId(),
        "nombre"      => $nombre,
        "direccion"   => $direccion,
        "ciudad"      => $ciudad,
        "telefono"    => $telefono,
        "estado"      => $estado,
        "fotos"       => $fotoNombre
    ]);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 6: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
