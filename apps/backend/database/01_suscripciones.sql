-- ============================================
-- Tabla: suscripciones
-- Gestiona las donaciones recurrentes de los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  
  -- Para procesar el pago necesitamos el payment_method (token guardado)
  payment_method_id UUID NOT NULL, -- Asume que ya existe la tabla user_payment_methods
  
  -- Detalles del pago
  monto DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  frecuencia VARCHAR(50) DEFAULT 'mensual',
  
  -- Ciclo de vida
  fecha_proximo_cobro DATE NOT NULL,
  estado VARCHAR(50) DEFAULT 'activa', -- activa, pausada, cancelada, fallida
  reintentos INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para el cron job y búsquedas
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_cobro ON suscripciones(fecha_proximo_cobro);
CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON suscripciones(usuario_id);

COMMENT ON TABLE suscripciones IS 'Suscripciones activas para cobro recurrente automático';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias suscripciones"
  ON suscripciones
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias suscripciones"
  ON suscripciones
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Trigger para updated_at
CREATE TRIGGER update_suscripciones_updated_at
  BEFORE UPDATE ON suscripciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
