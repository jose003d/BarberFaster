<?php
// backend/barberias/horario.php
// Este archivo expone un endpoint para consultar y actualizar el horario de atención de una barbería.
// Se usa desde el frontend para mostrar y cambiar los horarios de apertura/cierre.

// Configuración de cabeceras para permitir peticiones desde otro dominio (CORS).
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Si el navegador hace una petición OPTIONS previa (preflight), la respondemos OK y terminamos.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluye la conexión a la base de datos.
require_once '../config/database.php';

// Se identifica el método HTTP recibido: GET o POST.
$method = $_SERVER['REQUEST_METHOD'];

// Bloque para consultar el horario de una barbería.
if ($method === 'GET') {
    // Se recibe el id_barberia por query string, por ejemplo: horario.php?id_barberia=1
    $id_barberia = $_GET['id_barberia'] ?? 1;

    try {
        // Consulta los datos de la barbería específica: nombre y horario de atención.
        $stmt = $pdo->prepare("SELECT id_barberia, nombre, hora_apertura, hora_cierre FROM barberias WHERE id_barberia = ?");
        $stmt->execute([$id_barberia]);
        $barberia = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si la barbería existe, devuelve sus datos.
        if ($barberia) {
            echo json_encode(["status" => "success", "data" => $barberia]);
        } else {
            // Si no existe, responde con un error claro.
            echo json_encode(["status" => "error", "mensaje" => "Barbería no encontrada."]);
        }
    } catch (Exception $e) {
        // Si ocurre algún error en la consulta, lo devolvemos en JSON.
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Bloque para actualizar el horario de la barbería.
    // Lee el contenido JSON enviado en el body del request.
    $data = json_decode(file_get_contents("php://input"), true);

    // Extrae los datos del JSON, con valores por defecto si faltan.
    $id_barberia = $data['id_barberia'] ?? 1;
    $hora_apertura = $data['hora_apertura'] ?? '08:00:00';
    $hora_cierre = $data['hora_cierre'] ?? '19:00:00';

    try {
        // Actualiza el horario de atención para la barbería indicada.
        $stmt = $pdo->prepare("UPDATE barberias SET hora_apertura = ?, hora_cierre = ? WHERE id_barberia = ?");
        $stmt->execute([$hora_apertura, $hora_cierre, $id_barberia]);

        // Respuesta de éxito.
        echo json_encode(["status" => "success", "mensaje" => "Horario de atención actualizado correctamente."]);
    } catch (Exception $e) {
        // Respuesta de error si falla la actualización.
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
}
?>