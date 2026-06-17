-- =====================================================================
-- Consulta: Fecha y Detalles del Último Pago Exitoso por Usuario
-- =====================================================================

SELECT DISTINCT ON (d.usuario_id)
  u.id AS usuario_id,
  u.nombre AS usuario_nombre,
  u.email AS usuario_email,
  d.created_at AS fecha_ultimo_pago,
  d.monto AS monto_ultimo_pago,
  d.moneda AS moneda_pago,
  COALESCE(d.organizacion_nombre, 'ONG no especificada') AS ong_beneficiaria,
  d.metodo_pago AS metodo_pago
FROM donaciones d
JOIN usuarios u ON u.id = d.usuario_id
WHERE d.estado = 'completada'
ORDER BY d.usuario_id, d.created_at DESC;
