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
