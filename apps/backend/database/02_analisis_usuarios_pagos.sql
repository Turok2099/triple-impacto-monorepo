-- =====================================================================
-- Análisis de Métodos de Pago y Donantes para Activación Recurrente
-- =====================================================================

-- Consulta 1: Resumen general de donaciones por método de pago y estado
-- Nos permite ver el panorama de qué métodos se utilizaron históricamente.
SELECT 
  metodo_pago,
  estado,
  COUNT(id) as total_donaciones,
  SUM(monto) as total_recaudado
FROM donaciones
GROUP BY metodo_pago, estado
ORDER BY total_donaciones DESC;


-- Consulta 2: Clientes con tarjetas tokenizadas (APTOS PARA ACTIVACIÓN RECURRENTE DIRECTA)
-- Estos usuarios ya tienen un token guardado en user_payment_methods.
-- Se les puede activar una suscripción manual sin necesidad de que hagan un nuevo pago.
SELECT DISTINCT ON (u.id)
  u.id AS usuario_id,
  u.nombre AS usuario_nombre,
  u.email AS usuario_email,
  pm.id AS payment_method_id,
  pm.card_brand AS marca_tarjeta,
  pm.last_4 AS ultimos_4_digitos,
  (pm.exp_month || '/' || pm.exp_year) AS vencimiento,
  -- Sentencia SQL generada automáticamente para activarlos (debes reemplazar [ID_DE_LA_ONG_AQUÍ] y el monto de donación deseado)
  'INSERT INTO suscripciones (usuario_id, organizacion_id, payment_method_id, monto, fecha_proximo_cobro, estado) VALUES (''' 
    || u.id || ''', ''[ID_DE_LA_ONG_AQUÍ]'', ''' || pm.id || ''', 5000.00, CURRENT_DATE + INTERVAL ''1 month'', ''activa'');' AS query_activacion_rapida
FROM usuarios u
JOIN user_payment_methods pm ON pm.user_id = u.id
WHERE pm.is_active = true
ORDER BY u.id, pm.id DESC;


-- Consulta 3: Clientes que donaron por redirección externa (Fiserv Connect Hosted Page)
-- Estos usuarios NO tienen un método de pago tokenizado guardado. 
-- Para activarlos como recurrentes, DEBEN realizar un nuevo pago seleccionando "Mensual".
SELECT DISTINCT ON (u.id)
  u.id AS usuario_id,
  u.nombre AS usuario_nombre,
  u.email AS usuario_email,
  d.monto AS ultimo_monto_donado,
  d.created_at AS fecha_ultima_donacion,
  'NO (Requiere nuevo pago en la web)' AS apto_recurrente_inmediato
FROM usuarios u
JOIN donaciones d ON d.usuario_id = u.id
LEFT JOIN user_payment_methods pm ON pm.user_id = u.id AND pm.is_active = true
WHERE d.metodo_pago = 'fiserv'  -- Redirección externa
  AND pm.id IS NULL            -- Sin método de pago tokenizado guardado
ORDER BY u.id, d.created_at DESC;
