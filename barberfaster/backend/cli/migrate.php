<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}

require_once __DIR__ . '/../config/database.php';

function saltarLiteral(string $sql, int &$posicion, string $delimitador): void
{
    $longitud = strlen($sql);
    $posicion++;

    while ($posicion < $longitud) {
        $caracter = $sql[$posicion];

        if ($caracter === '\\' && $delimitador !== '`') {
            $posicion += 2;
            continue;
        }

        if ($caracter === $delimitador) {
            if (($sql[$posicion + 1] ?? null) === $delimitador) {
                $posicion += 2;
                continue;
            }

            $posicion++;
            return;
        }

        $posicion++;
    }

    throw new RuntimeException('Hay un literal SQL sin cerrar.');
}

function validarSentenciaUnica(string $sql): void
{
    $longitud = strlen($sql);
    $tieneSentencia = false;
    $sentenciaTerminada = false;

    for ($posicion = 0; $posicion < $longitud;) {
        $caracter = $sql[$posicion];
        $siguiente = $sql[$posicion + 1] ?? '';

        if (ctype_space($caracter)) {
            $posicion++;
            continue;
        }

        if ($caracter === '#' || (
            $caracter === '-'
            && $siguiente === '-'
            && isset($sql[$posicion + 2])
            && ord($sql[$posicion + 2]) <= 32
        )) {
            $salto = strpos($sql, "\n", $posicion);
            $posicion = $salto === false ? $longitud : $salto + 1;
            continue;
        }

        if ($caracter === '/' && $siguiente === '*') {
            $finComentario = strpos($sql, '*/', $posicion + 2);
            if ($finComentario === false) {
                throw new RuntimeException('Hay un comentario SQL sin cerrar.');
            }
            $posicion = $finComentario + 2;
            continue;
        }

        if ($caracter === ';') {
            if (!$tieneSentencia) {
                throw new RuntimeException('La migración no contiene una sentencia SQL.');
            }
            $sentenciaTerminada = true;
            $posicion++;
            continue;
        }

        if ($sentenciaTerminada) {
            throw new RuntimeException('Cada archivo de migración debe contener una sola sentencia SQL.');
        }

        if ($caracter === "'" || $caracter === '"' || $caracter === '`') {
            saltarLiteral($sql, $posicion, $caracter);
            $tieneSentencia = true;
            continue;
        }

        $tieneSentencia = true;
        $posicion++;
    }

    if (!$tieneSentencia) {
        throw new RuntimeException('La migración no contiene una sentencia SQL.');
    }
}

function ejecutarMigraciones(PDO $pdo): void
{
    $directorio = __DIR__ . '/../migrations/automatic';
    if (!is_dir($directorio)) {
        throw new RuntimeException('No existe el directorio de migraciones automáticas.');
    }

    $archivos = glob($directorio . '/*.sql');
    if ($archivos === false) {
        throw new RuntimeException('No se pudo leer el directorio de migraciones.');
    }
    sort($archivos, SORT_STRING);

    foreach ($archivos as $archivo) {
        if (!preg_match('/\A\d{14}_[a-z0-9][a-z0-9_]*\.sql\z/', basename($archivo))) {
            throw new RuntimeException('Nombre de migración inválido: ' . basename($archivo));
        }
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS barberfaster_schema_migrations (
            version VARCHAR(160) NOT NULL,
            checksum CHAR(64) NOT NULL,
            aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $consultaAplicadas = $pdo->query(
        'SELECT version, checksum FROM barberfaster_schema_migrations'
    );
    $aplicadas = [];
    foreach ($consultaAplicadas->fetchAll() as $migracion) {
        $aplicadas[$migracion['version']] = $migracion['checksum'];
    }

    $insertarAplicada = $pdo->prepare(
        'INSERT INTO barberfaster_schema_migrations (version, checksum) VALUES (:version, :checksum)'
    );

    foreach ($archivos as $archivo) {
        $version = basename($archivo);
        $sql = file_get_contents($archivo);
        if ($sql === false) {
            throw new RuntimeException('No se pudo leer la migración ' . $version . '.');
        }

        $checksum = hash('sha256', $sql);
        if (isset($aplicadas[$version])) {
            if (!hash_equals($aplicadas[$version], $checksum)) {
                throw new RuntimeException(
                    'La migración aplicada ' . $version . ' fue modificada. Crea una migración nueva en su lugar.'
                );
            }
            continue;
        }

        validarSentenciaUnica($sql);
        $pdo->exec($sql);
        $insertarAplicada->execute([
            ':version' => $version,
            ':checksum' => $checksum,
        ]);
        fwrite(STDOUT, 'Migración aplicada: ' . $version . PHP_EOL);
    }
}

try {
    $nombreBloqueo = 'bf_mig_' . substr(hash('sha256', configValor('DB_NAME', 'barberfaster')), 0, 24);
    $bloqueo = $pdo->prepare('SELECT GET_LOCK(:nombre, 0)');
    $bloqueo->execute([':nombre' => $nombreBloqueo]);

    if ((int) $bloqueo->fetchColumn() !== 1) {
        throw new RuntimeException('Ya hay otra ejecución de migraciones en curso.');
    }

    try {
        ejecutarMigraciones($pdo);
    } finally {
        $liberarBloqueo = $pdo->prepare('SELECT RELEASE_LOCK(:nombre)');
        $liberarBloqueo->execute([':nombre' => $nombreBloqueo]);
    }
} catch (Throwable $error) {
    $mensaje = 'Error al ejecutar migraciones: ' . $error->getMessage();
    error_log($mensaje);
    fwrite(STDERR, $mensaje . PHP_EOL);
    exit(1);
}
