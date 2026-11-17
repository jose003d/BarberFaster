<?php
// backend/config/env.php
// Carga la configuración del servidor (no se sube a Git) y la expone como
// variables de entorno para que getenv() funcione igual en XAMPP y en Hostinger.
//
// Orden de búsqueda (se usa el primero que exista):
//   1. La ruta indicada en la variable de entorno BARBERFASTER_CONFIG.
//   2. barberfaster-config.php FUERA de public_html, en la carpeta del dominio
//      (domains/barberfaster.site/barberfaster-config.php en Hostinger). El
//      despliegue por Git reemplaza public_html completo y borraría un archivo
//      dentro de él; aquí no lo toca nunca.
//   3. config.local.php en esta carpeta (XAMPP o instalaciones antiguas).

if (!defined('BARBERFASTER_ENV_CARGADO')) {
    define('BARBERFASTER_ENV_CARGADO', true);

    // Esta carpeta está en public_html/erpbarber/barberfaster/backend/config:
    // cinco niveles arriba queda la carpeta del dominio, fuera de public_html.
    $candidatos = array_filter([
        getenv('BARBERFASTER_CONFIG') ?: null,
        dirname(__DIR__, 5) . '/barberfaster-config.php',
        __DIR__ . '/config.local.php',
    ]);

    $archivoConfig = null;
    foreach ($candidatos as $candidato) {
        if (@is_file($candidato)) {
            $archivoConfig = $candidato;
            break;
        }
    }

    if ($archivoConfig !== null) {
        $config = require $archivoConfig;
        if (is_array($config)) {
            foreach ($config as $clave => $valor) {
                if (!is_string($clave) || $valor === null) {
                    continue;
                }
                // Una variable ya definida en el servidor tiene prioridad.
                if (getenv($clave) === false) {
                    $valor = is_bool($valor) ? ($valor ? '1' : '0') : (string) $valor;
                    putenv($clave . '=' . $valor);
                    $_ENV[$clave] = $valor;
                }
            }
        }
    }
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
