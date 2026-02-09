-- ============================================
-- Asociar usuario de prueba con código de afiliado de Fundación Padres
-- Usuario: jorge.castro.cruz@hotmail.com
-- Código de afiliado: 22380612
-- ============================================

-- Paso 1: Obtener el UUID del usuario
DO $$
DECLARE
  v_user_id UUID;
  v_microsite_id UUID;
  v_affiliate_code VARCHAR(255) := '22380612';
BEGIN
  -- Buscar el UUID del usuario por email
  SELECT id INTO v_user_id
  FROM usuarios
  WHERE email = 'jorge.castro.cruz@hotmail.com';

  -- Si no existe el usuario, mostrar error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario jorge.castro.cruz@hotmail.com no encontrado';
  END IF;

  -- Buscar el UUID del micrositio de Fundación Padres
  SELECT id INTO v_microsite_id
  FROM bonda_microsites
  WHERE microsite_id = '911299' AND activo = true;

  -- Si no existe el micrositio, mostrar error
  IF v_microsite_id IS NULL THEN
    RAISE EXCEPTION 'Micrositio de Fundación Padres (911299) no encontrado o inactivo';
  END IF;

  -- Insertar o actualizar el código de afiliado
  INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
  VALUES (v_user_id, v_microsite_id, v_affiliate_code)
  ON CONFLICT (user_id, bonda_microsite_id)
  DO UPDATE SET
    affiliate_code = v_affiliate_code,
    created_at = NOW();

  RAISE NOTICE 'Usuario % asociado con micrositio % y código de afiliado %', 
    v_user_id, v_microsite_id, v_affiliate_code;
END $$;

-- Verificar el resultado
SELECT 
  u.email,
  u.nombre,
  bm.nombre as micrositio,
  uba.affiliate_code,
  uba.created_at
FROM usuarios_bonda_afiliados uba
JOIN usuarios u ON u.id = uba.user_id
JOIN bonda_microsites bm ON bm.id = uba.bonda_microsite_id
WHERE u.email = 'jorge.castro.cruz@hotmail.com';
