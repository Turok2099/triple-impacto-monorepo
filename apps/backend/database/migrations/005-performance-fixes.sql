-- ============================================
-- MIGRACIÓN: Optimización de Rendimiento
-- Fecha: 2026-02-27
-- Descripción: Corrección de warnings del Performance Advisor
-- ============================================

-- ============================================
-- 1. Optimización del auth.uid() en Políticas RLS
-- Envolver llamadas con (select auth.uid()) para evitar que se ejecuten por cada fila.
-- ============================================

-- Tabla: usuarios
ALTER POLICY "Los usuarios pueden ver su propia información" ON public.usuarios 
  USING (id = (select auth.uid()));

ALTER POLICY "Los usuarios pueden actualizar su propia información" ON public.usuarios 
  USING (id = (select auth.uid()));

-- Tabla: donaciones
ALTER POLICY "Los usuarios pueden ver sus propias donaciones" ON public.donaciones 
  USING (usuario_id = (select auth.uid()));

ALTER POLICY "Los usuarios pueden crear sus propias donaciones" ON public.donaciones 
  WITH CHECK (usuario_id = (select auth.uid()));

-- Tabla: cupones_bonda
ALTER POLICY "Los usuarios pueden ver sus propios cupones" ON public.cupones_bonda 
  USING (usuario_id = (select auth.uid()));

-- Tabla: usuarios_bonda_afiliados
ALTER POLICY "Usuarios ven sus afiliados Bonda" ON public.usuarios_bonda_afiliados 
  USING (user_id = (select auth.uid()));

-- Tabla: payment_attempts 
-- Nota: Verificamos si la política existe primero, ya que está observada en su warning.
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Los usuarios pueden ver sus propios intentos de pago' AND tablename = 'payment_attempts') THEN
    ALTER POLICY "Los usuarios pueden ver sus propios intentos de pago" ON public.payment_attempts 
      USING (user_id = (select auth.uid()));
  END IF; 
END $$;

-- Tabla: usuario_cupones_solicitados
ALTER POLICY "Los usuarios pueden ver sus propios cupones solicitados" ON public.usuario_cupones_solicitados 
  USING (usuario_id = (select auth.uid()));

ALTER POLICY "Los usuarios pueden crear sus propios cupones solicitados" ON public.usuario_cupones_solicitados 
  WITH CHECK (usuario_id = (select auth.uid()));

ALTER POLICY "Los usuarios pueden actualizar sus propios cupones" ON public.usuario_cupones_solicitados 
  USING (usuario_id = (select auth.uid()));


-- ============================================
-- 2. Limpieza de Índices Duplicados (Duplicate Index)
-- ============================================

-- Borrando los índices creados manualmente para bonda_microsites, dado que 
-- la restricción UNIQUE crea automáticamente "bonda_microsites_slug_key"
DROP INDEX IF EXISTS public.idx_bonda_microsites_slug;

-- Borrar la restricción UNIQUE en organizaciones asumiendo que el key unique cumple el fin
-- Esto eliminará el índice automáticamente para resolver la duplicidad.
ALTER TABLE public.organizaciones DROP CONSTRAINT IF EXISTS organizaciones_nombre_unique;
