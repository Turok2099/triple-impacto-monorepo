-- ============================================
-- Seed: Organizaciones para Testing de Pagos
-- ============================================
-- Ejecutar este script en Supabase SQL Editor
-- para tener organizaciones disponibles al donar

-- Limpiar organizaciones de prueba anteriores (opcional)
DELETE FROM organizaciones WHERE nombre IN (
  'Fundación Padres',
  'Techo Argentina',
  'Cáritas Argentina'
);

-- Insertar organizaciones de ejemplo
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
  );

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
-- Deberías ver 3 organizaciones activas y verificadas
-- ============================================
