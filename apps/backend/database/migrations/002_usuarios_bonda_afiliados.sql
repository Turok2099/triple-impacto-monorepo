-- Migración: tabla usuarios_bonda_afiliados (multi-ONG)
-- Un usuario puede tener un affiliate_code por micrositio/ONG.
-- Ejecutar en BD que aún tiene usuarios.bonda_affiliate_code (tras 001 o schema antiguo).

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS usuarios_bonda_afiliados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  bonda_microsite_id UUID NOT NULL REFERENCES bonda_microsites(id) ON DELETE CASCADE,
  affiliate_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bonda_microsite_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_bonda_afiliados_user ON usuarios_bonda_afiliados(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_bonda_afiliados_microsite ON usuarios_bonda_afiliados(bonda_microsite_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_bonda_afiliados_code ON usuarios_bonda_afiliados(affiliate_code);

COMMENT ON TABLE usuarios_bonda_afiliados IS 'Afiliados Bonda por usuario y micrositio; un código por (usuario, ONG)';

-- 2. Migrar datos existentes: usuarios con bonda_affiliate_code → primer micrositio por slug
-- Solo si la columna existe y hay un micrositio por defecto.
DO $$
DECLARE
  default_microsite_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'bonda_affiliate_code'
  ) THEN
    SELECT id INTO default_microsite_id FROM bonda_microsites WHERE slug = 'club-impacto-proyectar' AND activo = true LIMIT 1;
    IF default_microsite_id IS NOT NULL THEN
      INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
      SELECT u.id, default_microsite_id, u.bonda_affiliate_code
      FROM usuarios u
      WHERE u.bonda_affiliate_code IS NOT NULL AND u.bonda_affiliate_code != ''
      ON CONFLICT (user_id, bonda_microsite_id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- 3. Eliminar columnas antiguas de usuarios
ALTER TABLE usuarios DROP COLUMN IF EXISTS bonda_affiliate_code;
ALTER TABLE usuarios DROP COLUMN IF EXISTS bonda_sync_status;
ALTER TABLE usuarios DROP COLUMN IF EXISTS bonda_synced_at;
DROP INDEX IF EXISTS idx_usuarios_bonda_code;

-- 4. RLS (si se usa)
ALTER TABLE usuarios_bonda_afiliados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus afiliados Bonda" ON usuarios_bonda_afiliados;
CREATE POLICY "Usuarios ven sus afiliados Bonda"
  ON usuarios_bonda_afiliados
  FOR SELECT
  USING (auth.uid() = user_id);
