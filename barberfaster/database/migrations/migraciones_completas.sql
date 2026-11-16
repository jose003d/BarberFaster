-- Migraciones para una base de datos existente de BarberFaster.
-- Selecciona la base de datos correcta antes de ejecutar este archivo.
-- Ejecutar una sola vez. La migracion inicial asume el esquema legado.

-- 1. Solicitudes de barberias y estructura de usuarios para autenticacion.
ALTER TABLE usuarios
  ADD COLUMN id_usuario INT NOT NULL AUTO_INCREMENT UNIQUE FIRST,
  MODIFY COLUMN documento VARCHAR(30) NOT NULL,
  MODIFY COLUMN nombre_completo VARCHAR(150) NOT NULL,
  MODIFY COLUMN id_barberia INT NULL,
  ADD COLUMN debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0 AFTER estado;

CREATE TABLE IF NOT EXISTS solicitudes_barberia (
  id_solicitud INT NOT NULL AUTO_INCREMENT,
  nombre_barberia VARCHAR(100) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  telefono_barberia VARCHAR(20) NOT NULL,
  nombre_admin VARCHAR(150) NOT NULL,
  documento_admin VARCHAR(30) NOT NULL,
  telefono_admin VARCHAR(20) NOT NULL DEFAULT '',
  correo_admin VARCHAR(120) NOT NULL,
  estado ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  id_barberia INT DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resuelto_en TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id_solicitud),
  KEY idx_solicitudes_barberia_estado (estado, creado_en),
  KEY idx_solicitudes_barberia_correo_estado (correo_admin, estado),
  CONSTRAINT fk_solicitudes_barberia_barberia
    FOREIGN KEY (id_barberia) REFERENCES barberias (id_barberia)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Recuperacion de contrasena.
CREATE TABLE IF NOT EXISTS recuperacion_contrasena (
  id_usuario INT NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira_en DATETIME NOT NULL,
  solicitado_en DATETIME NOT NULL,
  intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_recuperacion_contrasena_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Pagos Wompi y notificaciones de pagos para la barberia.
CREATE TABLE IF NOT EXISTS wompi_pagos (
  id_pago BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cita INT NOT NULL,
  referencia VARCHAR(100) NOT NULL,
  id_transaccion VARCHAR(100) DEFAULT NULL,
  monto_centavos BIGINT UNSIGNED NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'COP',
  estado ENUM('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR', 'EXPIRED', 'LATE_APPROVED')
    NOT NULL DEFAULT 'PENDING',
  expira_en DATETIME NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pago),
  UNIQUE KEY uq_wompi_pagos_cita (id_cita),
  UNIQUE KEY uq_wompi_pagos_referencia (referencia),
  UNIQUE KEY uq_wompi_pagos_transaccion (id_transaccion),
  KEY idx_wompi_pagos_estado_expiracion (estado, expira_en),
  CONSTRAINT fk_wompi_pagos_cita FOREIGN KEY (id_cita)
    REFERENCES citas (id_cita)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS notificaciones_barberia (
  id_notificacion BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_barberia INT NOT NULL,
  id_cita INT NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  mensaje VARCHAR(500) NOT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_notificacion),
  UNIQUE KEY uq_notificacion_pago_cita (id_cita, tipo),
  KEY idx_notificaciones_barberia (id_barberia, creado_en),
  CONSTRAINT fk_notificaciones_pago_barberia FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notificaciones_pago_cita FOREIGN KEY (id_cita)
    REFERENCES citas (id_cita)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Estado de los clientes (activar o desactivar).
ALTER TABLE clientes
  ADD COLUMN estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO' AFTER email;
