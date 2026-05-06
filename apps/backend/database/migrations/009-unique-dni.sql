-- ============================================
-- Migración: Restricción UNIQUE para DNI en la tabla usuarios
-- ============================================
-- Se aplica una restricción única estricta al campo `dni` para prevenir
-- que múltiples cuentas en la base de datos se asocien al mismo 
-- número de identificación.

-- ============================================
-- PASO 1: Limpiar duplicados existentes
-- ============================================
-- Como la BD ya tiene DNIs repetidos (ej: 12345678), necesitamos 
-- dejarlos en NULL (excepto el más reciente) para que la restricción UNIQUE no falle.
-- PostgreSQL permite múltiples NULLs en columnas UNIQUE.

WITH duplicates AS (
  SELECT id, dni,
         ROW_NUMBER() OVER(PARTITION BY dni ORDER BY updated_at DESC) as row_num
  FROM usuarios
  WHERE dni IS NOT NULL AND dni != ''
)
UPDATE usuarios
SET dni = NULL
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- ============================================
-- PASO 2: Aplicar restricción UNIQUE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'usuarios_dni_key'
  ) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_dni_key UNIQUE (dni);
  END IF;
END $$;
