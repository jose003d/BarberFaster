ALTER TABLE wompi_pagos ADD COLUMN IF NOT EXISTS ambiente ENUM('sandbox', 'production') DEFAULT NULL AFTER moneda;
