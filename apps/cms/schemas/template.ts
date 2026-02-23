import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'template',
  title: 'Templates',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'text',
    }),
    defineField({
      name: 'activo',
      title: 'Activo',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'vistaPrevia',
      title: 'Vista Previa',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Clásico', value: 'classic'},
          {title: 'Moderno', value: 'modern'},
          {title: 'Minimalista', value: 'minimal'},
          {title: 'Corporativo', value: 'corporate'},
        ],
      },
      initialValue: 'modern',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'secciones',
      title: 'Secciones',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'tipo',
              title: 'Tipo',
              type: 'string',
              options: {
                list: [
                  {title: 'Hero', value: 'hero'},
                  {title: 'Sobre Nosotros', value: 'about'},
                  {title: 'Proyectos', value: 'projects'},
                  {title: 'Galería', value: 'gallery'},
                  {title: 'Testimonios', value: 'testimonials'},
                  {title: 'Contacto', value: 'contact'},
                  {title: 'Donaciones', value: 'donations'},
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'habilitado',
              title: 'Habilitado',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'orden',
              title: 'Orden',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {
              title: 'tipo',
              subtitle: 'orden',
            },
            prepare({title, subtitle}) {
              return {
                title: title,
                subtitle: `Orden: ${subtitle}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'permitirColores',
      title: 'Permitir Personalización de Colores',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'permitirFuentes',
      title: 'Permitir Cambio de Fuentes',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'nombre',
      media: 'vistaPrevia',
      subtitle: 'layout',
    },
  },
})
