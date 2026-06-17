-- =====================================================================
-- Script: Limpiar Historial de Pagos y Registros sin Borrar al Usuario
-- =====================================================================

DO $$
DECLARE
  target_user_id UUID;
  target_email VARCHAR := 'jorge.castro.cruz@hotmail.com';
BEGIN
  -- 1. Obtener el ID del usuario por su email
  SELECT id INTO target_user_id 
  FROM public.usuarios 
  WHERE email = target_email;

  IF target_user_id IS NOT NULL THEN
    -- 2. Eliminar suscripciones recurrentes
    DELETE FROM public.suscripciones WHERE usuario_id = target_user_id;

    -- 3. Eliminar métodos de pago guardados (tokens de tarjetas)
    DELETE FROM public.user_payment_methods WHERE user_id = target_user_id;

    -- 4. Eliminar afiliaciones registradas en Bonda
    DELETE FROM public.usuarios_bonda_afiliados WHERE user_id = target_user_id;

    -- 5. Eliminar historial de donaciones
    DELETE FROM public.donaciones WHERE usuario_id = target_user_id;

    -- 6. Eliminar historial de intentos de pago (payment_attempts)
    DELETE FROM public.payment_attempts WHERE user_id = target_user_id;

    -- 7. Eliminar logs de sincronización con Bonda de este usuario
    DELETE FROM public.logs_sync_bonda WHERE usuario_id = target_user_id;

    -- 8. Opcional: Eliminar cupones solicitados guardados en cache
    DELETE FROM public.cupones_bonda WHERE usuario_id = target_user_id;

    RAISE NOTICE '¡Listo! Se ha limpiado todo el historial del usuario % (ID: %). El usuario sigue existiendo en el sistema para iniciar sesión.', target_email, target_user_id;
  ELSE
    RAISE NOTICE 'No se encontró ningún usuario con el correo %', target_email;
  END IF;
END $$;
