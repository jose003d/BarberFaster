CREATE DATABASE IF NOT EXISTS barberfaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barberfaster;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS resenas;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS barberos_has_especialidades;
DROP TABLE IF EXISTS especialidades;
DROP TABLE IF EXISTS tarifas;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS validaciones;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS barberos;
DROP TABLE IF EXISTS barberias;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30) NULL,
  documento VARCHAR(50) NULL,
  rol ENUM('superadmin', 'admin', 'barbero') NOT NULL DEFAULT 'barbero',
  estado TINYINT(1) NOT NULL DEFAULT 1,
  foto VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_documento (documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE barberias (
  id_barberia INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario_admin INT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NULL,
  descripcion TEXT NULL,
  logo_url VARCHAR(255) NULL,
  datos_contacto JSON NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_barberia),
  KEY idx_barberias_admin (id_usuario_admin),
  CONSTRAINT fk_barberias_admin FOREIGN KEY (id_usuario_admin) REFERENCES usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE barberos (
  id_barbero INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_barberia INT UNSIGNED NOT NULL,
  id_usuario INT UNSIGNED NULL,
  nombre VARCHAR(150) NOT NULL,
  foto VARCHAR(255) NULL,
  perfil TEXT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_barbero),
  UNIQUE KEY uq_barbero_usuario (id_usuario),
  KEY idx_barberos_barberia (id_barberia),
  CONSTRAINT fk_barberos_barberia FOREIGN KEY (id_barberia) REFERENCES barberias (id_barberia) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_barberos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clientes (
  dni VARCHAR(50) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NULL,
  telefono VARCHAR(30) NULL,
  correo VARCHAR(150) NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (dni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE servicios (
  id_servicio INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_barberia INT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  duracion_estimada SMALLINT UNSIGNED NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_servicio),
  KEY idx_servicios_barberia (id_barberia),
  CONSTRAINT fk_servicios_barberia FOREIGN KEY (id_barberia) REFERENCES barberias (id_barberia) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tarifas (
  id_tarifa INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_servicio INT UNSIGNED NOT NULL,
  id_barberia INT UNSIGNED NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id_tarifa),
  UNIQUE KEY uq_tarifa_servicio_barberia (id_servicio, id_barberia),
  CONSTRAINT fk_tarifas_servicio FOREIGN KEY (id_servicio) REFERENCES servicios (id_servicio) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_tarifas_barberia FOREIGN KEY (id_barberia) REFERENCES barberias (id_barberia) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE especialidades (
  id_especialidad INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_especialidad),
  UNIQUE KEY uq_especialidad_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE barberos_has_especialidades (
  id_barbero INT UNSIGNED NOT NULL,
  id_especialidad INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_barbero, id_especialidad),
  CONSTRAINT fk_bhe_barbero FOREIGN KEY (id_barbero) REFERENCES barberos (id_barbero) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_bhe_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades (id_especialidad) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE eventos (
  id_evento INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_barbero INT UNSIGNED NOT NULL,
  id_barberia INT UNSIGNED NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  estado_disponibilidad ENUM('DISPONIBLE', 'BLOQUEADO', 'RESERVADO') NOT NULL DEFAULT 'DISPONIBLE',
  PRIMARY KEY (id_evento),
  KEY idx_eventos_barbero_horario (id_barbero, start_datetime, end_datetime),
  KEY idx_eventos_barberia (id_barberia),
  CONSTRAINT fk_eventos_barbero FOREIGN KEY (id_barbero) REFERENCES barberos (id_barbero) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_eventos_barberia FOREIGN KEY (id_barberia) REFERENCES barberias (id_barberia) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_eventos_rango CHECK (end_datetime > start_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE citas (
  id_cita INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_evento INT UNSIGNED NOT NULL,
  id_servicio INT UNSIGNED NOT NULL,
  dni_cliente VARCHAR(50) NOT NULL,
  id_barbero INT UNSIGNED NOT NULL,
  estado ENUM('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_cita),
  UNIQUE KEY uq_cita_evento (id_evento),
  KEY idx_citas_cliente (dni_cliente),
  KEY idx_citas_barbero (id_barbero),
  CONSTRAINT fk_citas_evento FOREIGN KEY (id_evento) REFERENCES eventos (id_evento) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_citas_servicio FOREIGN KEY (id_servicio) REFERENCES servicios (id_servicio) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_citas_cliente FOREIGN KEY (dni_cliente) REFERENCES clientes (dni) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_citas_barbero FOREIGN KEY (id_barbero) REFERENCES barberos (id_barbero) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE validaciones (
  id_validacion INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dni_cliente VARCHAR(50) NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  estado ENUM('PENDIENTE', 'VERIFICADO', 'EXPIRADO') NOT NULL DEFAULT 'PENDIENTE',
  creado_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valido_hasta DATETIME NOT NULL,
  PRIMARY KEY (id_validacion),
  KEY idx_validaciones_cliente_codigo (dni_cliente, codigo),
  CONSTRAINT fk_validaciones_cliente FOREIGN KEY (dni_cliente) REFERENCES clientes (dni) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE resenas (
  id_resena INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cita INT UNSIGNED NOT NULL,
  dni_cliente VARCHAR(50) NOT NULL,
  calificacion TINYINT UNSIGNED NOT NULL,
  comentario TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_resena),
  UNIQUE KEY uq_resena_cita (id_cita),
  CONSTRAINT fk_resenas_cita FOREIGN KEY (id_cita) REFERENCES citas (id_cita) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_resenas_cliente FOREIGN KEY (dni_cliente) REFERENCES clientes (dni) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_resenas_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
