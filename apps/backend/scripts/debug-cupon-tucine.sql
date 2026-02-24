-- Script para debuggear el cupón de TU CINE
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar el cupón de TU CINE
SELECT 
  bonda_cupon_id,
  nombre,
  empresa_nombre,
  descuento,
  categoria_principal,
  activo,
  fecha_vencimiento
FROM public_coupons_v2
WHERE empresa_nombre ILIKE '%tu cine%' 
   OR nombre ILIKE '%tu cine%'
   OR nombre ILIKE '%2x1%cine%'
   OR nombre ILIKE '%2 x 1%cine%'
ORDER BY synced_at DESC;

-- 2. Ver todas las categorías únicas que existen en la tabla
SELECT DISTINCT categoria_principal, COUNT(*) as total_cupones
FROM public_coupons_v2
WHERE activo = true
GROUP BY categoria_principal
ORDER BY categoria_principal;

-- 3. Buscar cupones con categoría que contenga "cine", "entretenimiento" o "teatro"
SELECT DISTINCT categoria_principal
FROM public_coupons_v2
WHERE categoria_principal ILIKE '%cine%'
   OR categoria_principal ILIKE '%entretenimiento%'
   OR categoria_principal ILIKE '%teatro%'
   OR categoria_principal ILIKE '%entret%'
ORDER BY categoria_principal;
