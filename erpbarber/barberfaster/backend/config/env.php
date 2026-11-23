<?php
// backend/config/env.php
// Carga la configuración del servidor (no se sube a Git) y la expone como
// variables de entorno para que getenv() funcione igual en XAMPP y en Hostinger.
//
// Fuentes, de mayor a menor prioridad (una clave ya definida no se sobrescribe):
//   0. Variables definidas por el propio servidor (SetEnv, panel, etc.).
//   1. El archivo indicado en BARBERFASTER_ENV (formato .env).
//   2. .env FUERA de public_html, en la carpeta del dominio
//      (domains/barberfaster.site/.env en Hostinger). El despliegue por Git
//      reemplaza public_html completo y borraría un archivo dentro de él.
//   3. backend/.env (XAMPP). Su .htaccess impide abrirlo desde el navegador.
//   4. Formato antiguo en PHP (array): BARBERFASTER_CONFIG,
//      barberfaster-config.php en la carpeta del dominio o config.local.php.

if (!defined('BARBERFASTER_ENV_CARGADO')) {
    define('BARBERFASTER_ENV_CARGADO', true);

    // Esta carpeta está en public_html/erpbarber/barberfaster/backend/config:
    // cinco niveles arriba queda la carpeta del dominio, fuera de public_html.
    $carpetaDominio = dirname(__DIR__, 5);

    $definirVariable = static function (string $clave, $valor): void {
        if ($clave === '' || $valor === null || getenv($clave) !== false) {
            return;
        }
        $valor = is_bool($valor) ? ($valor ? '1' : '0') : (string) $valor;
        putenv($clave . '=' . $valor);
        $_ENV[$clave] = $valor;
    };

    // Interpreta un archivo .env: CLAVE=valor, comentarios con #, comillas
    // simples (literal) o dobles (admite \n, \t, \" y \\).
    $leerDotEnv = static function (string $archivo): array {
        $lineas = @file($archivo, FILE_IGNORE_NEW_LINES);
        if ($lineas === false) {
            return [];
        }
        $valores = [];
        foreach ($lineas as $numero => $linea) {
            if ($numero === 0) {
                $linea = preg_replace('/^\xEF\xBB\xBF/', '', $linea); // BOM
            }
            $linea = trim($linea);
            if ($linea === '' || $linea[0] === '#') {
                continue;
            }
            if (!preg_match('/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/', $linea, $m)) {
                continue;
            }
            [$clave, $valor] = [$m[1], $m[2]];

            if ($valor !== '' && ($valor[0] === '"' || $valor[0] === "'")) {
                $comilla = $valor[0];
                $fin = strrpos($valor, $comilla);
                $valor = $fin > 0 ? substr($valor, 1, $fin - 1) : substr($valor, 1);
                if ($comilla === '"') {
                    $valor = strtr($valor, ['\\n' => "\n", '\\t' => "\t", '\\"' => '"', '\\\\' => '\\']);
                }
            } else {
                // Comentario al final de un valor sin comillas: "valor # nota"
                $valor = trim(preg_replace('/\s+#.*$/', '', $valor));
            }
            $valores[$clave] = $valor;
        }
        return $valores;
    };

    $archivosDotEnv = array_filter([
        getenv('BARBERFASTER_ENV') ?: null,
        $carpetaDominio . '/.env',
        dirname(__DIR__) . '/.env',
    ]);
    foreach ($archivosDotEnv as $archivo) {
        if (@is_file($archivo) && @is_readable($archivo)) {
            foreach ($leerDotEnv($archivo) as $clave => $valor) {
                // Una línea vacía (CLAVE=) no bloquea el valor de los archivos
                // siguientes, p. ej. el barberfaster-config.php anterior.
                if ($valor !== '') {
                    $definirVariable($clave, $valor);
                }
            }
        }
    }

    // Formato antiguo (array PHP). Se usa el primero que exista.
    $archivosPhp = array_filter([
        getenv('BARBERFASTER_CONFIG') ?: null,
        $carpetaDominio . '/barberfaster-config.php',
        __DIR__ . '/config.local.php',
    ]);
    foreach ($archivosPhp as $archivo) {
        if (@is_file($archivo)) {
            $config = require $archivo;
            if (is_array($config)) {
                foreach ($config as $clave => $valor) {
                    if (is_string($clave)) {
                        $definirVariable($clave, $valor);
                    }
                }
            }
            break;
        }
    }

    unset($carpetaDominio, $definirVariable, $leerDotEnv, $archivosDotEnv, $archivosPhp, $archivo, $config, $clave, $valor);
}

// Lee una variable de configuración con un valor por defecto.
if (!function_exists('configValor')) {
    function configValor(string $clave, ?string $porDefecto = null): ?string
    {
        $valor = getenv($clave);
        return $valor === false || $valor === '' ? $porDefecto : $valor;
    }
}

// Devuelve la ruta pública donde está instalada la aplicación, terminada en "/".
// Ejemplos: "/erpbarber/barberfaster/" en XAMPP o "/" en la raíz del dominio.
if (!function_exists('rutaBaseApp')) {
    function rutaBaseApp(): string
    {
        $configurada = configValor('APP_BASE_PATH');
        if ($configurada !== null) {
            return '/' . trim($configurada, '/') . (trim($configurada, '/') === '' ? '' : '/');
        }

        $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
        $posicion = strpos($script, '/backend/');
        if ($posicion === false) {
            return '/';
        }
        return substr($script, 0, $posicion + 1);
    }
}
