-- Migración: Agregar columna slug a la tabla organizaciones y poblar
-- de manera predeterminada desde bonda_microsites si existe y está activo.

ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Poblar con slugs existentes desde bonda_microsites
UPDATE organizaciones o
SET slug = bm.slug
FROM bonda_microsites bm
WHERE bm.organizacion_id = o.id AND bm.activo = true AND o.slug IS NULL;
