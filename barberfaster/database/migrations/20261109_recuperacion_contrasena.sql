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
