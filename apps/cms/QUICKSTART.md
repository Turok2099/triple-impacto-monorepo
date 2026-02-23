# 🚀 Guía de Inicio Rápido - Sanity CMS

## Paso 1: Crear Proyecto en Sanity.io

1. Ve a https://www.sanity.io
2. Haz click en **"Get started for free"**
3. Regístrate con Google, GitHub o email
4. Crea un nuevo proyecto:
   - Nombre del proyecto: **"Triple Impacto CMS"** (o el que prefieras)
   - Dataset: **production**
5. **¡IMPORTANTE!** Copia el **Project ID** que te muestra (algo como `abc12345`)

## Paso 2: Configurar Project ID

1. Abre el archivo `apps/cms/sanity.config.ts`
2. Reemplaza `'TU_PROJECT_ID'` con tu Project ID real:

```typescript
projectId: '4tk2xdm4', // <-- Tu Project ID aquí
```

3. Guarda el archivo

## Paso 3: Autenticarte

Abre una terminal en `apps/cms` y ejecuta:

```bash
cd apps/cms
npx sanity login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Sanity.

## Paso 4: Iniciar el Studio

```bash
npm run dev
```

El Sanity Studio se abrirá en: **http://localhost:3333**

## Paso 5: Crear Contenido

### Crear un Template

1. En el Studio, ve a **Templates** (en el menú lateral)
2. Click en **"Create new template"**
3. Completa:
   - **Nombre**: Template Moderno
   - **Layout**: Moderno
   - **Activo**: ✓
4. Agrega secciones:
   - Hero (orden 1)
   - Sobre Nosotros (orden 2)
   - Galería (orden 3)
5. **Publish**

### Crear una ONG

1. Ve a **ONGs** (en el menú lateral)
2. Click en **"Create new ong"**
3. Completa:
   - **Nombre**: Mi Primera ONG
   - **Slug**: Click en "Generate" (creará automáticamente `mi-primera-ong`)
   - **Activo**: ✓
   - **Template**: Selecciona el template que creaste
4. **Personalización**:
   - Selecciona colores
   - Sube imágenes
5. **Contacto**: Agrega tu información
6. **Publish**

## Paso 6: Ver tu Contenido

### API REST

Abre en tu navegador:

```
https://TU_PROJECT_ID.api.sanity.io/v2024-01-01/data/query/production?query=*[_type=="ong"]
```

(Reemplaza `TU_PROJECT_ID` con tu Project ID real)

Verás tu contenido en formato JSON! 🎉

### Integrar con Next.js

Sigue la guía en `INTEGRACION-NEXTJS.md` para conectar tu frontend.

## 🎯 Próximos Pasos

1. **Invitar Colaboradores**: En el dashboard de Sanity.io, puedes invitar a otros usuarios
2. **Configurar Webhooks**: Para revalidación automática en Next.js
3. **Personalizar Schemas**: Agrega más campos según tus necesidades
4. **Deploy del Studio**: Hospeda el Studio en Sanity con `npm run deploy`

## ⚠️ Problemas Comunes

### "Project ID not found"
- Verifica que copiaste correctamente el Project ID de tu proyecto en Sanity.io
- Asegúrate de haber guardado el archivo `sanity.config.ts`

### "Not authenticated"
- Ejecuta `npx sanity login` de nuevo
- Verifica que iniciaste sesión en el navegador

### El Studio no inicia
- Verifica que instalaste las dependencias: `npm install`
- Revisa que estás en el directorio correcto: `apps/cms`

## 📚 Recursos

- **Dashboard de Sanity**: https://www.sanity.io/manage
- **Documentación**: https://www.sanity.io/docs
- **Comunidad**: https://www.sanity.io/community

## 💡 Tips

- El plan gratuito de Sanity incluye:
  - 3 usuarios gratis
  - Unlimited API requests (CDN)
  - 10GB de assets
  - 2 datasets

¡Perfecto para empezar!
