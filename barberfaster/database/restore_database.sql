CREATE DATABASE IF NOT EXISTS barberfaster
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE barberfaster;

-- Esquema exportado de la base local. No elimina tablas ni incluye registros.
CREATE TABLE IF NOT EXISTS barberias (
  id_barberia INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA',
  foto VARCHAR(255) DEFAULT NULL,
  hora_apertura TIME NOT NULL DEFAULT '08:00:00',
  hora_cierre TIME NOT NULL DEFAULT '19:00:00',
  -- Lista de días semanales en que la barbería recibe reservas.
  dias_trabajo VARCHAR(100) NOT NULL DEFAULT 'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO',
  descripcion TEXT DEFAULT NULL,
  url_mapa TEXT DEFAULT NULL,
  PRIMARY KEY (id_barberia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  id_barberia INT DEFAULT NULL,
  documento VARCHAR(30) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  correo VARCHAR(120) NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('SUPERADMIN', 'ADMINISTRADOR', 'BARBERO') NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uk_usuarios_documento (documento),
  UNIQUE KEY uk_usuarios_correo (correo),
  KEY fk_usuarios_barberia (id_barberia),
  CONSTRAINT fk_usuarios_barberias FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

CREATE TABLE IF NOT EXISTS barberia_fotos (
  id_foto INT NOT NULL AUTO_INCREMENT,
  id_barberia INT NOT NULL,
  foto_datos MEDIUMBLOB NOT NULL,
  foto_mime VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_foto),
  KEY idx_barberia_fotos_barberia (id_barberia),
  CONSTRAINT fk_barberia_fotos_barberia FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS clientes (
  dni VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(120) DEFAULT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (dni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS barberos (
  id_barbero INT NOT NULL AUTO_INCREMENT,
  id_barberia INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL DEFAULT '',
  email VARCHAR(120) NOT NULL DEFAULT '',
  telefono VARCHAR(20) NOT NULL DEFAULT '',
  documento VARCHAR(30) NOT NULL DEFAULT '',
  especialidad VARCHAR(100) DEFAULT NULL,
  foto VARCHAR(255) DEFAULT NULL,
  foto_datos MEDIUMBLOB DEFAULT NULL,
  foto_mime VARCHAR(50) DEFAULT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (id_barbero),
  KEY fk_barberos_barberias (id_barberia),
  CONSTRAINT fk_barberos_barberias FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS servicios (
  id_servicio INT NOT NULL AUTO_INCREMENT,
  id_barberia INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  duracion_minutos INT NOT NULL DEFAULT 30,
  precio DECIMAL(10,2) NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (id_servicio),
  KEY fk_servicios_barberias (id_barberia),
  CONSTRAINT fk_servicios_barberias FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS citas (
  id_cita INT NOT NULL AUTO_INCREMENT,
  id_barberia INT NOT NULL,
  id_barbero INT NOT NULL,
  dni_cliente VARCHAR(20) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado ENUM('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA')
    NOT NULL DEFAULT 'PENDIENTE',
  notas TEXT DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (id_cita),
  KEY fk_citas_barberias (id_barberia),
  KEY fk_citas_barberos (id_barbero),
  KEY fk_citas_clientes (dni_cliente),
  CONSTRAINT fk_citas_barberias FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_citas_barberos FOREIGN KEY (id_barbero)
    REFERENCES barberos (id_barbero)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_citas_clientes FOREIGN KEY (dni_cliente)
    REFERENCES clientes (dni)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS barbero_horarios (
  id_horario INT NOT NULL AUTO_INCREMENT,
  id_barbero INT NOT NULL,
  dia_semana ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  PRIMARY KEY (id_horario),
  UNIQUE KEY uk_barbero_dia (id_barbero, dia_semana),
  CONSTRAINT fk_horarios_barberos FOREIGN KEY (id_barbero)
    REFERENCES barberos (id_barbero)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS barbero_servicios (
  id_barbero INT NOT NULL,
  id_servicio INT NOT NULL,
  PRIMARY KEY (id_barbero, id_servicio),
  KEY id_servicio (id_servicio),
  CONSTRAINT barbero_servicios_ibfk_1 FOREIGN KEY (id_barbero)
    REFERENCES barberos (id_barbero)
    ON DELETE CASCADE,
  CONSTRAINT barbero_servicios_ibfk_2 FOREIGN KEY (id_servicio)
    REFERENCES servicios (id_servicio)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS cita_servicios (
  id_cita INT NOT NULL,
  id_servicio INT NOT NULL,
  precio_historico DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_cita, id_servicio),
  KEY fk_cs_servicios (id_servicio),
  CONSTRAINT fk_cs_citas FOREIGN KEY (id_cita)
    REFERENCES citas (id_cita)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cs_servicios FOREIGN KEY (id_servicio)
    REFERENCES servicios (id_servicio)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

CREATE TABLE IF NOT EXISTS resenas (
  id_resena INT NOT NULL AUTO_INCREMENT,
  id_cita INT NOT NULL,
  dni_cliente VARCHAR(20) NOT NULL,
  calificacion TINYINT UNSIGNED NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_resena),
  UNIQUE KEY uq_resenas_cita (id_cita),
  KEY idx_resenas_cliente (dni_cliente),
  CONSTRAINT fk_resenas_cita FOREIGN KEY (id_cita)
    REFERENCES citas (id_cita)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_resenas_cliente FOREIGN KEY (dni_cliente)
    REFERENCES clientes (dni)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_resenas_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
