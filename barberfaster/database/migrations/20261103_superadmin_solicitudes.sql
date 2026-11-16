-- Ejecutar una sola vez sobre instalaciones existentes con el esquema legado.
-- Conserva el documento como clave primaria y añade el id que usa la autenticación.
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
