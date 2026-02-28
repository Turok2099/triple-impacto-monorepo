-- ============================================
-- MIGRACIÓN: Dashboard de Cupones
-- Fecha: 2026-01-27
-- Descripción: Tabla para trackear cupones solicitados por usuarios
-- ============================================

-- ============================================
-- Tabla: usuario_cupones_solicitados
-- Registra cuando un usuario solicita un cupón específico de Bonda
-- y guarda el código para mostrarlo en el dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS usuario_cupones_solicitados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con usuario
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Información del cupón desde Bonda
  bonda_cupon_id VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descuento VARCHAR(100),
  empresa_nombre VARCHAR(255),
  empresa_id VARCHAR(100),
  
  -- Código del cupón (lo más importante!)
  codigo VARCHAR(255),
  codigo_id VARCHAR(255),
  
  -- Información de afiliado y micrositio
  codigo_afiliado VARCHAR(255) NOT NULL,
  micrositio_slug VARCHAR(100),
  bonda_microsite_id UUID REFERENCES bonda_microsites(id) ON DELETE SET NULL,
  
  -- Estado del cupón
  estado VARCHAR(50) DEFAULT 'activo', -- activo, usado, vencido, cancelado
  usado_at TIMESTAMP WITH TIME ZONE,
  
  -- Información adicional
  mensaje TEXT, -- Mensaje de Bonda con instrucciones
  operadora VARCHAR(100), -- Operadora si se envió por SMS
  celular VARCHAR(50), -- Celular al que se envió (opcional)
  
  -- Imágenes del cupón
  imagen_thumbnail TEXT,
  imagen_principal TEXT,
  imagen_apaisada TEXT,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Datos raw de Bonda (para debugging y análisis)
  bonda_raw_data JSONB
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_cupones_usuario ON usuario_cupones_solicitados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_cupones_bonda_id ON usuario_cupones_solicitados(bonda_cupon_id);
CREATE INDEX IF NOT EXISTS idx_usuario_cupones_estado ON usuario_cupones_solicitados(estado);
CREATE INDEX IF NOT EXISTS idx_usuario_cupones_created ON usuario_cupones_solicitados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuario_cupones_codigo ON usuario_cupones_solicitados(codigo);

-- Comentarios descriptivos
COMMENT ON TABLE usuario_cupones_solicitados IS 'Cupones solicitados por usuarios con códigos visibles en dashboard';
COMMENT ON COLUMN usuario_cupones_solicitados.codigo IS 'Código del cupón recibido desde Bonda para usar en comercio';
COMMENT ON COLUMN usuario_cupones_solicitados.estado IS 'Estado: activo (puede usarse), usado (ya utilizado), vencido (expiró), cancelado';
COMMENT ON COLUMN usuario_cupones_solicitados.bonda_raw_data IS 'Datos completos del cupón desde Bonda API para referencia';

-- ============================================
-- TRIGGER para updated_at automático
-- ============================================
CREATE TRIGGER update_usuario_cupones_solicitados_updated_at
  BEFORE UPDATE ON usuario_cupones_solicitados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE usuario_cupones_solicitados ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios cupones solicitados
CREATE POLICY "Los usuarios pueden ver sus propios cupones solicitados"
  ON usuario_cupones_solicitados
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Los usuarios pueden crear sus propios cupones solicitados
CREATE POLICY "Los usuarios pueden crear sus propios cupones solicitados"
  ON usuario_cupones_solicitados
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Los usuarios pueden actualizar sus propios cupones (marcar como usado)
CREATE POLICY "Los usuarios pueden actualizar sus propios cupones"
  ON usuario_cupones_solicitados
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- ============================================
-- VISTA: Estadísticas de usuario
-- Para mostrar en el dashboard
-- ============================================
CREATE OR REPLACE VIEW usuario_estadisticas_cupones AS
SELECT 
  usuario_id,
  COUNT(*) FILTER (WHERE estado = 'activo') as cupones_activos,
  COUNT(*) FILTER (WHERE estado = 'usado') as cupones_usados,
  COUNT(*) as total_cupones_solicitados,
  MAX(created_at) as ultimo_cupon_solicitado
FROM usuario_cupones_solicitados
GROUP BY usuario_id;

COMMENT ON VIEW usuario_estadisticas_cupones IS 'Estadísticas agregadas de cupones por usuario para dashboard';

-- ============================================
-- FUNCIÓN: Marcar cupón como usado
-- ============================================
CREATE OR REPLACE FUNCTION marcar_cupon_como_usado(
  p_cupon_id UUID,
  p_usuario_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE usuario_cupones_solicitados
  SET 
    estado = 'usado',
    usado_at = NOW()
  WHERE 
    id = p_cupon_id 
    AND usuario_id = p_usuario_id
    AND estado = 'activo'
  RETURNING TRUE INTO v_updated;
  
  RETURN COALESCE(v_updated, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION marcar_cupon_como_usado IS 'Marca un cupón como usado por el usuario';

-- ============================================
-- FUNCIÓN: Verificar si usuario puede solicitar cupón
-- (Sin límites por ahora, solo para tracking)
-- ============================================
CREATE OR REPLACE FUNCTION puede_solicitar_cupon(
  p_usuario_id UUID,
  p_bonda_cupon_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_puede_solicitar BOOLEAN := TRUE;
  v_ya_solicitado BOOLEAN;
BEGIN
  -- Verificar si ya solicitó este mismo cupón y aún está activo
  SELECT EXISTS(
    SELECT 1 
    FROM usuario_cupones_solicitados 
    WHERE usuario_id = p_usuario_id 
      AND bonda_cupon_id = p_bonda_cupon_id
      AND estado = 'activo'
  ) INTO v_ya_solicitado;
  
  -- Por ahora solo verificamos duplicados activos
  -- Puedes agregar más lógica aquí (límites por mes, etc.)
  IF v_ya_solicitado THEN
    v_puede_solicitar := FALSE;
  END IF;
  
  RETURN v_puede_solicitar;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION puede_solicitar_cupon IS 'Verifica si el usuario puede solicitar un cupón específico (sin duplicados activos)';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- Para ejecutar esta migración:
-- 1. Copiar este SQL
-- 2. Ir a Supabase Dashboard → SQL Editor
-- 3. Ejecutar el script
-- 4. Verificar que la tabla se creó correctamente
