import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'CMS Triple Impacto',

  projectId: '4tk2xdm4', // Obtener de sanity.io después de crear el proyecto
  dataset: 'production',

  plugins: [structureTool(), visionTool(), colorInput()],

  schema: {
    types: schemaTypes,
  },
})
