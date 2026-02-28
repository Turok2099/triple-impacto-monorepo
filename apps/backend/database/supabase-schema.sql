-- ============================================
-- TRIPLE IMPACTO - ESQUEMA DE BASE DE DATOS
-- Base de datos: Supabase (PostgreSQL)
-- ============================================

-- Tabla: usuarios
-- Almacena la información de usuarios registrados en Triple Impacto.
-- Los códigos de afiliado Bonda (uno por ONG/micrositio) se guardan en usuarios_bonda_afiliados.
CREATE TABLE IF NOT EXISTS usuarios (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
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
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- Comentarios descriptivos
COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios registrados en Triple Impacto';

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
  
  -- Montos de donación (por ONG)
  monto_minimo DECIMAL(10, 2),   -- Mínimo aceptado para donar a esta ONG (NULL = sin mínimo)
  monto_sugerido DECIMAL(10, 2), -- Monto sugerido que muestra el front (NULL = usar default en front)
  
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
COMMENT ON COLUMN organizaciones.monto_minimo IS 'Mínimo aceptado para donar a esta ONG; NULL = sin mínimo';
COMMENT ON COLUMN organizaciones.monto_sugerido IS 'Monto sugerido que muestra el front; NULL = usar default en front';

-- ============================================
-- Tabla: bonda_microsites
-- Configuración por programa/micrositio de Bonda (token + microsite_id).
-- Un registro por cada “club” o programa de beneficios; los cupones cambian por micrositio.
-- ============================================
CREATE TABLE IF NOT EXISTS bonda_microsites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación del programa
  nombre VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Credenciales Bonda (sensibles; usar solo en backend)
  api_token TEXT NOT NULL,
  microsite_id VARCHAR(100),
  
  -- Vinculación opcional con nuestra tabla de organizaciones
  organizacion_id UUID REFERENCES organizaciones(id) ON DELETE SET NULL,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonda_microsites_slug ON bonda_microsites(slug);
CREATE INDEX IF NOT EXISTS idx_bonda_microsites_organizacion ON bonda_microsites(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_bonda_microsites_activo ON bonda_microsites(activo);

COMMENT ON TABLE bonda_microsites IS 'Token y microsite_id de Bonda por programa; los cupones son distintos por micrositio';
COMMENT ON COLUMN bonda_microsites.api_token IS 'Token/API key de Bonda para este micrositio (no exponer al frontend)';
COMMENT ON COLUMN bonda_microsites.slug IS 'Identificador único para resolver config en backend (ej: club-impacto-proyectar)';

-- ============================================
-- Tabla: usuarios_bonda_afiliados
-- Relación N:N usuario ↔ micrositio Bonda. Un usuario puede tener un affiliate_code por ONG.
-- Se crea/actualiza tras la confirmación del primer pago (webhook Fiserv) por esa ONG.
-- ============================================
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
COMMENT ON COLUMN usuarios_bonda_afiliados.affiliate_code IS 'Código de afiliado en Bonda para este usuario en este micrositio';

-- ============================================
-- Tabla: public_coupons
-- Catálogo público de cupones (Estado 1 – Visitantes). Se muestra sin códigos.
-- ============================================
CREATE TABLE IF NOT EXISTS public_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  descuento TEXT,
  imagen_url TEXT,
  empresa TEXT,
  categoria TEXT,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_coupons_activo ON public_coupons(activo);
CREATE INDEX IF NOT EXISTS idx_public_coupons_orden ON public_coupons(orden);

COMMENT ON TABLE public_coupons IS 'Catálogo público de cupones para visitantes (sin códigos)';

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

CREATE TRIGGER update_bonda_microsites_updated_at
  BEFORE UPDATE ON bonda_microsites
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
ALTER TABLE bonda_microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_bonda_afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_coupons ENABLE ROW LEVEL SECURITY;

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

-- Políticas de seguridad para bonda_microsites
-- Contiene tokens; solo el backend (service_role) debe acceder.
-- Sin políticas para anon/authenticated → solo service_role puede leer/escribir.
-- (El service_role de Supabase ignora RLS por defecto.)

-- Políticas de seguridad para usuarios_bonda_afiliados
-- Usuarios solo ven sus propias filas (user_id = auth.uid()).
-- INSERT/UPDATE/DELETE vía backend (service_role) en webhook.
CREATE POLICY "Usuarios ven sus afiliados Bonda"
  ON usuarios_bonda_afiliados
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas de seguridad para public_coupons
-- Lectura pública para cupones activos (visitantes sin login).
CREATE POLICY "Cupones públicos activos visibles para todos"
  ON public_coupons
  FOR SELECT
  USING (activo = true);

-- ============================================
-- DATOS INICIALES: bonda_microsites (programas conocidos)
-- Ejecutar tras crear la tabla y reemplazar {TOKEN} por el valor real de Bonda.
-- ============================================
-- INSERT INTO bonda_microsites (nombre, slug, api_token, activo) VALUES
--   ('Club de Impacto Proyectar', 'club-impacto-proyectar', '{TOKEN}', true),
--   ('Beneficios Biblioteca Rurales Argentinas', 'beneficios-biblioteca-rurales', '{TOKEN}', true),
--   ('Beneficios Haciendo Camino', 'beneficios-haciendo-camino', '{TOKEN}', true),
--   ('Comunidad Mamis Solidarias', 'comunidad-mamis-solidarias', '{TOKEN}', true),
--   ('Club Plato Lleno', 'club-plato-lleno', '{TOKEN}', true),
--   ('Beneficios Monte Adentro', 'beneficios-monte-adentro', '{TOKEN}', true),
--   ('Beneficios Fundación Padres', 'beneficios-fundacion-padres', '{TOKEN}', true),
--   ('Club Proactiva', 'club-proactiva', '{TOKEN}', true),
--   ('Beneficios La Guarida', 'beneficios-la-guarida', '{TOKEN}', true),
--   ('Comunidad Techo', 'comunidad-techo', '{TOKEN}', true),
--   ('Regenerar Club', 'regenerar-club', '{TOKEN}', true),
--   ('Beneficios Loros Parlantes', 'beneficios-loros-parlantes', '{TOKEN}', true);

-- ============================================
-- DATOS INICIALES: public_coupons (catálogo público – mock)
-- Ejecutar para tener cupones de ejemplo en la landing.
-- ============================================
-- INSERT INTO public_coupons (titulo, descripcion, descuento, empresa, categoria, orden, activo) VALUES
--   ('2x1 en entradas de cine', 'Válido en cines participantes', '2x1', 'Cinemark', 'entretenimiento', 1, true),
--   ('10% en compras online', 'Código al donar', '10%', 'Netshoes', 'moda', 2, true),
--   ('Combo 2x1 en restaurantes', 'Presentando beneficio', '2x1', 'Wendy''s', 'gastronomia', 3, true);

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
