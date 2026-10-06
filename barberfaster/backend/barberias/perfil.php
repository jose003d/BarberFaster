<?php
// Este archivo permite consultar y actualizar el perfil de una barbería.
// Se usa desde el frontend para mostrar la información pública y editarla.

// Evita que errores o texto basura arruinen la salida JSON final.
error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_length()) ob_clean();

// Cabeceras CORS para que React pueda consumir la API desde localhost:5173.
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Si el navegador hace una peticion OPTIONS previa, responde OK y termina.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Importa la conexión a la base de datos.
require_once '../config/database.php';

// Detecta si la petición es GET o POST.
$method = $_SERVER['REQUEST_METHOD'];

// BLOQUE GET: leer el perfil de la barbería.
if ($method === 'GET') {
    // Lee el id_barberia desde la URL, por ejemplo: perfil.php?id_barberia=1
    $id_barberia = isset($_GET['id_barberia']) ? intval($_GET['id_barberia']) : 1;

    try {
        // Consulta los datos del perfil de la barbería.
        $stmt = $pdo->prepare("
            SELECT id_barberia, nombre, descripcion, direccion, url_mapa, hora_apertura, hora_cierre 
            FROM barberias 
            WHERE id_barberia = ?
        ");
        $stmt->execute([$id_barberia]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si no encuentra la barbería, devuelve un perfil por defecto con valores vacíos.
        if (!$data) {
            $data = [
                "id_barberia" => $id_barberia,
                "nombre" => "BarberFaster",
                "descripcion" => "",
                "direccion" => "",
                "url_mapa" => "",
                "hora_apertura" => "08:00:00",
                "hora_cierre" => "19:00:00"
            ];
        }

        // Respuesta JSON con los datos del perfil.
        echo json_encode(["status" => "success", "data" => $data]);
    } catch (Exception $e) {
        // Si falla la consulta, devuelve el error.
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
    exit();
}

// BLOQUE POST: actualizar el perfil de la barbería.
if ($method === 'POST') {
    // Lee el JSON enviado en el body.
    $data = json_decode(file_get_contents("php://input"), true);

    // Extrae los valores del request, con valores por defecto si faltan.
    $id_barberia   = isset($data['id_barberia']) ? intval($data['id_barberia']) : 1;
    $descripcion   = $data['descripcion'] ?? '';
    $direccion     = $data['direccion'] ?? '';
    $url_mapa      = $data['url_mapa'] ?? '';
    $hora_apertura = $data['hora_apertura'] ?? '08:00:00';
    $hora_cierre   = $data['hora_cierre'] ?? '19:00:00';

    try {
        // Actualiza los datos del perfil para la barbería indicada.
        $stmt = $pdo->prepare("
            UPDATE barberias 
            SET descripcion = ?, direccion = ?, url_mapa = ?, hora_apertura = ?, hora_cierre = ?
            WHERE id_barberia = ?
        ");
        $stmt->execute([$descripcion, $direccion, $url_mapa, $hora_apertura, $hora_cierre, $id_barberia]);

        // Confirma que la actualización fue exitosa.
        echo json_encode(["status" => "success", "mensaje" => "Perfil actualizado con éxito."]);
    } catch (Exception $e) {
        // Si falla la actualización, devuelve el error.
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
    exit();
}
?>