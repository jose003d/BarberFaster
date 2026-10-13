<?php
// -----------------------------------------------------------------------------
// Endpoint: desactivarb.php
// -----------------------------------------------------------------------------
// Este archivo actualiza el estado de una barbería, por ejemplo, de ACTIVA a
// INACTIVA o de INACTIVA a ACTIVA.

// -----------------------------------------------------------------------------
// 1. Configuración de la respuesta HTTP y CORS
// -----------------------------------------------------------------------------
// Permite que el frontend realice peticiones desde otro dominio o puerto.
header("Access-Control-Allow-Origin: *");
// Permite enviar los datos mediante la cabecera Content-Type.
header("Access-Control-Allow-Headers: Content-Type");
// Indica que las respuestas se devolverán como JSON en codificación UTF-8.
header("Content-Type: application/json; charset=UTF-8");

// Importa la conexión PDO con la base de datos.
require_once '../config/database.php';

// -----------------------------------------------------------------------------
// 2. Manejo de la solicitud OPTIONS
// -----------------------------------------------------------------------------
// El navegador puede enviar OPTIONS para comprobar los permisos CORS.
// Se responde sin modificar ningún registro.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -----------------------------------------------------------------------------
// 3. Lectura de los datos recibidos
// -----------------------------------------------------------------------------
// Convierte el cuerpo JSON de la petición en un arreglo asociativo de PHP.
$data = json_decode(file_get_contents("php://input"), true);

// Obtiene el ID de la barbería y el nuevo estado solicitado.
// Si no se envía estado, se utiliza INACTIVA por defecto.
$id_barberia = $data['id_barberia'] ?? null;
$estado      = $data['estado'] ?? 'INACTIVA'; // ACTIVA o INACTIVA

// -----------------------------------------------------------------------------
// 4. Validación del identificador
// -----------------------------------------------------------------------------
// No se puede actualizar una barbería si no se conoce su identificador.
if (!$id_barberia) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la barbería es obligatorio."]);
    exit();
}

try {
    // -------------------------------------------------------------------------
    // 5. Actualización del estado
    // -------------------------------------------------------------------------
    // La consulta preparada evita insertar directamente los valores recibidos
    // desde el frontend en la instrucción SQL.
    $stmt = $pdo->prepare("UPDATE barberias SET estado = ? WHERE id_barberia = ?");

    // Sustituye los marcadores por el nuevo estado y el ID de la barbería.
    $stmt->execute([$estado, $id_barberia]);

    // -------------------------------------------------------------------------
    // 6. Respuesta exitosa
    // -------------------------------------------------------------------------
    // Informa al frontend cuál es el estado asignado.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Estado de la barbería actualizado a " . $estado
    ]);
} catch (Exception $e) {
    // -------------------------------------------------------------------------
    // 7. Manejo de errores
    // -------------------------------------------------------------------------
    // Devuelve el mensaje del error en formato JSON si falla la actualización.
    echo json_encode(["status" => "error", "mensaje" => "Error al actualizar estado: " . $e->getMessage()]);
}