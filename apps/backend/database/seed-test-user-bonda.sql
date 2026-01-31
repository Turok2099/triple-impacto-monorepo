-- ============================================
-- Seed: Usuario de prueba con affiliate_code en Bonda
-- Ejecutar en Supabase → SQL Editor
-- ============================================
-- Este script crea un usuario de prueba y le asigna un affiliate_code
-- para un micrositio Bonda, simulando que ya hizo una donación.

-- Variables (ajustar según necesidad)
DO $$
DECLARE
  test_user_id UUID;
  microsite_id UUID;
  test_email TEXT := 'test@tripleimpacto.com';
  test_password_hash TEXT := '$2b$10$N9qo8uLOickgx2ZU3KmTveMR/P8e6OHAz7X9GRhDVl9.xAjLvZZrS'; -- password: "test123"
  test_affiliate_code TEXT := 'test_usuario_202';
BEGIN
  -- 1. Buscar o crear el usuario de prueba
  SELECT id INTO test_user_id FROM usuarios WHERE email = test_email;
  
  IF test_user_id IS NULL THEN
    INSERT INTO usuarios (nombre, email, telefono, provincia, localidad, password_hash, verificado)
    VALUES (
      'Usuario de Prueba',
      test_email,
      '+54 9 11 1234-5678',
      'Buenos Aires',
      'CABA',
      test_password_hash,
      true
    )
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Usuario de prueba creado: % (ID: %)', test_email, test_user_id;
  ELSE
    RAISE NOTICE 'Usuario de prueba ya existe: % (ID: %)', test_email, test_user_id;
  END IF;

  -- 2. Obtener el ID del micrositio "Club de Impacto Proyectar" (ajustar slug si es necesario)
  SELECT id INTO microsite_id FROM bonda_microsites 
  WHERE slug = 'club-impacto-proyectar' AND activo = true 
  LIMIT 1;

  IF microsite_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el micrositio "club-impacto-proyectar". Ejecutá seed-bonda-microsites.sql primero.';
  END IF;

  -- 3. Insertar affiliate_code en usuarios_bonda_afiliados (simula que ya donó)
  INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
  VALUES (test_user_id, microsite_id, test_affiliate_code)
  ON CONFLICT (user_id, bonda_microsite_id) 
  DO UPDATE SET 
    affiliate_code = EXCLUDED.affiliate_code,
    created_at = NOW();

  RAISE NOTICE 'Affiliate code asignado: % para micrositio ID: %', test_affiliate_code, microsite_id;

  -- 4. (Opcional) Crear una donación de ejemplo
  INSERT INTO donaciones (usuario_id, monto, moneda, metodo_pago, organizacion_id, organizacion_nombre, estado, completed_at)
  SELECT 
    test_user_id,
    5000.00,
    'ARS',
    'fiserv',
    bm.organizacion_id,
    'Club de Impacto Proyectar',
    'completada',
    NOW()
  FROM bonda_microsites bm
  WHERE bm.id = microsite_id
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Usuario de prueba configurado correctamente';
  RAISE NOTICE 'Email: %', test_email;
  RAISE NOTICE 'Password: test123';
  RAISE NOTICE 'Affiliate code: %', test_affiliate_code;
END $$;

-- ============================================
-- Credenciales del usuario de prueba:
-- Email: test@tripleimpacto.com
-- Password: test123
-- ============================================
-- Podés hacer login con estas credenciales en el frontend
-- y probar GET /api/bonda/cupones?microsite=club-impacto-proyectar
