-- ============================================
-- ELIMINAR "ONG Triple Impacto" de la tabla organizaciones
-- ============================================
-- Triple Impacto es la plataforma/intermediario, NO una ONG beneficiaria

-- ============================================
-- PASO 1: Verificar si tiene datos relacionados
-- ============================================

-- Ver si tiene donaciones asociadas
SELECT COUNT(*) AS "Donaciones asociadas"
FROM donaciones
WHERE organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'ONG Triple Impacto');

-- Ver si tiene micrositios vinculados
SELECT COUNT(*) AS "Micrositios vinculados"
FROM bonda_microsites
WHERE organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'ONG Triple Impacto');

-- Ver si tiene payment_attempts
SELECT COUNT(*) AS "Payment attempts asociados"
FROM payment_attempts
WHERE organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'ONG Triple Impacto');

-- ============================================
-- PASO 2: Eliminar la organización
-- ============================================

-- Si no tiene datos relacionados, se puede eliminar directamente
DELETE FROM organizaciones
WHERE nombre = 'ONG Triple Impacto';

-- Verificar que se eliminó
SELECT 
  nombre AS "Organización",
  activa AS "Activa"
FROM organizaciones
WHERE nombre ILIKE '%triple impacto%';

-- ============================================
-- PASO 3: Verificar organizaciones restantes
-- ============================================

-- Debe quedar solo las 12 organizaciones con micrositios Bonda
SELECT 
  o.nombre AS "Organización",
  CASE 
    WHEN bm.id IS NOT NULL THEN '✅ Con micrositio Bonda'
    ELSE '⚠️ Sin micrositio'
  END AS "Estado",
  o.activa AS "Activa"
FROM organizaciones o
LEFT JOIN bonda_microsites bm ON bm.organizacion_id = o.id
ORDER BY o.nombre ASC;

-- Contar total
SELECT COUNT(*) AS "Total Organizaciones"
FROM organizaciones
WHERE activa = true;
