-- migration: add_landing_url_to_bonda_microsites.sql
ALTER TABLE bonda_microsites ADD COLUMN IF NOT EXISTS landing_url TEXT;
COMMENT ON COLUMN bonda_microsites.landing_url IS 'URL de la landing page de Bonda para este micrositio (incluyendo tokens de acceso si aplica)';
