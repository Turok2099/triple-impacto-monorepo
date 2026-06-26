-- Agregar columnas de montos fijos para cada ONG
ALTER TABLE organizaciones
ADD COLUMN IF NOT EXISTS monto_fijo_1 DECIMAL(10, 2) DEFAULT 10000,
ADD COLUMN IF NOT EXISTS monto_fijo_2 DECIMAL(10, 2) DEFAULT 20000,
ADD COLUMN IF NOT EXISTS monto_fijo_3 DECIMAL(10, 2) DEFAULT 30000;

COMMENT ON COLUMN organizaciones.monto_fijo_1 IS 'Primer monto fijo sugerido para donaciones (min: 10000)';
COMMENT ON COLUMN organizaciones.monto_fijo_2 IS 'Segundo monto fijo sugerido para donaciones (min: 10000)';
COMMENT ON COLUMN organizaciones.monto_fijo_3 IS 'Tercer monto fijo sugerido para donaciones (min: 10000)';
