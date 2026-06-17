-- ============================================
-- Tabla: user_payment_methods
-- Almacena los tokens de tarjetas de los usuarios para cobros recurrentes
-- ============================================
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fiserv_token VARCHAR(255) NOT NULL,
  scheme_transaction_id VARCHAR(255),
  card_brand VARCHAR(50),
  last_4 VARCHAR(4),
  exp_month VARCHAR(2),
  exp_year VARCHAR(4),
  cardholder_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_active ON user_payment_methods(is_active);

COMMENT ON TABLE user_payment_methods IS 'Métodos de pago/tarjetas tokenizadas de usuarios procesadas por Fiserv REST';

-- RLS para user_payment_methods
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas existentes para evitar errores al re-ejecutar
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios metodos de pago" ON user_payment_methods;
CREATE POLICY "Los usuarios pueden ver sus propios metodos de pago"
  ON user_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios metodos de pago" ON user_payment_methods;
CREATE POLICY "Los usuarios pueden actualizar sus propios metodos de pago"
  ON user_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at en user_payment_methods
DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Tabla: suscripciones
-- Gestiona las donaciones recurrentes de los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  
  -- Para procesar el pago necesitamos el payment_method (token guardado)
  payment_method_id UUID NOT NULL REFERENCES user_payment_methods(id) ON DELETE RESTRICT,
  
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

-- RLS para suscripciones
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas existentes para evitar errores al re-ejecutar
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias suscripciones" ON suscripciones;
CREATE POLICY "Los usuarios pueden ver sus propias suscripciones"
  ON suscripciones
  FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias suscripciones" ON suscripciones;
CREATE POLICY "Los usuarios pueden actualizar sus propias suscripciones"
  ON suscripciones
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Trigger para updated_at en suscripciones
DROP TRIGGER IF EXISTS update_suscripciones_updated_at ON suscripciones;
CREATE TRIGGER update_suscripciones_updated_at
  BEFORE UPDATE ON suscripciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
