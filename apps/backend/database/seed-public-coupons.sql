-- ============================================
-- Seed: Cupones públicos mock para landing
-- Ejecutar en Supabase → SQL Editor
-- ============================================
-- Estos cupones se muestran en la landing pública (sin códigos).
-- Son información GENERAL de descuentos, no códigos reales.
-- Al donar, el usuario obtendrá acceso a los cupones reales de Bonda con códigos.

INSERT INTO public_coupons (titulo, descripcion, descuento, imagen_url, empresa, categoria, orden, activo) VALUES
  (
    '2x1 en entradas de cine',
    'Presentá tu beneficio en la boletería y disfrutá de 2x1 en tu entrada',
    '2x1',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
    'Cinemark',
    'entretenimiento',
    1,
    true
  ),
  (
    '10% de descuento en compras online',
    'Usá tu código exclusivo al finalizar la compra',
    '10%',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
    'Netshoes',
    'moda',
    2,
    true
  ),
  (
    '2x1 en combos de hamburguesas',
    'Válido en locales participantes de todo el país',
    '2x1',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
    'Wendy''s',
    'gastronomia',
    3,
    true
  ),
  (
    '15% OFF en viandas saludables',
    'Pedí online con tu código y recibilo en tu casa',
    '15%',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'Viandas Cormillot',
    'salud',
    4,
    true
  ),
  (
    '20% de descuento en indumentaria',
    'Aplicable en toda la tienda online',
    '20%',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop',
    'Good People',
    'moda',
    5,
    true
  ),
  (
    '$50 extra con tu carga de $50',
    'Presentá tu beneficio en cualquier sucursal',
    '$50 extra',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    'Sacoa',
    'entretenimiento',
    6,
    true
  ),
  (
    '10% OFF en entradas para eventos',
    'Consultá tu evento favorito y usá tu código',
    '10%',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
    'Premium TicketHub',
    'entretenimiento',
    7,
    true
  ),
  (
    '2x1 en helados artesanales',
    'Válido todos los días en locales participantes',
    '2x1',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
    'Grido',
    'gastronomia',
    8,
    true
  )
ON CONFLICT DO NOTHING;

-- Nota: Las imágenes son de Unsplash (Creative Commons).
-- En producción, reemplazar con imágenes reales de las empresas o de Bonda.
