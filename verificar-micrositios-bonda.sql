-- ============================================
-- SCRIPT PARA REVISAR MICROSITIOS DE BONDA
-- ============================================

-- 1. Ver todos los micrositios con sus datos básicos
-- ============================================
SELECT 
  id,
  nombre,
  slug,
  microsite_id AS "ID Bonda",
  activo,
  organizacion_id AS "Vinculado a Org",
  created_at AS "Fecha Creación",
  last_synced_at AS "Última Sincronización"
FROM bonda_microsites
ORDER BY nombre ASC;

-- 2. Ver micrositios con JOIN a organizaciones (para ver la relación)
-- ============================================
SELECT 
  bm.nombre AS "Micrositio Bonda",
  bm.slug,
  bm.microsite_id AS "ID Bonda API",
  bm.activo AS "Activo",
  bm.organizacion_id AS "Org ID",
  o.nombre AS "Organización Vinculada",
  o.monto_minimo AS "Monto Min Org",
  o.monto_sugerido AS "Monto Sugerido Org",
  CASE 
    WHEN bm.organizacion_id IS NULL THEN '❌ Sin vincular'
    ELSE '✅ Vinculado'
  END AS "Estado Vinculación"
FROM bonda_microsites bm
LEFT JOIN organizaciones o ON bm.organizacion_id = o.id
ORDER BY bm.nombre ASC;

-- 3. Ver solo los micrositios ACTIVOS (los que aparecerán en el formulario)
-- ============================================
SELECT 
  bm.nombre AS "Micrositio",
  bm.slug,
  COALESCE(o.nombre, bm.nombre) AS "Nombre a Mostrar",
  COALESCE(o.monto_minimo, 5000) AS "Monto Mínimo",
  COALESCE(o.monto_sugerido, 10000) AS "Monto Sugerido",
  bm.activo
FROM bonda_microsites bm
LEFT JOIN organizaciones o ON bm.organizacion_id = o.id
WHERE bm.activo = true
ORDER BY bm.nombre ASC;

-- 4. Contar cuántos micrositios hay por estado
-- ============================================
SELECT 
  activo AS "Estado",
  COUNT(*) AS "Cantidad",
  CASE 
    WHEN activo = true THEN '✅ Se mostrará en formulario'
    ELSE '❌ No se mostrará'
  END AS "Descripción"
FROM bonda_microsites
GROUP BY activo;

-- 5. Verificar micrositios SIN organizacion_id (necesitan vincularse)
-- ============================================
SELECT 
  nombre AS "Micrositio Sin Vincular",
  slug,
  microsite_id AS "ID Bonda",
  '⚠️ Usar UPDATE para vincular' AS "Acción"
FROM bonda_microsites
WHERE organizacion_id IS NULL
ORDER BY nombre ASC;

-- 6. Ver las últimas sincronizaciones de cupones
-- ============================================
SELECT 
  nombre AS "Micrositio",
  last_synced_at AS "Última Sync",
  CASE 
    WHEN last_synced_at IS NULL THEN '❌ Nunca sincronizado'
    WHEN last_synced_at < NOW() - INTERVAL '1 day' THEN '⚠️ Hace más de 1 día'
    ELSE '✅ Reciente'
  END AS "Estado Sync"
FROM bonda_microsites
WHERE activo = true
ORDER BY last_synced_at DESC NULLS LAST;

-- ============================================
-- SCRIPTS DE ACTUALIZACIÓN (Si es necesario)
-- ============================================

-- 7. EJEMPLO: Vincular micrositio "Beneficios Fundación Padres" a una organización
-- ============================================
-- PRIMERO: Crear la organización si no existe
/*
INSERT INTO organizaciones (nombre, descripcion, monto_minimo, monto_sugerido, activa)
VALUES (
  'Fundación Padres',
  'Apoyamos a familias con hijos con discapacidad',
  5000,
  10000,
  true
)
RETURNING id;
*/

-- SEGUNDO: Vincular el micrositio con la organización
/*
UPDATE bonda_microsites
SET organizacion_id = 'uuid-de-la-organizacion-aqui'
WHERE slug = 'beneficios-fundacion-padres';
*/

-- 8. ACTIVAR/DESACTIVAR micrositios
-- ============================================
-- Activar un micrositio específico
/*
UPDATE bonda_microsites
SET activo = true
WHERE slug = 'beneficios-fundacion-padres';
*/

-- Desactivar un micrositio
/*
UPDATE bonda_microsites
SET activo = false
WHERE slug = 'nombre-del-micrositio';
*/

-- 9. Ver estructura completa de la tabla
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bonda_microsites'
ORDER BY ordinal_position;
