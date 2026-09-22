<?php
// Evitar que errores de texto corrompan la salida JSON
error_reporting(0);
ini_set('display_errors', 0);

if (ob_get_length()) ob_clean();

// Cabeceras CORS completas para autorizar las solicitudes desde React
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Responder inmediatamente a las peticiones preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id_barberia = isset($_GET['id_barberia']) ? intval($_GET['id_barberia']) : 1;

    try {
        $stmt = $pdo->prepare("
            SELECT id_barberia, nombre, descripcion, direccion, url_mapa, hora_apertura, hora_cierre 
            FROM barberias 
            WHERE id_barberia = ?
        ");
        $stmt->execute([$id_barberia]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

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

        echo json_encode(["status" => "success", "data" => $data]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $id_barberia   = isset($data['id_barberia']) ? intval($data['id_barberia']) : 1;
    $descripcion   = $data['descripcion'] ?? '';
    $direccion     = $data['direccion'] ?? '';
    $url_mapa      = $data['url_mapa'] ?? '';
    $hora_apertura = $data['hora_apertura'] ?? '08:00:00';
    $hora_cierre   = $data['hora_cierre'] ?? '19:00:00';

    try {
        $stmt = $pdo->prepare("
            UPDATE barberias 
            SET descripcion = ?, direccion = ?, url_mapa = ?, hora_apertura = ?, hora_cierre = ?
            WHERE id_barberia = ?
        ");
        $stmt->execute([$descripcion, $direccion, $url_mapa, $hora_apertura, $hora_cierre, $id_barberia]);

        echo json_encode(["status" => "success", "mensaje" => "Perfil actualizado con éxito."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
    exit();
}
?>