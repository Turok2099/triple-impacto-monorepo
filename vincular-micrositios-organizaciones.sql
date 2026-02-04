-- ============================================
-- SCRIPT PARA CREAR Y VINCULAR ORGANIZACIONES CON MICROSITIOS DE BONDA
-- ============================================
-- Este script crea las 12 organizaciones y las vincula con sus micrositios
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PASO 0: Agregar Constraint UNIQUE a nombre (si no existe)
-- ============================================

-- Esto permite usar ON CONFLICT más adelante
-- Si ya existe el constraint, no hace nada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizaciones_nombre_unique'
  ) THEN
    ALTER TABLE organizaciones 
    ADD CONSTRAINT organizaciones_nombre_unique UNIQUE (nombre);
  END IF;
END $$;

-- ============================================
-- PASO 1: Crear las 12 Organizaciones
-- ============================================

INSERT INTO organizaciones (
  nombre,
  descripcion,
  logo_url,
  monto_minimo,
  monto_sugerido,
  activa
) VALUES 
  -- 1. Fundación Padres
  (
    'Fundación Padres',
    'Apoyamos a familias con hijos con discapacidad, brindando contención y recursos.',
    NULL, -- Agregar URL del logo después
    5000,
    10000,
    true
  ),
  
  -- 2. Biblioteca Rurales Argentinas
  (
    'Biblioteca Rurales Argentinas',
    'Promovemos la lectura y educación en comunidades rurales de Argentina.',
    NULL,
    5000,
    8000,
    true
  ),
  
  -- 3. Haciendo Camino
  (
    'Haciendo Camino',
    'Trabajamos por la inclusión social y el desarrollo comunitario.',
    NULL,
    5000,
    10000,
    true
  ),
  
  -- 4. La Guarida
  (
    'La Guarida',
    'Refugio y hogar para personas en situación de vulnerabilidad.',
    NULL,
    5000,
    12000,
    true
  ),
  
  -- 5. Loros Parlantes
  (
    'Loros Parlantes',
    'Promovemos la comunicación y expresión en comunidades vulnerables.',
    NULL,
    5000,
    8000,
    true
  ),
  
  -- 6. Monte Adentro
  (
    'Monte Adentro',
    'Conservación ambiental y desarrollo sostenible en zonas rurales.',
    NULL,
    5000,
    10000,
    true
  ),
  
  -- 7. Proyectar
  (
    'Proyectar',
    'Educación y oportunidades para jóvenes en situación de vulnerabilidad.',
    NULL,
    5000,
    15000,
    true
  ),
  
  -- 8. Plato Lleno
  (
    'Plato Lleno',
    'Combatimos el hambre distribuyendo alimentos a familias necesitadas.',
    NULL,
    5000,
    10000,
    true
  ),
  
  -- 9. Proactiva
  (
    'Proactiva',
    'Soluciones innovadoras para problemas sociales y ambientales.',
    NULL,
    5000,
    12000,
    true
  ),
  
  -- 10. Mamis Solidarias
  (
    'Mamis Solidarias',
    'Red de madres apoyando a familias en situación de vulnerabilidad.',
    NULL,
    5000,
    8000,
    true
  ),
  
  -- 11. Techo
  (
    'Techo',
    'Trabajamos para superar la pobreza en asentamientos precarios.',
    NULL,
    5000,
    15000,
    true
  ),
  
  -- 12. Regenerar
  (
    'Regenerar',
    'Desarrollo sustentable y regeneración de ecosistemas.',
    NULL,
    5000,
    10000,
    true
  )

ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- PASO 2: Vincular Micrositios con Organizaciones
-- ============================================

-- 1. Fundación Padres
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Fundación Padres')
WHERE slug = 'beneficios-fundacion-padres';

-- 2. Biblioteca Rurales Argentinas
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Biblioteca Rurales Argentinas')
WHERE slug = 'beneficios-biblioteca-rurales';

-- 3. Haciendo Camino
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Haciendo Camino')
WHERE slug = 'beneficios-haciendo-camino';

-- 4. La Guarida
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'La Guarida')
WHERE slug = 'beneficios-la-guarida';

-- 5. Loros Parlantes
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Loros Parlantes')
WHERE slug = 'beneficios-loros-parlantes';

-- 6. Monte Adentro
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Monte Adentro')
WHERE slug = 'beneficios-monte-adentro';

-- 7. Proyectar
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Proyectar')
WHERE slug = 'club-impacto-proyectar';

-- 8. Plato Lleno
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Plato Lleno')
WHERE slug = 'club-plato-lleno';

-- 9. Proactiva
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Proactiva')
WHERE slug = 'club-proactiva';

-- 10. Mamis Solidarias
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Mamis Solidarias')
WHERE slug = 'comunidad-mamis-solidarias';

-- 11. Techo
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Techo')
WHERE slug = 'comunidad-techo';

-- 12. Regenerar
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Regenerar')
WHERE slug = 'regenerar-club';

-- ============================================
-- PASO 3: Verificar Vinculación
-- ============================================

-- Ver todas las vinculaciones
SELECT 
  bm.nombre AS "Micrositio Bonda",
  o.nombre AS "Organización",
  o.monto_minimo AS "Min",
  o.monto_sugerido AS "Sugerido",
  CASE 
    WHEN bm.organizacion_id IS NOT NULL THEN '✅ Vinculado'
    ELSE '❌ Sin vincular'
  END AS "Estado"
FROM bonda_microsites bm
LEFT JOIN organizaciones o ON bm.organizacion_id = o.id
WHERE bm.activo = true
ORDER BY bm.nombre ASC;

-- Contar vinculaciones exitosas
SELECT 
  COUNT(*) FILTER (WHERE organizacion_id IS NOT NULL) AS "Vinculados",
  COUNT(*) FILTER (WHERE organizacion_id IS NULL) AS "Sin Vincular",
  COUNT(*) AS "Total"
FROM bonda_microsites
WHERE activo = true;

-- ============================================
-- PASO 4 (OPCIONAL): Actualizar Montos Personalizados
-- ============================================

-- Si quieres cambiar montos específicos para alguna organización:

/*
UPDATE organizaciones
SET 
  monto_minimo = 8000,
  monto_sugerido = 20000
WHERE nombre = 'Fundación Padres';
*/

-- ============================================
-- PASO 5 (OPCIONAL): Agregar Logos
-- ============================================

-- Cuando tengas las URLs de los logos:

/*
UPDATE organizaciones
SET logo_url = 'https://ejemplo.com/logo-fundacion-padres.png'
WHERE nombre = 'Fundación Padres';

UPDATE organizaciones
SET logo_url = 'https://ejemplo.com/logo-proyectar.png'
WHERE nombre = 'Proyectar';

-- ... etc para cada organización
*/

-- ============================================
-- RESUMEN DE MONTOS CONFIGURADOS
-- ============================================

SELECT 
  nombre AS "Organización",
  CONCAT('$', TO_CHAR(monto_minimo, 'FM999,999')) AS "Monto Mínimo",
  CONCAT('$', TO_CHAR(monto_sugerido, 'FM999,999')) AS "Monto Sugerido",
  CASE 
    WHEN logo_url IS NOT NULL THEN '✅ Con logo'
    ELSE '⚠️ Sin logo'
  END AS "Logo",
  activa AS "Activa"
FROM organizaciones
ORDER BY nombre ASC;
