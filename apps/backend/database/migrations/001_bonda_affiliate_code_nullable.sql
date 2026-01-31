-- Migración: bonda_affiliate_code nullable
-- El afiliado en Bonda se crea tras la confirmación del primer pago (Fiserv), no en el registro.
-- Ejecutar solo si la tabla usuarios ya existe con bonda_affiliate_code NOT NULL.
ALTER TABLE usuarios ALTER COLUMN bonda_affiliate_code DROP NOT NULL;
