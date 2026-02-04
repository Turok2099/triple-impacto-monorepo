-- Eliminar "ONG Triple Impacto" de la tabla organizaciones

DELETE FROM organizaciones
WHERE nombre = 'ONG Triple Impacto';

-- Verificar que se eliminó (debería devolver 0 filas)
SELECT * FROM organizaciones WHERE nombre = 'ONG Triple Impacto';

-- Ver organizaciones restantes (debería ser 12)
SELECT 
  o.nombre AS "Organización",
  o.monto_minimo AS "Monto Mínimo",
  o.monto_sugerido AS "Monto Sugerido",
  o.activa AS "Activa"
FROM organizaciones o
WHERE o.activa = true
ORDER BY o.nombre ASC;
