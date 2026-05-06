-- ============================================
-- MIGRACIÓN: Seguridad en search_path de funciones
-- Fecha: 2026-02-27
-- Descripción: Mitigación de alertas "Function Search Path Mutable"
-- ============================================

-- ============================================
-- RESOLUCIÓN
-- Las funciones de Postgres usan search_path para determinar dónde 
-- buscar las tablas internamente. Si no está fijo, alguien podría engañar
-- a la base para que llame a una tabla o función falsa con el mismo nombre.
-- Esto se resuelve anexando SET search_path = public a las funciones.
-- ============================================

-- 1. Fijar search_path en marcar_cupon_como_usado (reportado)
ALTER FUNCTION public.marcar_cupon_como_usado(UUID, UUID) SET search_path = public;

-- 2. Fijar search_path en update_updated_at_column (reportado)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. Fijar search_path preventivamente en la otra función que tenemos 
-- en el dashboard de cupones, para evitar próximos warnings (eliminado, al parecer no se ha creado aún).
