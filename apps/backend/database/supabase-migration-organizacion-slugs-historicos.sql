-- ============================================
-- Migración: historial de slugs de organizaciones.
--
-- Cuando un admin cambia el slug de una ONG, el link de donación viejo
-- (https://.../donar/{slug-viejo}) queda registrado acá para poder
-- redirigir automáticamente al slug vigente en vez de romper el link
-- ya compartido/impreso.
--
-- Idempotente: se puede correr múltiples veces sin error.
-- Correr manualmente contra la base de Supabase real (SQL editor).
-- ============================================

CREATE TABLE IF NOT EXISTS organizacion_slugs_historicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  slug_anterior VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizacion_slugs_historicos_slug_anterior
  ON organizacion_slugs_historicos (LOWER(slug_anterior));

CREATE INDEX IF NOT EXISTS idx_organizacion_slugs_historicos_organizacion_id
  ON organizacion_slugs_historicos (organizacion_id);

COMMENT ON TABLE organizacion_slugs_historicos IS
  'Slugs anteriores de cada organización, para redirigir /donar/{slug-viejo} al slug vigente.';
