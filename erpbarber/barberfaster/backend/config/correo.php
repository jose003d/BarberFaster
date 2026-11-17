<?php
// backend/config/correo.php
// Envío de correos del sistema (recuperación de contraseña, etc.).
//
// Si SMTP_HOST, SMTP_USER y SMTP_PASS están definidos en barberfaster-config.php,
// el correo sale por SMTP autenticado con un buzón real del dominio (recomendado:
// en Hostinger, smtp.hostinger.com puerto 465). Sin esa configuración se usa mail()
// de PHP, que en hosting compartido suele perderse o llegar a spam.

require_once __DIR__ . '/env.php';

if (!function_exists('enviarCorreo')) {
    function enviarCorreo(string $para, string $asunto, string $texto): bool
    {
        $remitente = configValor('PASSWORD_RESET_FROM') ?? configValor('SMTP_USER');
        if (!is_string($remitente) || !filter_var($remitente, FILTER_VALIDATE_EMAIL)) {
            error_log('Correo: falta PASSWORD_RESET_FROM o SMTP_USER con un correo válido.');
            return false;
        }
        if (!filter_var($para, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $host = configValor('SMTP_HOST');
        $usuario = configValor('SMTP_USER');
        $clave = configValor('SMTP_PASS');
        if ($host !== null && $usuario !== null && $clave !== null) {
            try {
                // Hostinger solo deja enviar como el mismo buzón que inicia sesión.
                $remitenteSmtp = filter_var($usuario, FILTER_VALIDATE_EMAIL) ? $usuario : $remitente;
                return enviarCorreoSmtp($host, (int) (configValor('SMTP_PORT', '465')), $usuario, $clave, $remitenteSmtp, $para, $asunto, $texto);
            } catch (Throwable $error) {
                error_log('Correo SMTP: ' . $error->getMessage());
                return false;
            }
        }

        $cabeceras = "From: BarberFaster <{$remitente}>\r\n"
            . "Reply-To: {$remitente}\r\n"
            . "MIME-Version: 1.0\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n";
        $asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
        // -f fija el remitente del sobre; sin él muchos servidores rechazan el correo.
        return mail($para, $asuntoCodificado, $texto, $cabeceras, '-f' . $remitente);
    }
}

if (!function_exists('enviarCorreoSmtp')) {
    // Cliente SMTP mínimo: SSL implícito (465) o STARTTLS (587), AUTH LOGIN, texto plano UTF-8.
    function enviarCorreoSmtp(
        string $host,
        int $puerto,
        string $usuario,
        string $clave,
        string $remitente,
        string $para,
        string $asunto,
        string $texto
    ): bool {
        $ssl = $puerto === 465;
        $conexion = @stream_socket_client(
            ($ssl ? 'ssl://' : 'tcp://') . $host . ':' . $puerto,
            $codigoError,
            $mensajeError,
            15,
            STREAM_CLIENT_CONNECT,
            stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]])
        );
        if ($conexion === false) {
            throw new RuntimeException("No se pudo conectar a {$host}:{$puerto} ({$mensajeError}).");
        }
        stream_set_timeout($conexion, 15);

        $leer = static function () use ($conexion): string {
            $respuesta = '';
            while (($linea = fgets($conexion, 515)) !== false) {
                $respuesta .= $linea;
                // La última línea de una respuesta tiene un espacio tras el código.
                if (strlen($linea) < 4 || $linea[3] === ' ') {
                    break;
                }
            }
            return $respuesta;
        };
        // $etiqueta es lo que se registra en el log si falla (nunca las credenciales ni el mensaje).
        $comando = static function (?string $linea, array $esperados, string $etiqueta) use ($conexion, $leer): string {
            if ($linea !== null) {
                fwrite($conexion, $linea . "\r\n");
            }
            $respuesta = $leer();
            $codigo = (int) substr($respuesta, 0, 3);
            if (!in_array($codigo, $esperados, true)) {
                throw new RuntimeException("SMTP respondió '" . trim($respuesta) . "' en el paso {$etiqueta}.");
            }
            return $respuesta;
        };

        try {
            $dominioLocal = preg_replace('/[^a-z0-9.-]/i', '', substr(strrchr($remitente, '@') ?: '@localhost', 1)) ?: 'localhost';
            $comando(null, [220], 'saludo');
            $comando('EHLO ' . $dominioLocal, [250], 'EHLO');
            if (!$ssl) {
                $comando('STARTTLS', [220], 'STARTTLS');
                if (!stream_socket_enable_crypto($conexion, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('No se pudo iniciar TLS.');
                }
                $comando('EHLO ' . $dominioLocal, [250], 'EHLO');
            }
            $comando('AUTH LOGIN', [334], 'AUTH');
            $comando(base64_encode($usuario), [334], 'AUTH usuario');
            $comando(base64_encode($clave), [235], 'AUTH contraseña (revisa SMTP_USER / SMTP_PASS)');
            $comando('MAIL FROM:<' . $remitente . '>', [250], 'MAIL FROM (el remitente debe ser el buzón de SMTP_USER)');
            $comando('RCPT TO:<' . $para . '>', [250, 251], 'RCPT TO');
            $comando('DATA', [354], 'DATA');

            // El cuerpo va en base64, así que ninguna línea puede empezar con "." y cortar el DATA.
            $cuerpo = str_replace(["\r\n", "\r"], "\n", $texto);
            $mensaje = 'Date: ' . date(DATE_RFC2822) . "\r\n"
                . 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $dominioLocal . ">\r\n"
                . "From: BarberFaster <{$remitente}>\r\n"
                . "To: <{$para}>\r\n"
                . 'Subject: =?UTF-8?B?' . base64_encode($asunto) . "?=\r\n"
                . "MIME-Version: 1.0\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . "\r\n"
                . chunk_split(base64_encode(str_replace("\n", "\r\n", $cuerpo)))
                . "\r\n.";
            $comando($mensaje, [250], 'envío del mensaje');
            fwrite($conexion, "QUIT\r\n");
            return true;
        } finally {
            fclose($conexion);
        }
    }
}
