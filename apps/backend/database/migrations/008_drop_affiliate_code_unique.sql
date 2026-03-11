-- Permite que el mismo affiliate_code exista en varios micrositios para el mismo usuario.
-- Bonda asigna el mismo código (ej. DNI) cuando el afiliado ya existe en otro micrositio.
-- Se mantiene UNIQUE(user_id, bonda_microsite_id): una fila por (usuario, ONG).

DROP INDEX IF EXISTS idx_usuarios_bonda_afiliados_code;

-- Índice no único para búsquedas por affiliate_code (ej. getUsuarioByBondaCode).
CREATE INDEX IF NOT EXISTS idx_usuarios_bonda_afiliados_code ON usuarios_bonda_afiliados(affiliate_code);

COMMENT ON TABLE usuarios_bonda_afiliados IS 'Afiliados Bonda por usuario y micrositio; un usuario puede repetir affiliate_code en distintos micrositios (mismo DNI en varias ONGs).';
