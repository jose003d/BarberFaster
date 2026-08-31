CREATE DATABASE IF NOT EXISTS barberfaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barberfaster;

CREATE TABLE IF NOT EXISTS `Usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `documento` VARCHAR(50) DEFAULT NULL,
  `rol` VARCHAR(30) DEFAULT 'barbero',
  `estado` TINYINT(1) DEFAULT 1,
  `foto` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuarios_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `barberias` (
  `id_barberia` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `direccion` VARCHAR(255) DEFAULT NULL,
  `ciudad` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `estado` TINYINT(1) DEFAULT 1,
  `fotos` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_barberia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `barberos` (
  `id_barbero` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_barberia` INT NOT NULL,
  `especialidad` VARCHAR(150) DEFAULT NULL,
  PRIMARY KEY (`id_barbero`),
  KEY `idx_barberos_id_usuario` (`id_usuario`),
  KEY `idx_barberos_id_barberia` (`id_barberia`),
  CONSTRAINT `fk_barberos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `Usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_barberos_barberia` FOREIGN KEY (`id_barberia`) REFERENCES `barberias` (`id_barberia`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `clientes` (
  `dni` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(150) DEFAULT NULL,
  `estado` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `eventos` (
  `id_evento` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) DEFAULT NULL,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME NOT NULL,
  `disponible` TINYINT(1) NOT NULL DEFAULT 1,
  `tipo` VARCHAR(50) DEFAULT NULL,
  `color` VARCHAR(30) DEFAULT NULL,
  `id_barbero` INT NOT NULL,
  `id_barberia` INT NOT NULL,
  `clientes_dni` VARCHAR(50) DEFAULT NULL,
  `intervalo` INT DEFAULT 30,
  `servicio` VARCHAR(100) DEFAULT NULL,
  `estado` VARCHAR(50) DEFAULT 'DISPONIBLE',
  `observaciones` TEXT DEFAULT NULL,
  `metodo_validacion` VARCHAR(20) DEFAULT NULL,
  `estado_validacion` VARCHAR(20) DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id_evento`),
  KEY `idx_eventos_barbero` (`id_barbero`),
  KEY `idx_eventos_barberia` (`id_barberia`),
  KEY `idx_eventos_inicio` (`start_datetime`),
  KEY `idx_eventos_cliente` (`clientes_dni`),
  CONSTRAINT `fk_eventos_barbero` FOREIGN KEY (`id_barbero`) REFERENCES `barberos` (`id_barbero`) ON DELETE CASCADE,
  CONSTRAINT `fk_eventos_barberia` FOREIGN KEY (`id_barberia`) REFERENCES `barberias` (`id_barberia`) ON DELETE CASCADE,
  CONSTRAINT `fk_eventos_cliente` FOREIGN KEY (`clientes_dni`) REFERENCES `clientes` (`dni`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `citas` (
  `id_cita` INT NOT NULL AUTO_INCREMENT,
  `id_evento` INT NOT NULL,
  `estado` VARCHAR(50) DEFAULT 'PENDIENTE',
  `observaciones` TEXT DEFAULT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `clientes_dni` VARCHAR(50) DEFAULT NULL,
  `Barberos_id_barbero` INT DEFAULT NULL,
  PRIMARY KEY (`id_cita`),
  KEY `idx_citas_evento` (`id_evento`),
  KEY `idx_citas_cliente` (`clientes_dni`),
  KEY `idx_citas_barbero` (`Barberos_id_barbero`),
  CONSTRAINT `fk_citas_evento` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE,
  CONSTRAINT `fk_citas_cliente` FOREIGN KEY (`clientes_dni`) REFERENCES `clientes` (`dni`) ON DELETE SET NULL,
  CONSTRAINT `fk_citas_barbero` FOREIGN KEY (`Barberos_id_barbero`) REFERENCES `barberos` (`id_barbero`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `validaciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(50) NOT NULL,
  `codigo` VARCHAR(20) NOT NULL,
  `metodo` VARCHAR(20) DEFAULT NULL,
  `estado` VARCHAR(20) DEFAULT 'PENDIENTE',
  `creado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `valido_hasta` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_validaciones_dni` (`dni`),
  KEY `idx_validaciones_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `eventos`
  ADD COLUMN IF NOT EXISTS `intervalo` INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS `servicio` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `estado` VARCHAR(50) DEFAULT 'DISPONIBLE',
  ADD COLUMN IF NOT EXISTS `observaciones` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `metodo_validacion` VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `estado_validacion` VARCHAR(20) DEFAULT 'PENDIENTE';

ALTER TABLE `Usuarios`
  ADD COLUMN IF NOT EXISTS `foto` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `clientes`
  ADD COLUMN IF NOT EXISTS `estado` TINYINT(1) DEFAULT 1;

ALTER TABLE `barberias`
  ADD COLUMN IF NOT EXISTS `fotos` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `estado` TINYINT(1) DEFAULT 1;
