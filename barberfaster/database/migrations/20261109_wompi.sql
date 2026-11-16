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
