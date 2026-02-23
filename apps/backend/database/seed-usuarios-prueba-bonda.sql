-- ============================================
-- Script: Insertar Usuarios de Prueba Bonda
-- ============================================
-- Este script crea 12 usuarios de prueba vinculados con sus códigos de afiliado Bonda
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- 1. Crear usuario de prueba principal
INSERT INTO usuarios (nombre, email, telefono, provincia, localidad, password_hash, estado, verificado)
VALUES 
  ('Usuario Prueba Bonda', 'test@tripleimpacto.local', '+54 9 11 1234-5678', 'Buenos Aires', 'CABA', 
   '$2b$10$TEST.HASH.PLACEHOLDER', 'activo', true)
ON CONFLICT (email) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  updated_at = NOW();

-- Guardar el user_id para las siguientes inserciones
DO $$
DECLARE
  v_user_id UUID;
  v_microsite_id UUID;
BEGIN
  -- Obtener el ID del usuario recién creado
  SELECT id INTO v_user_id FROM usuarios WHERE email = 'test@tripleimpacto.local';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo crear el usuario test@tripleimpacto.local';
  END IF;

  -- Insertar vinculación con todos los micrositios
  
  -- 1. Club de Impacto Proyectar
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911436';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12346000')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 2. Biblioteca Rurales Argentinas
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911406';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345684')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 3. Haciendo Camino
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911405';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345683')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 4. Mamis Solidarias
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911340';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345718')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 5. Plato Lleno
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911322';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345700')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 6. Monte Adentro
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911321';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345699')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 7. Fundación Padres (PRINCIPAL)
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911299';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345777')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 8. Proactiva
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911265';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345743')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 9. La Guarida
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911249';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345727')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 10. Techo
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911215';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345693')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 11. Regenerar Club
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911193';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345771')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  -- 12. Loros Parlantes
  SELECT id INTO v_microsite_id FROM bonda_microsites WHERE microsite_id = '911192';
  IF v_microsite_id IS NOT NULL THEN
    INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
    VALUES (v_user_id, v_microsite_id, '12345770')
    ON CONFLICT (user_id, bonda_microsite_id) DO UPDATE SET affiliate_code = EXCLUDED.affiliate_code;
  END IF;

  RAISE NOTICE 'Usuario de prueba creado exitosamente: %', v_user_id;
  RAISE NOTICE 'Total de vinculaciones creadas: 12 micrositios';
END $$;

-- Verificar resultado
SELECT 
  u.nombre,
  u.email,
  COUNT(uba.id) as total_micrositios_vinculados
FROM usuarios u
LEFT JOIN usuarios_bonda_afiliados uba ON u.id = uba.user_id
WHERE u.email = 'test@tripleimpacto.local'
GROUP BY u.id, u.nombre, u.email;

-- Ver detalles de las vinculaciones
SELECT 
  u.email,
  bm.nombre as micrositio,
  bm.microsite_id,
  uba.affiliate_code,
  uba.created_at
FROM usuarios u
INNER JOIN usuarios_bonda_afiliados uba ON u.id = uba.user_id
INNER JOIN bonda_microsites bm ON uba.bonda_microsite_id = bm.id
WHERE u.email = 'test@tripleimpacto.local'
ORDER BY bm.nombre;
