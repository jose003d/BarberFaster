-- Agrega el estado de los clientes para poder activarlos o desactivarlos.
-- Ejecutar una sola vez en bases existentes.
ALTER TABLE clientes
  ADD COLUMN estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO' AFTER email;
