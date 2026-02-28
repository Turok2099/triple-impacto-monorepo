-- Migración: Agregar campo DNI a la tabla usuarios
-- Este campo es necesario para la creación de usuarios en Bonda

-- Agregar columna dni
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dni VARCHAR(20);

-- Agregar índice para búsquedas rápidas por DNI
CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);

-- Comentario descriptivo
COMMENT ON COLUMN usuarios.dni IS 'Documento Nacional de Identidad del usuario (requerido para Bonda)';
