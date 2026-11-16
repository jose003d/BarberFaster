<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$contrasena = getenv('SUPERADMIN_PASSWORD');
if (!is_string($contrasena) || $contrasena === '') {
    fwrite(STDERR, "Define SUPERADMIN_PASSWORD antes de ejecutar este comando.\n");
    exit(1);
}
if (strlen($contrasena) > 4096) {
    fwrite(STDERR, "La contraseña excede el máximo permitido.\n");
    exit(1);
}

$correoNuevo = getenv('SUPERADMIN_EMAIL') ?: 'superadmin@barberfaster.local';
if (!filter_var($correoNuevo, FILTER_VALIDATE_EMAIL) || strlen($correoNuevo) > 120) {
    fwrite(STDERR, "SUPERADMIN_EMAIL debe ser un correo válido de máximo 120 caracteres.\n");
    exit(1);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id_usuario, rol FROM usuarios WHERE documento = :documento LIMIT 1 FOR UPDATE');
    $stmt->execute([':documento' => 'SUPERADMIN']);
    $cuenta = $stmt->fetch();

    if ($cuenta && $cuenta['rol'] !== 'SUPERADMIN') {
        throw new RuntimeException('El documento SUPERADMIN ya pertenece a otro rol.');
    }

    $stmt = $pdo->query("
        SELECT id_usuario
        FROM usuarios
        WHERE rol = 'SUPERADMIN'
        ORDER BY id_usuario
        LIMIT 1
        FOR UPDATE
    ");
    $idUsuario = $cuenta['id_usuario'] ?? $stmt->fetchColumn();

    $hash = password_hash($contrasena, PASSWORD_DEFAULT);
    if (!is_string($hash)) {
        throw new RuntimeException('No se pudo generar el hash de la contraseña.');
    }

    if ($idUsuario !== false && $idUsuario !== null) {
        $stmt = $pdo->prepare("
            UPDATE usuarios
            SET documento = 'SUPERADMIN',
                id_barberia = NULL,
                nombre_completo = 'SUPERADMIN',
                password = :password,
                rol = 'SUPERADMIN',
                estado = 'ACTIVO',
                debe_cambiar_contrasena = 0
            WHERE id_usuario = :id_usuario
        ");
        $stmt->execute([
            ':password' => $hash,
            ':id_usuario' => $idUsuario,
        ]);
    } else {
        $stmtCorreo = $pdo->prepare('SELECT 1 FROM usuarios WHERE correo = :correo LIMIT 1');
        $stmtCorreo->execute([':correo' => $correoNuevo]);
        if ($stmtCorreo->fetchColumn()) {
            throw new RuntimeException('SUPERADMIN_EMAIL ya está asociado a otra cuenta.');
        }

        $stmt = $pdo->prepare("
            INSERT INTO usuarios
                (documento, id_barberia, nombre_completo, telefono, correo, password, rol, estado)
            VALUES
                ('SUPERADMIN', NULL, 'SUPERADMIN', NULL, :correo, :password, 'SUPERADMIN', 'ACTIVO')
        ");
        $stmt->execute([
            ':correo' => $correoNuevo,
            ':password' => $hash,
        ]);
    }

    $pdo->commit();
    fwrite(STDOUT, "La cuenta SUPERADMIN quedó configurada correctamente.\n");
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, 'No se pudo configurar SUPERADMIN: ' . $error->getMessage() . "\n");
    exit(1);
}
