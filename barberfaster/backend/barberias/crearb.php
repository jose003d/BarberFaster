<?php
// -----------------------------------------------------------------------------
// Endpoint: crearb.php
// -----------------------------------------------------------------------------
// Este archivo recibe los datos de una barbería, los valida y crea un nuevo
// registro en la base de datos.

// -----------------------------------------------------------------------------
// 1. Configuración de la respuesta HTTP y CORS
// -----------------------------------------------------------------------------
// Permite que el frontend realice peticiones desde otro dominio o puerto.
header("Access-Control-Allow-Origin: *");
// Permite que el frontend envíe información mediante la cabecera Content-Type.
header("Access-Control-Allow-Headers: Content-Type");
// Indica que las respuestas se devolverán como JSON usando codificación UTF-8.
header("Content-Type: application/json; charset=UTF-8");

// Importa la conexión PDO con la base de datos.
require_once '../config/database.php';

// -----------------------------------------------------------------------------
// 2. Manejo de la solicitud OPTIONS
// -----------------------------------------------------------------------------
// El navegador puede enviar OPTIONS como comprobación previa de CORS.
// Se responde sin intentar crear ningún registro.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -----------------------------------------------------------------------------
// 3. Lectura de los datos recibidos
// -----------------------------------------------------------------------------
// Lee el cuerpo de la petición y convierte el JSON recibido en un arreglo PHP.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae los datos de la barbería. Si una clave no existe, se asigna null.
$nombre    = $data['nombre'] ?? null;
$direccion = $data['direccion'] ?? null;
$ciudad    = $data['ciudad'] ?? null;
$telefono  = $data['telefono'] ?? null;
$foto      = $data['foto'] ?? null;

// -----------------------------------------------------------------------------
// 4. Validación de campos obligatorios
// -----------------------------------------------------------------------------
// La foto es opcional, pero los demás datos son necesarios para registrar
// correctamente la barbería.
if (!$nombre || !$direccion || !$ciudad || !$telefono) {
    echo json_encode(["status" => "error", "mensaje" => "Nombre, dirección, ciudad y teléfono son obligatorios."]);
    exit();
}

try {
    // -------------------------------------------------------------------------
    // 5. Inserción de la barbería
    // -------------------------------------------------------------------------
    // La consulta preparada utiliza marcadores ? para evitar insertar
    // directamente los datos recibidos desde el frontend en el SQL.
    // La barbería se crea inicialmente con estado ACTIVA.
    $stmt = $pdo->prepare("
        INSERT INTO barberias (nombre, direccion, ciudad, telefono, foto, estado)
        VALUES (?, ?, ?, ?, ?, 'ACTIVA')
    ");

    // Sustituye los marcadores por los valores recibidos y ejecuta el INSERT.
    $stmt->execute([$nombre, $direccion, $ciudad, $telefono, $foto]);

    // -------------------------------------------------------------------------
    // 6. Respuesta de operación exitosa
    // -------------------------------------------------------------------------
    // lastInsertId() obtiene el identificador generado para la nueva barbería.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Barbería registrada correctamente.",
        "id_barberia" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    // -------------------------------------------------------------------------
    // 7. Manejo de errores
    // -------------------------------------------------------------------------
    // Si ocurre un error durante la consulta, se devuelve una respuesta JSON
    // indicando que el registro no pudo crearse.
    echo json_encode(["status" => "error", "mensaje" => "Error al crear barbería: " . $e->getMessage()]);
}