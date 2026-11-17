<?php
// -----------------------------------------------------------------------------
// 1. Configuración de la respuesta HTTP
// -----------------------------------------------------------------------------
// Permite que el frontend realice peticiones desde otro origen o puerto.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
// Indica que el endpoint acepta peticiones cuyo cuerpo se envía como JSON.
header("Access-Control-Allow-Headers: Content-Type, Authorization");
// Todas las respuestas de este archivo tendrán formato JSON y codificación UTF-8.
header("Content-Type: application/json; charset=UTF-8");

// Carga la conexión PDO a la base de datos.
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/utilidades_horario.php';
require_once __DIR__ . '/../verificacion/comun.php';
require_once __DIR__ . '/../wompi/comun.php';

// Los navegadores suelen enviar OPTIONS antes de una petición POST (preflight).
// Se responde correctamente sin intentar crear una cita.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -----------------------------------------------------------------------------
// 2. Lectura de los datos enviados por el frontend
// -----------------------------------------------------------------------------
// Lee el cuerpo de la petición y lo convierte de JSON a un array asociativo PHP.
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "El cuerpo de la reserva no es válido."]);
    exit();
}

// Extrae los datos de la reserva. El operador ?? usa null o un array vacío
// cuando una clave no fue enviada.
$id_barberia = filter_var($data['id_barberia'] ?? null, FILTER_VALIDATE_INT);
$id_barbero  = filter_var($data['id_barbero'] ?? null, FILTER_VALIDATE_INT);
$dni_cliente = isset($data['dni_cliente']) && is_scalar($data['dni_cliente']) ? trim((string)$data['dni_cliente']) : '';
$fecha       = $data['fecha'] ?? null;         // YYYY-MM-DD
$hora_inicio = $data['hora_inicio'] ?? null;   // HH:MM:SS
$servicios   = $data['servicios'] ?? [];       // Array de IDs: [1, 2]
$nombre_cliente = isset($data['nombre_cliente']) && is_scalar($data['nombre_cliente']) ? trim((string)$data['nombre_cliente']) : '';
$telefono_cliente = isset($data['telefono_cliente']) && is_scalar($data['telefono_cliente']) ? trim((string)$data['telefono_cliente']) : '';
$ticket_verificacion = isset($data['ticket_verificacion']) && is_string($data['ticket_verificacion']) ? $data['ticket_verificacion'] : '';
$notas       = isset($data['notas']) && is_scalar($data['notas']) ? (string)$data['notas'] : null;

// -----------------------------------------------------------------------------
// 3. Validación de los datos mínimos obligatorios
// -----------------------------------------------------------------------------
// Sin barbería, barbero, cliente, fecha, hora o servicios no se puede crear
// una cita, por lo que se devuelve un error y se detiene la ejecución.
if (
    !$id_barberia ||
    !$id_barbero ||
    !$dni_cliente ||
    !$telefono_cliente ||
    !is_string($fecha) ||
    !is_string($hora_inicio) ||
    !is_array($servicios) ||
    empty($servicios)
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "Faltan datos obligatorios para la reserva."]);
    exit();
}

try {
    wompiConfiguracion();
} catch (Throwable $error) {
    error_log('Wompi no está configurado para crear una reserva: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode([
        "status" => "error",
        "mensaje" => "El pago en línea aún no está disponible. Inténtalo más tarde."
    ]);
    exit();
}

if (!preg_match('/^\d{1,10}$/', $dni_cliente)) {
    http_response_code(422);
    echo json_encode(["status" => "error", "mensaje" => "El DNI debe tener máximo 10 dígitos y solo puede contener números."]);
    exit();
}

if (!telefonoValido($telefono_cliente)) {
    http_response_code(422);
    echo json_encode(["status" => "error", "mensaje" => "El número de teléfono no es válido."]);
    exit();
}
$telefono_cliente = normalizarTelefono($telefono_cliente);

try {
    $sesionClienteActiva = leerSesionCliente();
    $clienteAutenticado = $sesionClienteActiva === false
        ? false
        : obtenerClienteAutenticado($pdo);
} catch (Throwable $e) {
    error_log('Error al validar sesión de cliente para reservar: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo validar la sesión del cliente."]);
    exit();
}
$ticketBloqueado = null;

if ($sesionClienteActiva !== false) {
    $nombreSesion = trim((string)$sesionClienteActiva['nombre']);
    $nombreSolicitado = trim($nombre_cliente);
    if (function_exists('mb_strtolower')) {
        $nombreSesion = mb_strtolower($nombreSesion, 'UTF-8');
        $nombreSolicitado = mb_strtolower($nombreSolicitado, 'UTF-8');
    } else {
        $nombreSesion = strtolower($nombreSesion);
        $nombreSolicitado = strtolower($nombreSolicitado);
    }

    if (
        !hash_equals((string)$sesionClienteActiva['dni'], $dni_cliente) ||
        normalizarTelefono((string)$sesionClienteActiva['telefono']) !== $telefono_cliente ||
        $nombreSesion !== $nombreSolicitado
    ) {
        http_response_code(403);
        echo json_encode(["status" => "error", "mensaje" => "Los datos de la reserva no coinciden con la sesión activa del cliente."]);
        exit();
    }

    if ($clienteAutenticado === false) {
        $stmtClienteExistente = $pdo->prepare('SELECT 1 FROM clientes WHERE dni = ?');
        $stmtClienteExistente->execute([$dni_cliente]);
        if ($stmtClienteExistente->fetchColumn()) {
            http_response_code(403);
            echo json_encode(["status" => "error", "mensaje" => "La sesión venció o los datos del cliente cambiaron. Verifica nuevamente tu WhatsApp."]);
            exit();
        }
    }
    if ($ticket_verificacion !== '') {
        $ticket = bloquearTicketVerificacion($telefono_cliente, $ticket_verificacion);
        $ticketBloqueado = $ticket === false ? null : $ticket;
    }
} else {
    $ticketBloqueado = bloquearTicketVerificacion($telefono_cliente, $ticket_verificacion);
    if ($ticketBloqueado === false) {
        http_response_code(403);
        echo json_encode(["status" => "error", "mensaje" => "Verifica nuevamente tu teléfono antes de reservar."]);
        exit();
    }
}

$serviciosValidos = [];
foreach ($servicios as $idServicio) {
    $idServicio = filter_var($idServicio, FILTER_VALIDATE_INT);
    if ($idServicio !== false && $idServicio > 0) {
        $serviciosValidos[] = $idServicio;
    }
}
$servicios = array_values(array_unique($serviciosValidos));

if (empty($servicios)) {
    if ($ticketBloqueado !== null) {
        liberarTicketVerificacion($ticketBloqueado);
    }
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "Selecciona al menos un servicio válido."]);
    exit();
}

try {
    wompiLiberarPagosVencidos($pdo);
    $pdo->beginTransaction();

    // Bloquea la fila del barbero hasta terminar la transacción. Así, dos
    // reservas simultáneas del mismo barbero no pueden pasar juntas el chequeo.
    $stmtBarbero = $pdo->prepare("
        SELECT id_usuario
        FROM usuarios
        WHERE id_usuario = :id_barbero
          AND id_barberia = :id_barberia
          AND (rol = 'BARBERO' OR (rol = 'ADMINISTRADOR' AND atiende_clientes = 1))
          AND estado = 'ACTIVO'
        FOR UPDATE
    ");
    $stmtBarbero->execute([
        ':id_barbero' => $id_barbero,
        ':id_barberia' => $id_barberia,
    ]);
    if (!$stmtBarbero->fetchColumn()) {
        throw new RuntimeException("El barbero no pertenece a esta barbería.", 422);
    }

    $stmtHorario = $pdo->prepare("
        SELECT hora_apertura, hora_cierre, dias_trabajo
        FROM barberias
        WHERE id_barberia = :id_barberia
    ");
    $stmtHorario->execute([':id_barberia' => $id_barberia]);
    $horarioBarberia = $stmtHorario->fetch();
    if (!$horarioBarberia) {
        throw new RuntimeException("No se encontró el horario de la barbería.", 422);
    }

    // -------------------------------------------------------------------------
    // 4. Consultar los servicios y calcular duración y precio
    // -------------------------------------------------------------------------
    // Crea un signo ? por cada servicio para construir de forma segura la
    // cláusula IN (?, ?, ...). Los valores se envían después como parámetros.
    $placeholders = implode(',', array_fill(0, count($servicios), '?'));
    $stmtServ = $pdo->prepare("SELECT id_servicio, precio, duracion_minutos FROM servicios WHERE id_servicio IN ($placeholders) AND id_barberia = ?");
    // Añade el id de la barbería después de los ids de los servicios, respetando
    // el mismo orden de los signos ? de la consulta.
    $paramsServ = array_merge($servicios, [$id_barberia]);
    $stmtServ->execute($paramsServ);
    $listaServicios = $stmtServ->fetchAll();

    // Si no se encontró ningún servicio válido para esa barbería, se cancela
    // la reserva antes de hacer cambios en la base de datos.
    if (count($listaServicios) !== count($servicios)) {
        throw new RuntimeException("Uno o más servicios seleccionados no son válidos.", 422);
    }

    // Acumula los minutos y el precio de todos los servicios seleccionados.
    $duracionTotal = 0;
    $precioTotal = 0.00;
    foreach ($listaServicios as $s) {
        $duracionTotal += (int)$s['duracion_minutos'];
        $precioTotal   += (float)$s['precio'];
    }

    // -------------------------------------------------------------------------
    // 5. Validar y calcular las horas de inicio y finalización
    // -------------------------------------------------------------------------
    $inicioMinutos = horaAMinutos($hora_inicio);
    $aperturaMinutos = horaAMinutos($horarioBarberia['hora_apertura']);
    $cierreMinutos = horaAMinutos($horarioBarberia['hora_cierre']);
    $zonaHorariaBarberFaster = new DateTimeZone('America/Bogota');
    $fechaValidada = DateTime::createFromFormat('!Y-m-d', $fecha, $zonaHorariaBarberFaster);
    $erroresFecha = DateTime::getLastErrors();

    if (
        $inicioMinutos === null ||
        $aperturaMinutos === null ||
        $cierreMinutos === null ||
        $cierreMinutos <= $aperturaMinutos ||
        !$fechaValidada ||
        ($erroresFecha && ($erroresFecha['warning_count'] > 0 || $erroresFecha['error_count'] > 0)) ||
        $fechaValidada->format('Y-m-d') !== $fecha
    ) {
        throw new RuntimeException("La fecha o la hora de la reserva no es válida.", 422);
    }

    // La reserva solo puede continuar si la fecha corresponde a un día abierto del local.
    $diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
    $diaReserva = $diasSemana[(int)$fechaValidada->format('N') - 1];
    if (!in_array($diaReserva, explode(',', (string)$horarioBarberia['dias_trabajo']), true)) {
        throw new RuntimeException("La barbería no recibe reservas los días $diaReserva.", 422);
    }

    $finMinutos = $inicioMinutos + $duracionTotal;
    if (
        $inicioMinutos < $aperturaMinutos ||
        ($inicioMinutos - $aperturaMinutos) % 30 !== 0 ||
        $finMinutos > $cierreMinutos
    ) {
        throw new RuntimeException("El turno debe iniciar en una franja de 30 minutos y terminar antes del cierre.", 422);
    }

    $ahoraBogota = new DateTime('now', $zonaHorariaBarberFaster);
    $fechaHoy = (clone $ahoraBogota)->setTime(0, 0);
    $minutoActualBogota = ((int)$ahoraBogota->format('G') * 60) + (int)$ahoraBogota->format('i');
    if ($fechaValidada < $fechaHoy || ($fechaValidada->format('Y-m-d') === $fechaHoy->format('Y-m-d') && $inicioMinutos <= $minutoActualBogota)) {
        throw new RuntimeException("No puedes reservar una fecha u hora que ya pasó.", 422);
    }

    $hora_inicio = minutosAHora($inicioMinutos);
    $hora_fin = minutosAHora($finMinutos);

    // -------------------------------------------------------------------------
    // 6. Comprobar que el horario esté disponible
    // -------------------------------------------------------------------------
    // La comparación de intervalos detecta cualquier traslape. El bloqueo
    // previo de la fila del barbero protege también ante dos INSERT simultáneos.
    $stmtCheck = $pdo->prepare("
        SELECT id_cita
        FROM citas
        WHERE id_barbero = :id
          AND fecha = :fecha
          AND estado NOT IN ('CANCELADA', 'cancelada')
          AND (:inicio < hora_fin AND :fin > hora_inicio)
        FOR UPDATE
    ");
    $stmtCheck->execute([
        ':id' => $id_barbero,
        ':fecha' => $fecha,
        ':inicio' => $hora_inicio,
        ':fin' => $hora_fin,
    ]);
    
    if ($stmtCheck->fetchColumn()) {
        throw new RuntimeException("El turno seleccionado se cruza con otra reserva.", 409);
    }

    // -------------------------------------------------------------------------
    // 7. Guardar la cita y sus servicios dentro de una transacción
    // -------------------------------------------------------------------------
    // La transacción garantiza que todas las operaciones se confirmen juntas o
    // que ninguna quede guardada si ocurre un error.
    // Primero crea o actualiza el cliente. Esto permite cumplir la relación
    // entre citas y clientes mediante el DNI.
    $stmtCliente = $pdo->prepare("
        INSERT INTO clientes (dni, nombre, telefono)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), telefono = VALUES(telefono)
    ");
    $stmtCliente->execute([$dni_cliente, $nombre_cliente ?: 'Cliente de agenda', $telefono_cliente ?: null]);

    // Inserta la cita principal con estado PENDIENTE y conserva el id generado.
    $stmtCita = $pdo->prepare("
        INSERT INTO citas (id_barberia, id_barbero, dni_cliente, fecha, hora_inicio, hora_fin, precio_total, estado, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)
    ");
    $stmtCita->execute([$id_barberia, $id_barbero, $dni_cliente, $fecha, $hora_inicio, $hora_fin, $precioTotal, $notas]);
    $id_cita = $pdo->lastInsertId();

    // Guarda cada servicio en la tabla intermedia y conserva su precio histórico.
    // Así, futuros cambios de precio no alteran el detalle de esta cita.
    $stmtDetalle = $pdo->prepare("INSERT INTO cita_servicios (id_cita, id_servicio, precio_historico) VALUES (?, ?, ?)");
    foreach ($listaServicios as $s) {
        $stmtDetalle->execute([$id_cita, $s['id_servicio'], $s['precio']]);
    }

    $montoCentavos = (int) round($precioTotal * 100);
    if ($montoCentavos < 1) {
        throw new RuntimeException("El total de la cita no es válido para procesar el pago.", 422);
    }
    $pago = wompiCrearReferencia($pdo, (int) $id_cita, (int) $id_barberia, $montoCentavos);

    // El ticket se consume al reservar y queda ligado al teléfono validado.
    if ($ticketBloqueado !== null) {
        $ticketConsumido = consumirTicketVerificacion($ticketBloqueado);
        $ticketBloqueado = null;
        if (!$ticketConsumido) {
            throw new RuntimeException("No se pudo confirmar la verificación del teléfono.", 500);
        }
    }

    // Confirma definitivamente todos los INSERT realizados en la transacción.
    $pdo->commit();

    $sesionCliente = null;
    if ($sesionClienteActiva === false) {
        try {
            $sesionCliente = crearSesionCliente($dni_cliente, $nombre_cliente, $telefono_cliente);
        } catch (Throwable $e) {
            error_log('La cita se creó, pero no se pudo iniciar la sesión del cliente: ' . $e->getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // 8. Respuesta exitosa al frontend
    // -------------------------------------------------------------------------
    // Devuelve los datos principales para que la interfaz pueda mostrar el
    // resultado o actualizar la agenda sin repetir cálculos.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Completa el pago en los próximos 10 minutos para confirmar tu cita.",
        "id_cita" => $id_cita,
        "hora_inicio" => $hora_inicio,
        "hora_fin" => $hora_fin,
        "precio_total" => $precioTotal,
        "pago" => $pago,
        "sesion_cliente" => $sesionCliente,
        "sesion_expira_en" => $sesionCliente !== null ? time() + 1800 : null
    ]);

} catch (Exception $e) {
    // -------------------------------------------------------------------------
    // 9. Tratamiento de errores
    // -------------------------------------------------------------------------
    // Si algo falla después de iniciar la transacción, deshace los cambios
    // parciales para no dejar datos incompletos en la base de datos.
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($ticketBloqueado !== null) {
        liberarTicketVerificacion($ticketBloqueado);
    }
    $codigo = (int)$e->getCode();
    if ($codigo >= 400 && $codigo < 500) {
        http_response_code($codigo);
    }
    // Informa al frontend de que la operación falló y devuelve el motivo.
    echo json_encode(["status" => "error", "mensaje" => "Error al agendar cita: " . $e->getMessage()]);
}