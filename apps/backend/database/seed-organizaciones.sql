-- ============================================
-- Seed: Organizaciones para Testing de Pagos
-- ============================================
-- Ejecutar este script en Supabase SQL Editor
-- para tener organizaciones disponibles al donar

-- Paso 1: Agregar constraint UNIQUE en nombre si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizaciones_nombre_key'
  ) THEN
    ALTER TABLE organizaciones ADD CONSTRAINT organizaciones_nombre_key UNIQUE (nombre);
  END IF;
END $$;

-- Paso 2: Insertar organizaciones de ejemplo (todas las ONGs con micrositios Bonda)
-- Usa UPSERT para no romper foreign keys existentes
INSERT INTO organizaciones (
  nombre,
  descripcion,
  monto_minimo,
  monto_sugerido,
  activa,
  verificada,
  logo_url
) VALUES 
  (
    'Fundación Padres',
    'Ayudamos a familias en situación vulnerable con programas de educación y nutrición.',
    500,
    1000,
    true,
    true,
    'https://via.placeholder.com/150/7C3AED/FFFFFF?text=FP'
  ),
  (
    'Techo Argentina',
    'Trabajamos por un hábitat digno para todos. Construimos viviendas de emergencia en asentamientos informales.',
    1000,
    2000,
    true,
    true,
    'https://via.placeholder.com/150/EC4899/FFFFFF?text=TECHO'
  ),
  (
    'Cáritas Argentina',
    'Ayuda humanitaria y desarrollo social. Promovemos la caridad, la justicia social y la dignidad humana.',
    500,
    1500,
    true,
    true,
    'https://via.placeholder.com/150/10B981/FFFFFF?text=Caritas'
  ),
  (
    'Proyectar',
    'Organización dedicada al desarrollo comunitario y social.',
    500,
    1000,
    true,
    true,
    'https://via.placeholder.com/150/3B82F6/FFFFFF?text=PROY'
  ),
  (
    'Biblioteca Popular Rurales Argentinas',
    'Promovemos la lectura y educación en zonas rurales.',
    300,
    800,
    true,
    true,
    'https://via.placeholder.com/150/F59E0B/FFFFFF?text=BPRA'
  ),
  (
    'Haciendo Camino',
    'Acompañamos a personas en situación de vulnerabilidad.',
    400,
    900,
    true,
    true,
    'https://via.placeholder.com/150/EF4444/FFFFFF?text=HC'
  ),
  (
    'Mamis Solidarias',
    'Red de apoyo y acompañamiento para madres.',
    300,
    700,
    true,
    true,
    'https://via.placeholder.com/150/EC4899/FFFFFF?text=MS'
  ),
  (
    'Plato Lleno',
    'Combatimos el hambre y la desnutrición infantil.',
    500,
    1200,
    true,
    true,
    'https://via.placeholder.com/150/10B981/FFFFFF?text=PL'
  ),
  (
    'Monte Adentro',
    'Promovemos el desarrollo sustentable en comunidades rurales.',
    400,
    1000,
    true,
    true,
    'https://via.placeholder.com/150/84CC16/FFFFFF?text=MA'
  ),
  (
    'Proactiva',
    'Impulsamos el emprendedurismo y la inserción laboral.',
    600,
    1100,
    true,
    true,
    'https://via.placeholder.com/150/8B5CF6/FFFFFF?text=PRO'
  ),
  (
    'La Guarida',
    'Protección y cuidado de animales en situación de calle.',
    300,
    800,
    true,
    true,
    'https://via.placeholder.com/150/F97316/FFFFFF?text=LG'
  ),
  (
    'Regenerar',
    'Cuidado del medio ambiente y reciclaje.',
    400,
    900,
    true,
    true,
    'https://via.placeholder.com/150/14B8A6/FFFFFF?text=REG'
  ),
  (
    'Loros Parlantes',
    'Educación y cultura para niños y jóvenes.',
    300,
    700,
    true,
    true,
    'https://via.placeholder.com/150/F43F5E/FFFFFF?text=LP'
  )
ON CONFLICT (nombre) 
DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  monto_minimo = EXCLUDED.monto_minimo,
  monto_sugerido = EXCLUDED.monto_sugerido,
  activa = EXCLUDED.activa,
  verificada = EXCLUDED.verificada,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- Verificar que se insertaron correctamente
SELECT 
  id,
  nombre,
  monto_minimo,
  monto_sugerido,
  activa,
  verificada
FROM organizaciones
WHERE activa = true
ORDER BY nombre;

-- ============================================
-- RESULTADO ESPERADO:
-- Deberías ver 13 organizaciones activas y verificadas
-- 
-- NOTA: Este script usa UPSERT (INSERT ... ON CONFLICT)
-- para no romper foreign keys existentes en otras tablas.
-- Si una organización ya existe, se actualizan sus datos.
-- ============================================
