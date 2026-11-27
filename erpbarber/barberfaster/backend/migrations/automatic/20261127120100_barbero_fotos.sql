CREATE TABLE IF NOT EXISTS barbero_fotos (
  id_foto INT NOT NULL AUTO_INCREMENT,
  id_barbero INT NOT NULL,
  tipo ENUM('PERFIL', 'PORTAFOLIO') NOT NULL,
  foto_datos MEDIUMBLOB NOT NULL,
  foto_mime VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_foto),
  KEY idx_barbero_fotos_barbero_tipo (id_barbero, tipo),
  CONSTRAINT fk_barbero_fotos_usuario FOREIGN KEY (id_barbero)
    REFERENCES usuarios (id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
