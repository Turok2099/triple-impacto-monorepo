-- ============================================
-- MIGRACIÓN: Correcciones de Seguridad en Supabase
-- Fecha: 2026-02-27
-- Descripción: Mitigación de alertas reportadas por Supabase
-- ============================================

-- ============================================
-- 1. Logs de Bonda (logs_sync_bonda)
-- RIESGO: Fugas de información sensible en los JSON de peticiones y respuestas.
-- RESOLUCIÓN: Hilo sellado al público (solo Backend usará Service Role que bypassa RLS).
-- ============================================
ALTER TABLE public.logs_sync_bonda ENABLE ROW LEVEL SECURITY;
-- No declaramos políticas públicas intencionalmente.

-- ============================================
-- 2. Cupones Públicos v2 (public_coupons_v2) 
-- RIESGO: Siendo pública, cualquiera puede insertar/borrar/modificar cupones sin RLS.
-- RESOLUCIÓN: Encender RLS y establecer acceso exclusivo a lectura.
-- ============================================
ALTER TABLE public.public_coupons_v2 ENABLE ROW LEVEL SECURITY;

-- Permitir a cualquier visitante consultar (solo lectura)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Cupones publicos v2 accesibles para todos' AND tablename = 'public_coupons_v2'
    ) THEN
        CREATE POLICY "Cupones publicos v2 accesibles para todos"
        ON public.public_coupons_v2
        FOR SELECT
        USING (true);
    END IF;
END $$;

-- ============================================
-- 3. Vista de Estadísticas (usuario_estadisticas_cupones)
-- RIESGO: Posibilidad de obtener estadísticas de cualquier usuario porque bypassa RLS
-- RESOLUCIÓN: Usar security_invoker para que apliquen los RLS del usuario llamante.
-- ============================================
ALTER VIEW public.usuario_estadisticas_cupones SET (security_invoker = on);
