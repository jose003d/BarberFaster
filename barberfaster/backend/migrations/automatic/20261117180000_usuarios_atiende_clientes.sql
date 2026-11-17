ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atiende_clientes TINYINT(1) NOT NULL DEFAULT 0 AFTER debe_cambiar_contrasena;
