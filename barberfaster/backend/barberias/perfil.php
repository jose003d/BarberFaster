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

// Convierte enlaces cortos de Google Maps a una URL que se puede insertar en un iframe.
function convertirEnlaceMapaCompartido(string $url): string
{
    $partes = parse_url($url);
    $host = strtolower($partes['host'] ?? '');
    if ($host !== 'maps.app.goo.gl' && $host !== 'goo.gl') {
        return $url;
    }
    if (($partes['scheme'] ?? '') !== 'https') {
        throw new RuntimeException('El enlace de Google Maps debe comenzar con https://.');
    }
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL debe estar habilitado para convertir enlaces cortos de Google Maps.');
    }

    $actual = $url;
    $destino = null;
    for ($intento = 0; $intento < 6; $intento++) {
        $partesActuales = parse_url($actual);
        $hostActual = strtolower($partesActuales['host'] ?? '');
        $hostGooglePermitido = $hostActual === 'google.com'
            || $hostActual === 'goo.gl'
            || $hostActual === 'maps.app.goo.gl'
            || str_ends_with($hostActual, '.google.com');
        if (($partesActuales['scheme'] ?? '') !== 'https' || !$hostGooglePermitido) {
            throw new RuntimeException('El enlace redirigió a un dominio que no pertenece a Google Maps.');
        }

        $ubicacion = null;
        $curl = curl_init($actual);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_USERAGENT => 'BarberFaster/1.0 Google Maps link resolver',
            CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$ubicacion): int {
                if (stripos($line, 'Location:') === 0) {
                    $ubicacion = trim(substr($line, strlen('Location:')));
                }
                return strlen($line);
            },
            CURLOPT_WRITEFUNCTION => static function ($curl, string $contenido): int {
                return strlen($contenido);
            },
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        ]);
        $resultado = curl_exec($curl);
        $codigoHttp = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $errorCurl = curl_error($curl);
        curl_close($curl);

        if ($resultado === false) {
            error_log('Error al resolver enlace de Google Maps: ' . $errorCurl);
            throw new RuntimeException('No se pudo abrir el enlace corto de Google Maps. Verifica la conexión del servidor.');
        }

        if ($codigoHttp >= 300 && $codigoHttp < 400 && $ubicacion) {
            if (str_starts_with($ubicacion, '//')) {
                $actual = 'https:' . $ubicacion;
            } elseif (str_starts_with($ubicacion, '/')) {
                $actual = $partesActuales['scheme'] . '://' . $partesActuales['host'] . $ubicacion;
            } else {
                $actual = $ubicacion;
            }
            continue;
        }

        if ($codigoHttp < 200 || $codigoHttp >= 300) {
            throw new RuntimeException('Google Maps no pudo resolver el enlace compartido.');
        }
        $destino = $actual;
        break;
    }

    if (!$destino) {
        throw new RuntimeException('El enlace de Google Maps tiene demasiadas redirecciones.');
    }

    $partesDestino = parse_url($destino);
    $ruta = $partesDestino['path'] ?? '';
    if (preg_match('/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/', $ruta, $coordenadas)) {
        $consultaMapa = $coordenadas[1] . ',' . $coordenadas[2];
    } else {
        parse_str($partesDestino['query'] ?? '', $consulta);
        $consultaMapa = $consulta['q'] ?? '';
        if ($consultaMapa === '' && preg_match('~/(?:place|search)/([^/]+)~', $ruta, $lugar)) {
            $consultaMapa = urldecode($lugar[1]);
        }
    }

    if ($consultaMapa === '') {
        throw new RuntimeException('No se pudo identificar la ubicación en el enlace de Google Maps.');
    }

    return 'https://www.google.com/maps?q=' . rawurlencode($consultaMapa) . '&output=embed';
}

// Detecta si la petición es GET o POST.
$method = $_SERVER['REQUEST_METHOD'];

// BLOQUE GET: leer el perfil de la barbería.
if ($method === 'GET') {
    if (isset($_GET['url_mapa'])) {
        $urlMapa = trim((string)$_GET['url_mapa']);
        if ($urlMapa === '') {
            echo json_encode(["status" => "success", "data" => ["url_mapa" => ""]]);
            exit();
        }

        try {
            $urlMapa = convertirEnlaceMapaCompartido($urlMapa);
            echo json_encode(["status" => "success", "data" => ["url_mapa" => $urlMapa]]);
        } catch (Exception $e) {
            error_log('Error al convertir enlace de vista previa de Google Maps: ' . $e->getMessage());
            http_response_code(400);
            echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
        }
        exit();
    }

    // Lee el id_barberia desde la URL, por ejemplo: perfil.php?id_barberia=1
    $id_barberia = isset($_GET['id_barberia']) ? intval($_GET['id_barberia']) : 1;

    try {
        // Consulta los datos del perfil de la barbería.
        $stmt = $pdo->prepare("
            SELECT id_barberia, nombre, descripcion, direccion, url_mapa, hora_apertura, hora_cierre, dias_trabajo
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
                "hora_cierre" => "19:00:00",
                "dias_trabajo" => "LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO"
            ];
        }
        // La base guarda los días separados por comas; la interfaz los consume como lista.
        $data['dias_trabajo'] = array_values(array_filter(explode(',', (string)$data['dias_trabajo'])));

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
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "mensaje" => "El cuerpo de la solicitud no es válido."]);
        exit();
    }

    // Extrae los valores del request, con valores por defecto si faltan.
    $id_barberia   = isset($data['id_barberia']) ? intval($data['id_barberia']) : 1;
    $descripcion   = $data['descripcion'] ?? '';
    $direccion     = $data['direccion'] ?? '';
    $url_mapa      = trim((string)($data['url_mapa'] ?? ''));
    $hora_apertura = $data['hora_apertura'] ?? '08:00:00';
    $hora_cierre   = $data['hora_cierre'] ?? '19:00:00';
    $diasValidos = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

    try {
        // Valida los días recibidos; solicitudes antiguas conservan la configuración guardada.
        if (array_key_exists('dias_trabajo', $data)) {
            $diasTrabajo = $data['dias_trabajo'];
            if (
                !is_array($diasTrabajo) ||
                count($diasTrabajo) === 0 ||
                count(array_filter(
                    $diasTrabajo,
                    static fn($dia) => !is_string($dia) || !in_array($dia, $diasValidos, true)
                )) > 0
            ) {
                throw new InvalidArgumentException('Selecciona al menos un día de trabajo válido.');
            }
            $diasTrabajo = array_values(array_unique($diasTrabajo));
        } else {
            $stmtDias = $pdo->prepare("SELECT dias_trabajo FROM barberias WHERE id_barberia = ?");
            $stmtDias->execute([$id_barberia]);
            $diasTrabajo = explode(',', (string)$stmtDias->fetchColumn());
        }

        if ($url_mapa !== '') {
            $url_mapa = convertirEnlaceMapaCompartido($url_mapa);
        }

        // Actualiza el perfil y persiste los días laborables como lista separada por comas.
        $stmt = $pdo->prepare("
            UPDATE barberias 
            SET descripcion = ?, direccion = ?, url_mapa = ?, hora_apertura = ?, hora_cierre = ?, dias_trabajo = ?
            WHERE id_barberia = ?
        ");
        $stmt->execute([
            $descripcion,
            $direccion,
            $url_mapa,
            $hora_apertura,
            $hora_cierre,
            implode(',', $diasTrabajo),
            $id_barberia,
        ]);

        // Confirma que la actualización fue exitosa.
        echo json_encode([
            "status" => "success",
            "mensaje" => "Perfil actualizado con éxito.",
            "data" => ["url_mapa" => $url_mapa, "dias_trabajo" => $diasTrabajo]
        ]);
    } catch (Exception $e) {
        // Si falla la actualización, devuelve el error.
        error_log('Error al actualizar perfil de barbería: ' . $e->getMessage());
        http_response_code(400);
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
    exit();
}
?>