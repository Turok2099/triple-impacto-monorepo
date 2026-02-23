import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'ong',
  title: 'ONGs',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'nombre',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'activo',
      title: 'Activo',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'text',
    }),
    defineField({
      name: 'mision',
      title: 'Misión',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'vision',
      title: 'Visión',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'template',
      title: 'Template',
      type: 'reference',
      to: [{type: 'template'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'personalizacion',
      title: 'Personalización',
      type: 'object',
      fields: [
        {
          name: 'colorPrimario',
          title: 'Color Primario',
          type: 'color',
        },
        {
          name: 'colorSecundario',
          title: 'Color Secundario',
          type: 'color',
        },
        {
          name: 'colorTexto',
          title: 'Color de Texto',
          type: 'color',
        },
        {
          name: 'fuentePrincipal',
          title: 'Fuente Principal',
          type: 'string',
          options: {
            list: [
              {title: 'Inter', value: 'inter'},
              {title: 'Roboto', value: 'roboto'},
              {title: 'Open Sans', value: 'opensans'},
              {title: 'Lato', value: 'lato'},
              {title: 'Montserrat', value: 'montserrat'},
            ],
          },
          initialValue: 'inter',
        },
        {
          name: 'imagenHero',
          title: 'Imagen Hero',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'galeria',
          title: 'Galería',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {name: 'imagen', type: 'image', title: 'Imagen'},
                {name: 'titulo', type: 'string', title: 'Título'},
                {name: 'descripcion', type: 'text', title: 'Descripción'},
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'contacto',
      title: 'Contacto',
      type: 'object',
      fields: [
        {name: 'email', type: 'email', title: 'Email'},
        {name: 'telefono', type: 'string', title: 'Teléfono'},
        {name: 'direccion', type: 'text', title: 'Dirección'},
        {
          name: 'redesSociales',
          title: 'Redes Sociales',
          type: 'object',
          fields: [
            {name: 'facebook', type: 'url', title: 'Facebook'},
            {name: 'twitter', type: 'url', title: 'Twitter'},
            {name: 'instagram', type: 'url', title: 'Instagram'},
            {name: 'linkedin', type: 'url', title: 'LinkedIn'},
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {name: 'titulo', type: 'string', title: 'Título SEO'},
        {name: 'descripcion', type: 'text', title: 'Descripción SEO'},
        {name: 'palabrasClave', type: 'string', title: 'Palabras Clave (separadas por comas)'},
        {
          name: 'imagenOG',
          type: 'image',
          title: 'Imagen Open Graph',
          description: 'Imagen para compartir en redes sociales',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'nombre',
      media: 'logo',
      subtitle: 'slug.current',
    },
  },
})
