-- Migración: Agregar columna slug a la tabla organizaciones y poblar
-- de manera predeterminada con un slug amigable.

ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Poblar con slugs amigables basados en el nombre de la organización
UPDATE organizaciones o
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(
        LOWER(o.nombre),
        'áéíóúüñÁÉÍÓÚÜÑ',
        'aeiouunAEIOUUN'
      ),
      '[^a-z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE o.slug IS NULL;

-- Casos especiales o ajustes específicos
UPDATE organizaciones SET slug = 'club-plato-lleno' WHERE nombre = 'Plato Lleno';
UPDATE organizaciones SET slug = 'la-guarida' WHERE nombre = 'La Guarida';
UPDATE organizaciones SET slug = 'regenerar' WHERE nombre = 'Regenerar';
UPDATE organizaciones SET slug = 'loros-parlantes' WHERE nombre = 'Loros Parlantes';
UPDATE organizaciones SET slug = 'proactiva' WHERE nombre = 'Proactiva';
UPDATE organizaciones SET slug = 'beneficios-ikibuntu' WHERE nombre = 'Beneficios IKIBUNTU';
UPDATE organizaciones SET slug = 'volando-alto' WHERE nombre = 'Volando Alto';
UPDATE organizaciones SET slug = 'haciendo-camino' WHERE nombre = 'Haciendo Camino';
UPDATE organizaciones SET slug = 'beneficios-fundacion-inspirar' WHERE nombre = 'Beneficios Fundación Inspirar';
UPDATE organizaciones SET slug = 'bibliotecas-rurales-argentinas' WHERE nombre = 'Bibliotecas Rurales Argentinas';
UPDATE organizaciones SET slug = 'beneficios-impulso' WHERE nombre = 'Beneficios Impulso';
UPDATE organizaciones SET slug = 'mamis-solidarias' WHERE nombre = 'Mamis Solidarias';
UPDATE organizaciones SET slug = 'beneficios-alegranatas' WHERE nombre = 'Beneficios Alegrañatas';
UPDATE organizaciones SET slug = 'techo-argentina' WHERE nombre = 'TECHO Argentina';
UPDATE organizaciones SET slug = 'beneficios-puentes' WHERE nombre = 'Beneficios Puentes';
UPDATE organizaciones SET slug = 'fundacion-padres' WHERE nombre = 'Fundación Padres';
UPDATE organizaciones SET slug = 'monte-adentro' WHERE nombre = 'Monte Adentro';
