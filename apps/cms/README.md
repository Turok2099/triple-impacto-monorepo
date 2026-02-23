# CMS Triple Impacto - Sanity

Sistema de gestión de contenido para ONGs construido con Sanity.io.

## 🚀 Características

- ✅ Gestión de ONGs con templates personalizables
- ✅ Personalización de colores, fuentes e imágenes
- ✅ Editor de contenido rico
- ✅ Galería de imágenes
- ✅ SEO optimizado
- ✅ API REST y GraphQL automática
- ✅ Studio web moderno y fácil de usar

## 📋 Requisitos

- Node.js 18+
- Cuenta en Sanity.io (gratuita)

## 🛠️ Configuración Inicial

### 1. Crear proyecto en Sanity.io

1. Ve a https://www.sanity.io y crea una cuenta (gratuita)
2. Crea un nuevo proyecto
3. Copia el **Project ID** que te dan

### 2. Configurar el proyecto local

1. Edita `sanity.config.ts` y reemplaza `TU_PROJECT_ID` con tu Project ID real:

```typescript
projectId: 'tu-project-id-aqui',
```

### 3. Autenticarte

```bash
cd apps/cms
npx sanity login
```

### 4. Iniciar el Studio

```bash
npm run dev
```

El Studio estará disponible en: http://localhost:3333

## 📁 Estructura

```
apps/cms/
├── schemas/
│   ├── ong.ts         # Schema de ONGs
│   ├── template.ts    # Schema de Templates
│   └── index.ts       # Export de schemas
├── sanity.config.ts   # Configuración principal
├── package.json
└── README.md
```

## 🎨 Schemas Disponibles

### ONGs
- Información básica (nombre, slug, logo)
- Contenido rico (misión, visión)
- Personalización (colores, fuentes, imágenes)
- Galería de fotos
- Contacto y redes sociales
- SEO

### Templates
- Templates base personalizables
- Configuración de layout
- Secciones configurables
- Control de personalización

## 🌐 Consumir la API

Sanity proporciona automáticamente una API REST y GraphQL para tu contenido.

### API REST

```typescript
// Ejemplo: Obtener todas las ONGs activas
const query = encodeURIComponent('*[_type == "ong" && activo == true]')
const url = `https://TU_PROJECT_ID.api.sanity.io/v2022-03-07/data/query/production?query=${query}`

const response = await fetch(url)
const data = await response.json()
```

### Con el cliente de Sanity (Recomendado)

```bash
npm install @sanity/client
```

```typescript
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'TU_PROJECT_ID',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})

// Obtener ONGs
const ongs = await client.fetch('*[_type == "ong" && activo == true]')
```

## 🔗 Integración con Next.js

Ver el archivo `INTEGRACION-NEXTJS.md` para ejemplos detallados de cómo integrar Sanity con tu frontend de Next.js.

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el Studio en desarrollo (puerto 3333)
- `npm run build` - Construye el Studio para producción
- `npm run deploy` - Despliega el Studio a Sanity.io
- `npm start` - Inicia el Studio en producción

## 🔐 Permisos

Los permisos se configuran directamente en el dashboard de Sanity.io:
- https://www.sanity.io/manage

Puedes invitar usuarios y asignarles roles (Admin, Editor, Viewer, etc.)

## 🎨 Personalización

Para agregar más campos o schemas:

1. Crea un nuevo archivo en `schemas/`
2. Define tu schema con `defineType()`
3. Impórtalo y agrégalo al array en `schemas/index.ts`

## 📚 Recursos

- [Documentación de Sanity](https://www.sanity.io/docs)
- [Schema Types](https://www.sanity.io/docs/schema-types)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [Sanity Client](https://www.sanity.io/docs/js-client)

## 🆘 Soporte

- Comunidad de Sanity: https://www.sanity.io/community
- Slack de Sanity: https://slack.sanity.io
