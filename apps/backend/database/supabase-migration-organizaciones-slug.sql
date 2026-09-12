-- ============================================
-- Migración: asegurar columnas y constraint de unicidad
-- para el slug de donación exclusiva de organizaciones.
--
-- Idempotente: se puede correr múltiples veces sin error.
-- Correr manualmente contra la base de Supabase real (SQL editor).
-- ============================================

ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS slug VARCHAR(80);
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS fiserv_activo BOOLEAN DEFAULT false;
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS fiserv_store_id VARCHAR(100);
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS fiserv_shared_secret TEXT;

-- Normalizar cualquier slug existente a minúsculas antes de crear el índice único,
-- para evitar que filas legacy con distinto casing rompan la constraint.
UPDATE organizaciones SET slug = LOWER(TRIM(slug)) WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizaciones_slug ON organizaciones(slug) WHERE slug IS NOT NULL;

COMMENT ON COLUMN organizaciones.slug IS 'Slug de donación exclusivo, único (case-insensitive) y opcional; habilita la URL /donar/{slug}';
