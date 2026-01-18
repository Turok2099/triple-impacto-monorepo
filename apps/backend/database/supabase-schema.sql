-- ============================================
-- TRIPLE IMPACTO - ESQUEMA DE BASE DE DATOS
-- Base de datos: Supabase (PostgreSQL)
-- ============================================

-- Tabla: usuarios
-- Almacena la información de usuarios registrados en Triple Impacto
-- Se sincroniza con Bonda a través del código de afiliado (bonda_affiliate_code)
CREATE TABLE IF NOT EXISTS usuarios (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bonda_affiliate_code VARCHAR(255) UNIQUE NOT NULL, -- Código de afiliado en Bonda (único)
  
  -- Información personal
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefono VARCHAR(50),
  provincia VARCHAR(100),
  localidad VARCHAR(100),
  
  -- Autenticación (si se usa auth personalizada, sino usar Supabase Auth)
  password_hash VARCHAR(255), -- Hash de la contraseña (bcrypt)
  
  -- Estado del usuario
  estado VARCHAR(50) DEFAULT 'activo', -- activo, inactivo, eliminado
  verificado BOOLEAN DEFAULT false, -- Email verificado
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Sincronización con Bonda
  bonda_synced_at TIMESTAMP WITH TIME ZONE, -- Última sincronización con Bonda
  bonda_sync_status VARCHAR(50) DEFAULT 'pending' -- pending, synced, error
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_bonda_code ON usuarios(bonda_affiliate_code);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- Comentarios descriptivos
COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios registrados en Triple Impacto';
COMMENT ON COLUMN usuarios.bonda_affiliate_code IS 'Código único del afiliado en Bonda (sincronizado)';
COMMENT ON COLUMN usuarios.bonda_sync_status IS 'Estado de sincronización con Bonda API';

-- ============================================
-- Tabla: donaciones
-- Registra las donaciones realizadas por los usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS donaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Información de la donación
  monto DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  metodo_pago VARCHAR(50), -- mercadopago, transferencia, etc.
  
  -- Organización beneficiaria
  organizacion_id UUID, -- Referencia a tabla de organizaciones (crear después)
  organizacion_nombre VARCHAR(255),
  
  -- Estado de la donación
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, completada, fallida, reembolsada
  
  -- Información de pago externo
  payment_id VARCHAR(255), -- ID de pago externo (ej: MercadoPago)
  payment_status VARCHAR(100),
  
  -- Certificado de donación
  certificado_url TEXT,
  certificado_generado BOOLEAN DEFAULT false,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_donaciones_usuario ON donaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_donaciones_estado ON donaciones(estado);
CREATE INDEX IF NOT EXISTS idx_donaciones_created ON donaciones(created_at DESC);

COMMENT ON TABLE donaciones IS 'Registro de todas las donaciones realizadas por usuarios';

-- ============================================
-- Tabla: cupones_bonda
-- Sincronización local de cupones obtenidos de Bonda
-- (Opcional - para cache y reportes)
-- ============================================
CREATE TABLE IF NOT EXISTS cupones_bonda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Información del cupón desde Bonda
  bonda_cupon_id VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descuento VARCHAR(100),
  empresa_nombre VARCHAR(255),
  
  -- Estado del cupón
  usado BOOLEAN DEFAULT false,
  usado_at TIMESTAMP WITH TIME ZONE,
  
  -- Código del cupón (si aplica)
  codigo VARCHAR(255),
  codigo_obtenido BOOLEAN DEFAULT false,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Datos raw de Bonda (para debugging)
  bonda_raw_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_cupones_usuario ON cupones_bonda(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cupones_bonda_id ON cupones_bonda(bonda_cupon_id);
CREATE INDEX IF NOT EXISTS idx_cupones_usado ON cupones_bonda(usado);

COMMENT ON TABLE cupones_bonda IS 'Cache local de cupones de Bonda para reportes y análisis';

-- ============================================
-- Tabla: organizaciones
-- ONGs y organizaciones beneficiarias
-- ============================================
CREATE TABLE IF NOT EXISTS organizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  logo_url TEXT,
  website_url TEXT,
  
  -- Contacto
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  
  -- Estado
  activa BOOLEAN DEFAULT true,
  verificada BOOLEAN DEFAULT false,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizaciones_activa ON organizaciones(activa);
CREATE INDEX IF NOT EXISTS idx_organizaciones_nombre ON organizaciones(nombre);

COMMENT ON TABLE organizaciones IS 'Organizaciones no gubernamentales beneficiarias de donaciones';

-- ============================================
-- Tabla: logs_sync_bonda
-- Registro de sincronizaciones con Bonda
-- ============================================
CREATE TABLE IF NOT EXISTS logs_sync_bonda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  
  -- Tipo de operación
  operacion VARCHAR(50) NOT NULL, -- create, update, delete, get_cupones
  endpoint VARCHAR(255),
  
  -- Request y response
  request_data JSONB,
  response_data JSONB,
  
  -- Estado
  exitoso BOOLEAN DEFAULT false,
  error_message TEXT,
  http_status_code INTEGER,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_sync_usuario ON logs_sync_bonda(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_sync_operacion ON logs_sync_bonda(operacion);
CREATE INDEX IF NOT EXISTS idx_logs_sync_created ON logs_sync_bonda(created_at DESC);

COMMENT ON TABLE logs_sync_bonda IS 'Registro de todas las operaciones realizadas con la API de Bonda';

-- ============================================
-- TRIGGERS para updated_at automático
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donaciones_updated_at
  BEFORE UPDATE ON donaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cupones_bonda_updated_at
  BEFORE UPDATE ON cupones_bonda
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizaciones_updated_at
  BEFORE UPDATE ON organizaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) para Supabase
-- ============================================

-- Habilitar RLS en las tablas principales
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones_bonda ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para usuarios
-- Los usuarios solo pueden ver/editar su propia información
CREATE POLICY "Los usuarios pueden ver su propia información"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propia información"
  ON usuarios
  FOR UPDATE
  USING (auth.uid() = id);

-- Políticas de seguridad para donaciones
CREATE POLICY "Los usuarios pueden ver sus propias donaciones"
  ON donaciones
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden crear sus propias donaciones"
  ON donaciones
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Políticas de seguridad para cupones
CREATE POLICY "Los usuarios pueden ver sus propios cupones"
  ON cupones_bonda
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Políticas de seguridad para organizaciones
-- Las organizaciones son públicas para lectura
CREATE POLICY "Las organizaciones activas son visibles para todos"
  ON organizaciones
  FOR SELECT
  USING (activa = true);

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL - Solo para desarrollo)
-- ============================================

-- Insertar una organización de ejemplo
-- INSERT INTO organizaciones (nombre, descripcion, logo_url, website_url, email, activa, verificada)
-- VALUES (
--   'Fundación Ejemplo',
--   'Organización dedicada al triple impacto',
--   'https://example.com/logo.png',
--   'https://example.com',
--   'contacto@ejemplo.org',
--   true,
--   true
-- );

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Para ejecutar este script en Supabase:
-- 1. Ir al Dashboard de Supabase
-- 2. Seleccionar tu proyecto
-- 3. Ir a SQL Editor
-- 4. Pegar este script y ejecutar
