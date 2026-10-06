<?php
// -----------------------------------------------------------------------------
// Endpoint: validar_disponibilidad.php
// -----------------------------------------------------------------------------
// Este archivo comprueba si un barbero puede atender una cita en una fecha y
// hora determinadas. Si el horario está ocupado, intenta devolver una
// alternativa cercana dentro de la jornada laboral.

// -----------------------------------------------------------------------------
// 1. Configuración de la respuesta HTTP y CORS
// -----------------------------------------------------------------------------
// Permite que el frontend realice peticiones desde otro dominio o puerto.
header("Access-Control-Allow-Origin: *");
// Permite enviar datos mediante la cabecera Content-Type.
header("Access-Control-Allow-Headers: Content-Type");
// Todas las respuestas del endpoint se envían como JSON en UTF-8.
header("Content-Type: application/json; charset=UTF-8");

// Importa la conexión PDO utilizada para consultar la base de datos.
require_once '../config/database.php';

// -----------------------------------------------------------------------------
// 2. Lectura de los parámetros de consulta
// -----------------------------------------------------------------------------
// Los valores se reciben mediante la URL, por ejemplo:
// validar_disponibilidad.php?id_barbero=3&fecha=2026-09-22&hora_inicio=10:00:00
$id_barbero  = $_GET['id_barbero'] ?? null;
$fecha       = $_GET['fecha'] ?? null;         // Formato: YYYY-MM-DD
$hora_inicio = $_GET['hora_inicio'] ?? null;   // Formato: HH:MM:SS
$servicios   = $_GET['servicios'] ?? [];       // Array de IDs de servicios

// Verifica que existan todos los datos necesarios para realizar la validación.
// Si falta uno, responde con un error y detiene el script.
if (!$id_barbero || !$fecha || !$hora_inicio || empty($servicios)) {
    echo json_encode(["status" => "error", "mensaje" => "Faltan parámetros de consulta."]);
    exit();
}

try {
    // -------------------------------------------------------------------------
    // 3. Calcular la duración total de los servicios
    // -------------------------------------------------------------------------
    // El frontend puede enviar los servicios como arreglo o como cadena,
    // por ejemplo: [1, 2] o "1,2". Se normaliza el formato antes de consultar.
    if (!is_array($servicios)) {
        $servicios = explode(',', $servicios);
    }

    // Crea un marcador ? por cada servicio para construir de forma segura la
    // cláusula IN (?, ?, ...), sin insertar directamente datos del usuario.
    $placeholders = implode(',', array_fill(0, count($servicios), '?'));

    // Obtiene y suma la duración de los servicios seleccionados.
    $stmtServ = $pdo->prepare("SELECT SUM(duracion_minutos) FROM servicios WHERE id_servicio IN ($placeholders)");
    $stmtServ->execute($servicios);
    $duracionTotal = (int)$stmtServ->fetchColumn();

    // Una duración igual a cero indica que no se encontraron servicios válidos.
    if ($duracionTotal === 0) {
        echo json_encode(["status" => "error", "mensaje" => "Servicios no válidos."]);
        exit();
    }

    // -------------------------------------------------------------------------
    // 4. Calcular la hora de finalización solicitada
    // -------------------------------------------------------------------------
    // Combina la fecha y la hora inicial, y suma la duración de los servicios.
    $inicioDT = new DateTime("$fecha $hora_inicio");
    $finDT    = (clone $inicioDT)->modify("+$duracionTotal minutes");
    $hora_fin = $finDT->format('H:i:s');

    // -------------------------------------------------------------------------
    // 5. Comprobar la jornada laboral del barbero
    // -------------------------------------------------------------------------
    // date('w') devuelve un número entre 0 y 6: domingo es 0 y sábado es 6.
    // El arreglo convierte ese número en el nombre usado por la base de datos.
    $diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    $numDia = date('w', strtotime($fecha));
    $diaNombre = $diasSemana[$numDia];

    // Busca la hora de apertura y cierre configurada para ese barbero y día.
    $stmtHorario = $pdo->prepare("SELECT hora_inicio, hora_fin FROM barbero_horarios WHERE id_barbero = ? AND dia_semana = ?");
    $stmtHorario->execute([$id_barbero, $diaNombre]);
    $jornada = $stmtHorario->fetch();

    if (!$jornada) {
        echo json_encode(["disponible" => false, "mensaje" => "El barbero no labora el día $diaNombre."]);
        exit();
    }

    // Comprueba que toda la cita quede dentro de la jornada laboral.
    if ($hora_inicio < $jornada['hora_inicio'] || $hora_fin > $jornada['hora_fin']) {
        echo json_encode(["disponible" => false, "mensaje" => "El rango solicitado sobrepasa el horario del barbero."]);
        exit();
    }

    // -------------------------------------------------------------------------
    // 6. Comprobar si la cita se cruza con otra reserva
    // -------------------------------------------------------------------------
    // Solo se consideran las citas activas. La condición detecta cualquier
    // intersección entre el intervalo solicitado y un intervalo existente.
    $stmtCheck = $pdo->prepare("
        SELECT id_cita, hora_inicio, hora_fin 
        FROM citas 
        WHERE id_barbero = ? AND fecha = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
        AND (? < hora_fin AND ? > hora_inicio)
    ");
    $stmtCheck->execute([$id_barbero, $fecha, $hora_inicio, $hora_fin]);
    $colisiones = $stmtCheck->fetchAll();

    // Si no hay citas que se crucen, el horario se puede reservar.
    if (count($colisiones) === 0) {
        echo json_encode([
            "disponible" => true,
            "hora_inicio" => $hora_inicio,
            "hora_fin" => $hora_fin,
            "duracion_minutos" => $duracionTotal
        ]);
        exit();
    }

    // -------------------------------------------------------------------------
    // 7. Buscar una alternativa si existe una colisión
    // -------------------------------------------------------------------------
    // Se recuperan todas las citas activas del día ordenadas cronológicamente.
    // Ese orden permite analizar los espacios libres entre ellas.
    $stmtTodas = $pdo->prepare("
        SELECT hora_inicio, hora_fin 
        FROM citas 
        WHERE id_barbero = ? AND fecha = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
        ORDER BY hora_inicio ASC
    ");
    $stmtTodas->execute([$id_barbero, $fecha]);
    $citasOcupadas = $stmtTodas->fetchAll();

    // Busca el hueco disponible más cercano a la hora que solicitó el usuario.
    $sugerencia = calcularSugerencia($jornada, $citasOcupadas, $inicioDT, $duracionTotal);

    // Informa que el horario original está ocupado y devuelve la alternativa,
    // o null si no existe ningún espacio suficiente.
    echo json_encode([
        "disponible" => false,
        "mensaje" => "La franja seleccionada ya está ocupada.",
        "sugerencia" => $sugerencia
    ]);

} catch (Exception $e) {
    // Captura errores de base de datos, fechas u otras operaciones inesperadas.
    echo json_encode(["status" => "error", "mensaje" => "Error al validar: " . $e->getMessage()]);
}

// -----------------------------------------------------------------------------
// 8. Función para encontrar el hueco libre más cercano
// -----------------------------------------------------------------------------
// $jornada contiene apertura y cierre; $citas está ordenado por hora de inicio;
// $deseadoDT representa la hora originalmente solicitada.
function calcularSugerencia($jornada, $citas, $deseadoDT, $duracion) {
    // Convierte las horas a segundos para poder compararlas y restarlas.
    $apertura = strtotime($jornada['hora_inicio']);
    $cierre   = strtotime($jornada['hora_fin']);
    $deseado  = $deseadoDT->getTimestamp();
    $duracionSec = $duracion * 60;

    $huecos = [];
    // El puntero representa el primer momento que todavía podría estar libre.
    $puntero = $apertura;

    foreach ($citas as $c) {
        // Convierte el inicio y el fin de cada cita a segundos.
        $inicioCita = strtotime($c['hora_inicio']);
        $finCita    = strtotime($c['hora_fin']);

        // Si el espacio antes de esta cita alcanza para la nueva reserva, se
        // guarda como una posible sugerencia.
        if (($inicioCita - $puntero) >= $duracionSec) {
            $huecos[] = ['inicio' => $puntero, 'fin' => $puntero + $duracionSec];
        }

        // Avanza el puntero hasta el final de la cita actual. La comparación
        // evita retroceder si hubiera citas solapadas entre sí.
        if ($finCita > $puntero) {
            $puntero = $finCita;
        }
    }

    // También se revisa el espacio entre la última cita y la hora de cierre.
    if (($cierre - $puntero) >= $duracionSec) {
        $huecos[] = ['inicio' => $puntero, 'fin' => $puntero + $duracionSec];
    }

    // Si no hay ningún hueco con duración suficiente, no existe alternativa.
    if (empty($huecos)) return null;

    // Ordena las alternativas por distancia respecto a la hora solicitada.
    usort($huecos, function($a, $b) use ($deseado) {
        return abs($a['inicio'] - $deseado) - abs($b['inicio'] - $deseado);
    });

    // Devuelve la primera alternativa, que es la más cercana al horario pedido.
    return [
        "hora_inicio_sugerida" => date('H:i:s', $huecos[0]['inicio']),
        "hora_fin_sugerida"    => date('H:i:s', $huecos[0]['fin']),
        "duracion_minutos"     => $duracion
    ];
}