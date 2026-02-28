-- ============================================
-- Script: Vincular Organizaciones con Micrositios Bonda
-- ============================================
-- Ejecutar en Supabase → SQL Editor
-- Este script asocia cada micrositio de Bonda con su organización correspondiente
-- ============================================

-- 1. Vincular Fundación Padres
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Fundación Padres')
WHERE slug = 'beneficios-fundacion-padres';

-- 2. Vincular Techo Argentina
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Techo Argentina')
WHERE slug = 'comunidad-techo';

-- 3. Vincular Proyectar
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Proyectar')
WHERE slug = 'club-impacto-proyectar';

-- 4. Vincular Biblioteca Popular Rurales Argentinas
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Biblioteca Popular Rurales Argentinas')
WHERE slug = 'beneficios-biblioteca-rurales';

-- 5. Vincular Haciendo Camino
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Haciendo Camino')
WHERE slug = 'beneficios-haciendo-camino';

-- 6. Vincular Mamis Solidarias
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Mamis Solidarias')
WHERE slug = 'comunidad-mamis-solidarias';

-- 7. Vincular Plato Lleno
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Plato Lleno')
WHERE slug = 'club-plato-lleno';

-- 8. Vincular Monte Adentro
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Monte Adentro')
WHERE slug = 'beneficios-monte-adentro';

-- 9. Vincular Proactiva
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Proactiva')
WHERE slug = 'club-proactiva';

-- 10. Vincular La Guarida
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'La Guarida')
WHERE slug = 'beneficios-la-guarida';

-- 11. Vincular Regenerar
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Regenerar')
WHERE slug = 'regenerar-club';

-- 12. Vincular Loros Parlantes
UPDATE bonda_microsites
SET organizacion_id = (SELECT id FROM organizaciones WHERE nombre = 'Loros Parlantes')
WHERE slug = 'beneficios-loros-parlantes';

-- Verificar vinculaciones
SELECT 
  bm.nombre AS micrositio,
  bm.slug,
  o.nombre AS organizacion,
  CASE 
    WHEN bm.organizacion_id IS NOT NULL THEN '✅ Vinculado'
    ELSE '❌ Sin vincular'
  END AS estado
FROM bonda_microsites bm
LEFT JOIN organizaciones o ON bm.organizacion_id = o.id
WHERE bm.activo = true
ORDER BY estado DESC, bm.nombre;

-- ============================================
-- RESULTADO ESPERADO:
-- Deberías ver "Beneficios Fundación Padres" y "Comunidad Techo" vinculados
-- Los demás micrositios aparecerán como "Sin vincular"
-- ============================================
