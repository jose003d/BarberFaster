<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    $sesion = requerirRol($pdo, ['ADMINISTRADOR', 'SUPERADMIN']);
    $sql = "
        SELECT id_usuario, id_barberia, nombre_completo AS nombre, telefono,
               correo, rol, estado, atiende_clientes, fecha_creacion
        FROM usuarios
        WHERE rol IN ('BARBERO', 'ADMINISTRADOR')
    ";
    $parametros = [];

    if ($sesion['rol'] === 'ADMINISTRADOR') {
        if (!$sesion['id_barberia']) {
            responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
        }
        // El administrador ve a sus barberos y a sí mismo solo si también atiende clientes.
        $sql .= " AND id_barberia = :id_barberia
                  AND (rol = 'BARBERO' OR (id_usuario = :id_propio AND atiende_clientes = 1))";
        $parametros[':id_barberia'] = $sesion['id_barberia'];
        $parametros[':id_propio'] = $sesion['id_usuario'];
    } elseif (isset($_GET['id_barberia'])) {
        $idBarberia = filter_var($_GET['id_barberia'], FILTER_VALIDATE_INT);
        if (!$idBarberia || $idBarberia < 1) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'mensaje' => 'La barbería indicada no es válida.']);
            exit();
        }
        $sql .= ' AND id_barberia = :id_barberia';
        $parametros[':id_barberia'] = $idBarberia;
    }

    $sql .= ' ORDER BY nombre_completo ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);

    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll()]);
} catch (Throwable $error) {
    error_log('Error al listar usuarios: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar los usuarios.']);
}
