-- Migración: monto_minimo y monto_sugerido en organizaciones
-- Para que cada ONG pueda definir mínimo y monto sugerido de donación.

ALTER TABLE organizaciones
  ADD COLUMN IF NOT EXISTS monto_minimo DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS monto_sugerido DECIMAL(10, 2);

COMMENT ON COLUMN organizaciones.monto_minimo IS 'Mínimo aceptado para donar a esta ONG; NULL = sin mínimo';
COMMENT ON COLUMN organizaciones.monto_sugerido IS 'Monto sugerido que muestra el front; NULL = usar default en front';
