<?php

declare(strict_types=1);

// Configuración de pagos en línea (Wompi) de una barbería.
// El administrador pega las llaves de SU cuenta de Wompi: así el dinero de las
// reservas llega directo a la barbería y no a la plataforma.
//
// GET  → estado actual (nunca devuelve secretos).
// POST → guarda/actualiza llaves: {ambiente, llave_publica, llave_privada,
//        secreto_integridad, secreto_eventos, activo}. Un secreto vacío conserva
//        el guardado si el ambiente no cambia.
// POST {accion: "eliminar"} → borra la configuración (solo pago en el local).
// SUPERADMIN indica la barbería con id_barberia; un ADMINISTRADOR siempre
// actúa sobre la suya.

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../wompi/comun.php';

function responderPagos(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function urlEventosWompi(): string
{
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $host = preg_replace('/[^A-Za-z0-9.:\-\[\]]/', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));

    return ($https ? 'https' : 'http') . '://' . $host . rutaBaseApp() . 'backend/wompi/evento.php';
}

function estadoPagos(PDO $pdo, int $idBarberia): array
{
    $fila = wompiFilaBarberia($pdo, $idBarberia);

    return [
        'configurado' => $fila !== null,
        'activo' => $fila !== null && (int) $fila['activo'] === 1,
        'ambiente' => $fila['ambiente'] ?? null,
        'llave_publica' => $fila['llave_publica'] ?? null,
        'secretos_guardados' => $fila !== null,
        'validado_en' => $fila['validado_en'] ?? null,
        'url_eventos' => urlEventosWompi(),
    ];
}

// Llama a la API de Wompi y devuelve [código HTTP, cuerpo decodificado].
function consultarApiWompi(string $url, array $cabeceras): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json'], $cabeceras),
    ]);
    $contenido = curl_exec($curl);
    $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    return [$codigo, is_string($contenido) ? json_decode($contenido, true) : null];
}

// Comprueba las llaves contra Wompi antes de guardarlas. Devuelve el nombre del
// comercio dueño de la llave pública para mostrárselo al administrador.
// Los secretos de integridad y de eventos no se pueden comprobar sin un pago.
function validarLlavesEnWompi(string $ambiente, string $llavePublica, string $llavePrivada): string
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('La extensión cURL de PHP debe estar habilitada para validar las llaves.');
    }
    $base = wompiBaseApi($ambiente);

    [$codigo, $respuesta] = consultarApiWompi(
        $base . '/merchants/info',
        ['x-merchant-public-key: ' . $llavePublica]
    );
    if ($codigo === 422 || $codigo === 404 || $codigo === 401) {
        throw new InvalidArgumentException('Wompi no reconoce la llave pública. Revisa que la copiaste completa y del ambiente correcto.');
    }
    if ($codigo !== 200 || !is_array($respuesta['data'] ?? null)) {
        throw new RuntimeException("Wompi respondió HTTP {$codigo} al validar la llave pública.");
    }
    $comercio = trim((string) ($respuesta['data']['name'] ?? ''));

    [$codigo] = consultarApiWompi(
        $base . '/transactions?reference=' . rawurlencode('bf-validacion-' . bin2hex(random_bytes(4))),
        ['Authorization: Bearer ' . $llavePrivada]
    );
    if ($codigo === 401 || $codigo === 403) {
        throw new InvalidArgumentException('Wompi no reconoce la llave privada. Revisa que la copiaste completa y del ambiente correcto.');
    }
    if ($codigo !== 200) {
        throw new RuntimeException("Wompi respondió HTTP {$codigo} al validar la llave privada.");
    }

    return $comercio;
}

try {
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($metodo, ['GET', 'POST'], true)) {
        responderPagos(405, ['status' => 'error', 'mensaje' => 'Método no permitido.']);
    }

    $usuario = requerirRol($pdo, ['ADMINISTRADOR', 'SUPERADMIN']);
    $datos = [];
    if ($metodo === 'POST') {
        // Exigir JSON obliga a un preflight CORS: un formulario de otro sitio
        // no puede enviar esta petición con la sesión del administrador.
        if (stripos((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) {
            responderPagos(415, ['status' => 'error', 'mensaje' => 'La solicitud debe enviarse como JSON.']);
        }
        $datos = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            responderPagos(400, ['status' => 'error', 'mensaje' => 'El cuerpo de la solicitud no es válido.']);
        }
    }

    $idBarberia = $usuario['rol'] === 'ADMINISTRADOR'
        ? $usuario['id_barberia']
        : filter_var($metodo === 'GET' ? ($_GET['id_barberia'] ?? null) : ($datos['id_barberia'] ?? null), FILTER_VALIDATE_INT);
    if (!$idBarberia || $idBarberia < 1) {
        responderPagos(422, ['status' => 'error', 'mensaje' => 'Selecciona una barbería válida.']);
    }
    $stmt = $pdo->prepare('SELECT 1 FROM barberias WHERE id_barberia = ?');
    $stmt->execute([$idBarberia]);
    if (!$stmt->fetchColumn()) {
        responderPagos(404, ['status' => 'error', 'mensaje' => 'La barbería no existe.']);
    }

    if ($metodo === 'GET') {
        responderPagos(200, ['status' => 'success', 'data' => estadoPagos($pdo, $idBarberia)]);
    }

    // Un pago en curso (máximo 10 minutos) solo se puede verificar con las llaves
    // con que se creó. Mientras exista, no se cambian ni se borran las llaves.
    $hayPagosEnCurso = static function () use ($pdo, $idBarberia): bool {
        $stmt = $pdo->prepare("
            SELECT 1
            FROM wompi_pagos p
            INNER JOIN citas c ON c.id_cita = p.id_cita
            WHERE c.id_barberia = ? AND p.estado = 'PENDING' AND p.expira_en > NOW()
            LIMIT 1
        ");
        $stmt->execute([$idBarberia]);
        return (bool) $stmt->fetchColumn();
    };
    $mensajePagosEnCurso = 'Hay clientes pagando en este momento. Espera unos 10 minutos y vuelve a intentarlo.';

    if (($datos['accion'] ?? null) === 'eliminar') {
        if ($hayPagosEnCurso()) {
            responderPagos(409, ['status' => 'error', 'mensaje' => $mensajePagosEnCurso]);
        }
        $pdo->prepare("DELETE FROM barberia_pasarelas WHERE id_barberia = ? AND proveedor = 'WOMPI'")
            ->execute([$idBarberia]);
        responderPagos(200, [
            'status' => 'success',
            'mensaje' => 'Se quitó la configuración de Wompi. Tus clientes solo podrán pagar en el local.',
            'data' => estadoPagos($pdo, $idBarberia),
        ]);
    }

    if (!cifradoDisponible()) {
        error_log('No se pueden guardar llaves de Wompi: falta PAGOS_CLAVE_CIFRADO válida.');
        responderPagos(503, [
            'status' => 'error',
            'mensaje' => 'El servidor aún no está listo para guardar llaves de pago. Contacta al soporte de BarberFaster.',
        ]);
    }

    $ambiente = $datos['ambiente'] ?? null;
    if (!is_string($ambiente) || !isset(WOMPI_PREFIJOS[$ambiente])) {
        responderPagos(422, ['status' => 'error', 'mensaje' => 'Elige el ambiente: pruebas o producción.']);
    }
    $activo = filter_var($datos['activo'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
    if ($activo === null) {
        responderPagos(422, ['status' => 'error', 'mensaje' => 'El valor de "activo" no es válido.']);
    }

    $llaves = [];
    foreach (array_keys(WOMPI_NOMBRES_LLAVES) as $campo) {
        $valor = $datos[$campo] ?? '';
        $llaves[$campo] = is_string($valor) ? trim($valor) : $valor;
    }

    // Los secretos vacíos conservan los guardados, solo si el ambiente no cambia:
    // nunca se mezclan secretos de pruebas con llaves de producción.
    $existente = wompiFilaBarberia($pdo, $idBarberia);
    $conservar = $existente !== null && $existente['ambiente'] === $ambiente;
    if ($conservar) {
        $actual = wompiConfiguracionBarberia($pdo, $idBarberia, false);
        foreach (['llave_privada', 'secreto_integridad', 'secreto_eventos'] as $campo) {
            if ($llaves[$campo] === '') {
                $llaves[$campo] = $actual[$campo];
            }
        }
    }
    foreach ($llaves as $campo => $valor) {
        if ($valor === '') {
            responderPagos(422, [
                'status' => 'error',
                'mensaje' => WOMPI_NOMBRES_LLAVES[$campo] . ' es obligatorio' . ($existente !== null && !$conservar ? ' al cambiar de ambiente.' : '.'),
            ]);
        }
    }
    $errorFormato = wompiErrorFormatoLlaves($ambiente, $llaves);
    if ($errorFormato !== null) {
        responderPagos(422, ['status' => 'error', 'mensaje' => $errorFormato]);
    }

    // Solo activar/desactivar no afecta pagos en curso; cambiar llaves sí.
    $cambianLlaves = $existente !== null && (
        !$conservar
        || array_diff_assoc($llaves, array_intersect_key($actual, $llaves)) !== []
    );
    if ($cambianLlaves && $hayPagosEnCurso()) {
        responderPagos(409, ['status' => 'error', 'mensaje' => $mensajePagosEnCurso]);
    }

    try {
        $comercio = validarLlavesEnWompi($ambiente, $llaves['llave_publica'], $llaves['llave_privada']);
    } catch (InvalidArgumentException $error) {
        responderPagos(422, ['status' => 'error', 'mensaje' => $error->getMessage()]);
    }

    $stmt = $pdo->prepare("
        INSERT INTO barberia_pasarelas
            (id_barberia, proveedor, ambiente, llave_publica, llave_privada_cifrada,
             secreto_integridad_cifrado, secreto_eventos_cifrado, activo, validado_en, actualizado_por)
        VALUES
            (:id_barberia, 'WOMPI', :ambiente, :llave_publica, :llave_privada,
             :secreto_integridad, :secreto_eventos, :activo, NOW(), :actualizado_por)
        ON DUPLICATE KEY UPDATE
            ambiente = VALUES(ambiente),
            llave_publica = VALUES(llave_publica),
            llave_privada_cifrada = VALUES(llave_privada_cifrada),
            secreto_integridad_cifrado = VALUES(secreto_integridad_cifrado),
            secreto_eventos_cifrado = VALUES(secreto_eventos_cifrado),
            activo = VALUES(activo),
            validado_en = VALUES(validado_en),
            actualizado_por = VALUES(actualizado_por)
    ");
    $stmt->execute([
        ':id_barberia' => $idBarberia,
        ':ambiente' => $ambiente,
        ':llave_publica' => $llaves['llave_publica'],
        ':llave_privada' => cifrarSecreto($llaves['llave_privada'], wompiContextoSecreto($idBarberia, 'llave_privada')),
        ':secreto_integridad' => cifrarSecreto($llaves['secreto_integridad'], wompiContextoSecreto($idBarberia, 'secreto_integridad')),
        ':secreto_eventos' => cifrarSecreto($llaves['secreto_eventos'], wompiContextoSecreto($idBarberia, 'secreto_eventos')),
        ':activo' => $activo ? 1 : 0,
        ':actualizado_por' => $usuario['id_usuario'],
    ]);

    $mensaje = 'Llaves de Wompi guardadas'
        . ($comercio !== '' ? " (cuenta: {$comercio})" : '')
        . ($activo ? '. Tus clientes ya pueden pagar en línea.' : '. El pago en línea quedó desactivado.');
    responderPagos(200, ['status' => 'success', 'mensaje' => $mensaje, 'data' => estadoPagos($pdo, $idBarberia)]);
} catch (Throwable $error) {
    error_log('Error en la configuración de pagos de la barbería: ' . $error->getMessage());
    responderPagos(500, ['status' => 'error', 'mensaje' => 'No se pudo procesar la configuración de pagos. Inténtalo de nuevo.']);
}
