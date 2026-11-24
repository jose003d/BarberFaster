CREATE TABLE IF NOT EXISTS barberia_pasarelas (
  id_barberia INT NOT NULL,
  proveedor VARCHAR(20) NOT NULL DEFAULT 'WOMPI',
  ambiente ENUM('sandbox', 'production') NOT NULL,
  llave_publica VARCHAR(120) NOT NULL,
  llave_privada_cifrada TEXT NOT NULL,
  secreto_integridad_cifrado TEXT NOT NULL,
  secreto_eventos_cifrado TEXT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  validado_en DATETIME DEFAULT NULL,
  actualizado_por INT DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_barberia, proveedor),
  CONSTRAINT fk_barberia_pasarelas_barberia FOREIGN KEY (id_barberia)
    REFERENCES barberias (id_barberia)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
