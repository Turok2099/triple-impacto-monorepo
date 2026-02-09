-- =====================================================
-- Configurar micrositio de Fundación Padres en Supabase
-- =====================================================
-- Este script asegura que SOLO el micrositio de Fundación Padres
-- esté activo y correctamente configurado.

-- PASO 1: Desactivar todos los micrositios existentes
UPDATE bonda_microsites 
SET activo = false 
WHERE activo = true;

-- PASO 2: Insertar o actualizar el micrositio de Fundación Padres
INSERT INTO bonda_microsites (
  nombre,
  slug,
  api_token,
  microsite_id,
  organizacion_id,
  activo,
  created_at,
  updated_at
)
VALUES (
  'Beneficios Fundación Padres',
  'beneficios-fundacion-padres',
  'DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq',
  '911299',
  NULL, -- Sin organizacion_id por ahora
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) 
DO UPDATE SET
  nombre = EXCLUDED.nombre,
  api_token = EXCLUDED.api_token,
  microsite_id = EXCLUDED.microsite_id,
  activo = true,
  updated_at = NOW();

-- PASO 3: Verificar que quedó correctamente configurado
SELECT 
  id,
  nombre,
  slug,
  microsite_id,
  activo,
  LEFT(api_token, 20) || '...' as api_token_preview,
  created_at,
  last_synced_at
FROM bonda_microsites
ORDER BY activo DESC, nombre;

-- RESULTADO ESPERADO:
-- Solo debería haber 1 registro activo: Fundación Padres
-- microsite_id = 911299
-- slug = beneficios-fundacion-padres
-- activo = true
