<?php
// backend/agenda/agendar_cita.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php'; // o conexion.php según tu archivo base

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_barberia = $data['id_barberia'] ?? null;
$id_barbero  = $data['id_barbero'] ?? null;
$dni_cliente = $data['dni_cliente'] ?? null;
$fecha       = $data['fecha'] ?? null;         // YYYY-MM-DD
$hora_inicio = $data['hora_inicio'] ?? null;   // HH:MM:SS
$servicios   = $data['servicios'] ?? [];       // Array de IDs: [1, 2]
$nombre_cliente = trim($data['nombre_cliente'] ?? '');
$telefono_cliente = trim($data['telefono_cliente'] ?? '');
$notas       = $data['notas'] ?? null;

if (!$id_barberia || !$id_barbero || !$dni_cliente || !$fecha || !$hora_inicio || empty($servicios)) {
    echo json_encode(["status" => "error", "mensaje" => "Faltan datos obligatorios para la reserva."]);
    exit();
}

try {
    // 1. Obtener duración acumulada y precio total de los servicios
    $placeholders = implode(',', array_fill(0, count($servicios), '?'));
    $stmtServ = $pdo->prepare("SELECT id_servicio, precio, duracion_minutos FROM servicios WHERE id_servicio IN ($placeholders) AND id_barberia = ?");
    $paramsServ = array_merge($servicios, [$id_barberia]);
    $stmtServ->execute($paramsServ);
    $listaServicios = $stmtServ->fetchAll();

    if (count($listaServicios) === 0) {
        echo json_encode(["status" => "error", "mensaje" => "Los servicios seleccionados no son válidos."]);
        exit();
    }

    $duracionTotal = 0;
    $precioTotal = 0.00;
    foreach ($listaServicios as $s) {
        $duracionTotal += (int)$s['duracion_minutos'];
        $precioTotal   += (float)$s['precio'];
    }

    // 2. Calcular hora_fin
    $inicioDT = new DateTime("$fecha $hora_inicio");
    $finDT    = (clone $inicioDT)->modify("+$duracionTotal minutes");
    $hora_fin = $finDT->format('H:i:s');

    // 3. Validar no solapamiento antes de insertar
    $stmtCheck = $pdo->prepare("
        SELECT COUNT(*) FROM citas 
        WHERE id_barbero = ? AND fecha = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
        AND (? < hora_fin AND ? > hora_inicio)
    ");
    $stmtCheck->execute([$id_barbero, $fecha, $hora_inicio, $hora_fin]);
    
    if ($stmtCheck->fetchColumn() > 0) {
        echo json_encode(["status" => "error", "mensaje" => "El turno seleccionado se cruza con otra reserva."]);
        exit();
    }

    // 4. Registrar Cita y sus Servicios en Transacción
    $pdo->beginTransaction();

    // La cita tiene una FK hacia clientes; registra el cliente si aún no existe.
    $stmtCliente = $pdo->prepare("
        INSERT INTO clientes (dni, nombre, telefono)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), telefono = VALUES(telefono)
    ");
    $stmtCliente->execute([$dni_cliente, $nombre_cliente ?: 'Cliente de agenda', $telefono_cliente ?: null]);

    $stmtCita = $pdo->prepare("
        INSERT INTO citas (id_barberia, id_barbero, dni_cliente, fecha, hora_inicio, hora_fin, precio_total, estado, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)
    ");
    $stmtCita->execute([$id_barberia, $id_barbero, $dni_cliente, $fecha, $hora_inicio, $hora_fin, $precioTotal, $notas]);
    $id_cita = $pdo->lastInsertId();

    $stmtDetalle = $pdo->prepare("INSERT INTO cita_servicios (id_cita, id_servicio, precio_historico) VALUES (?, ?, ?)");
    foreach ($listaServicios as $s) {
        $stmtDetalle->execute([$id_cita, $s['id_servicio'], $s['precio']]);
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "mensaje" => "Cita agendada exitosamente.",
        "id_cita" => $id_cita,
        "hora_inicio" => $hora_inicio,
        "hora_fin" => $hora_fin,
        "precio_total" => $precioTotal
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "mensaje" => "Error al agendar cita: " . $e->getMessage()]);
}