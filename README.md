# Triple Impacto Monorepo

Monorepo que contiene las aplicaciones frontend y backend del proyecto Triple Impacto, gestionado con Turborepo para optimizar el desarrollo y la construcción de ambas aplicaciones.

## 📋 Tabla de Contenidos

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Scripts Disponibles](#scripts-disponibles)
- [Desarrollo](#desarrollo)
- [Información para Desarrolladores](#información-para-desarrolladores)
- [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
- [Contribuir](#contribuir)

## 🏗️ Estructura del Proyecto

```
triple-impacto-monorepo/
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
│       ├── backend.yml   # Pipeline CI para backend
│       └── frontend.yml  # Pipeline CI para frontend
├── apps/
│   ├── backend/          # Aplicación backend con NestJS
│   │   ├── src/          # Código fuente
│   │   │   ├── main.ts   # Punto de entrada
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── app.service.ts
│   │   ├── test/         # Tests end-to-end
│   │   ├── eslint.config.mjs
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── package.json
│   ├── frontend/         # Aplicación frontend con Next.js
│   │   ├── app/          # App Router de Next.js
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── public/       # Archivos estáticos
│   │   ├── eslint.config.mjs
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── cms/              # CMS para gestión de ONGs con Payload
│       ├── src/          # Código fuente
│       │   ├── collections/  # Colecciones de Payload
│       │   ├── server.ts     # Servidor Express + Payload
│       │   └── payload.config.ts
│       ├── public/       # Archivos estáticos y medios
│       ├── QUICKSTART.md # Guía de inicio rápido
│       ├── INTEGRACION-NEXTJS.md  # Guía de integración
│       ├── tsconfig.json
│       └── package.json
├── packages/             # Paquetes compartidos (futuro)
├── package.json          # Configuración raíz del monorepo
├── turbo.json            # Configuración de Turborepo
└── README.md
```

## 🛠️ Tecnologías

### Backend (`apps/backend`)

- **Framework**: [NestJS](https://nestjs.com/) v11.0.1
- **Runtime**: Node.js con Express
- **Lenguaje**: TypeScript v5.7.3
- **Testing**: Jest v30.0.0
- **Linting**: ESLint v9.18.0 + Prettier v3.4.2
- **Dependencias principales**:
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
  - `rxjs` v7.8.1
  - `reflect-metadata` v0.2.2

### Frontend (`apps/frontend`)

- **Framework**: [Next.js](https://nextjs.org/) v16.0.6
- **Librería UI**: React v19.2.0
- **Lenguaje**: TypeScript v5
- **Estilos**: Tailwind CSS v4
- **Linting**: ESLint v9 con `eslint-config-next`

### CMS (`apps/cms`) 🆕

- **Plataforma**: [Sanity.io](https://www.sanity.io/)
- **SDK**: Sanity v5.9.0
- **Plugins**: Vision Tool, Color Input
- **Lenguaje**: TypeScript
- **Características**:
  - Headless CMS moderno y escalable
  - Studio web integrado
  - Sistema de gestión de contenido para ONGs
  - Templates personalizables con colores y fuentes
  - Personalización de imágenes y galerías
  - API REST y GraphQL automática
  - Editor de contenido rico (Portable Text)
  - Optimización de imágenes con CDN global
  - Plan gratuito generoso

### Monorepo

- **Herramienta**: [Turborepo](https://turbo.build/) v2.6.1
- **Gestor de paquetes**: npm

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior recomendada)
- **npm** (viene incluido con Node.js)
- **Git**

## 🚀 Instalación

1. **Clonar el repositorio**:

```bash
git clone https://github.com/Turok2099/triple-impacto-monorepo.git
```

2. **Navegar al directorio del proyecto**:

```bash
cd triple-impacto-monorepo
```

3. **Instalar dependencias**:

```bash
npm install
```

Este comando instalará todas las dependencias tanto del monorepo raíz como de las aplicaciones frontend y backend.

## 📜 Scripts Disponibles

### Scripts del Monorepo (raíz)

Desde la raíz del proyecto, puedes ejecutar:

- `npm run dev` - Inicia ambas aplicaciones (frontend y backend) en modo desarrollo
- `npm run build` - Construye ambas aplicaciones para producción
- `npm run lint` - Ejecuta el linter en todas las aplicaciones
- `npm run test` - Ejecuta los tests en todas las aplicaciones

### Scripts del Backend (`apps/backend`)

Navega a `apps/backend` para ejecutar:

- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm run build` - Compila el proyecto TypeScript
- `npm run start` - Inicia el servidor en modo producción
- `npm run start:prod` - Ejecuta la versión compilada del servidor
- `npm run start:debug` - Inicia el servidor en modo debug
- `npm run lint` - Ejecuta ESLint y corrige errores automáticamente
- `npm run format` - Formatea el código con Prettier
- `npm run test` - Ejecuta los tests unitarios
- `npm run test:watch` - Ejecuta los tests en modo watch
- `npm run test:cov` - Ejecuta los tests con cobertura
- `npm run test:e2e` - Ejecuta los tests end-to-end

### Scripts del Frontend (`apps/frontend`)

Navega a `apps/frontend` para ejecutar:

- `npm run dev` - Inicia el servidor de desarrollo de Next.js
- `npm run build` - Construye la aplicación para producción
- `npm run lint` - Ejecuta ESLint

## 💻 Desarrollo

### Iniciar el proyecto completo

Para iniciar ambas aplicaciones simultáneamente:

```bash
npm run dev
```

Esto iniciará:

- **Backend**: Por defecto en `http://localhost:3000` (configurable con variable de entorno `PORT`)
- **Frontend**: Por defecto en `http://localhost:3001` (Next.js usa el siguiente puerto disponible si 3000 está ocupado)
- **CMS**: Por defecto en `http://localhost:3002` (ver [Guía de inicio del CMS](#cms))

### Desarrollo individual

Si prefieres trabajar en una sola aplicación:

**Backend:**

```bash
cd apps/backend
npm run dev
```

**Frontend:**

```bash
cd apps/frontend
npm run dev
```

**CMS:**

```bash
cd apps/cms
npm run dev
```

### Configuración del CMS 🆕

El CMS (Sanity) requiere configuración inicial:

1. **Lee la guía de inicio rápido**: `apps/cms/QUICKSTART.md`
2. **Crea un proyecto en Sanity.io** (gratuito): https://www.sanity.io
3. **Configura tu Project ID**: Edita `apps/cms/sanity.config.ts`
4. **Autentícate**: `cd apps/cms && npx sanity login`
5. **Inicia el Studio**: `npm run dev`
6. **Accede al Studio**: http://localhost:3333

Para integración con Next.js, ver: `apps/cms/INTEGRACION-NEXTJS.md`

## 👥 Información para Desarrolladores

### Para Desarrolladores Backend

#### Estructura del Backend

El backend sigue la arquitectura modular de NestJS:

```
apps/backend/
├── src/
│   ├── main.ts              # Punto de entrada de la aplicación
│   ├── app.module.ts        # Módulo raíz
│   ├── app.controller.ts    # Controlador principal
│   └── app.service.ts       # Servicio principal
├── test/                    # Tests end-to-end
└── dist/                    # Código compilado (generado)
```

#### Configuración

- **Puerto**: Configurable mediante la variable de entorno `PORT` (por defecto: 3000)
- **TypeScript**: Configurado con `target: ES2023` y decoradores habilitados
- **Testing**: Jest configurado para tests unitarios y e2e

#### Variables de Entorno

Crea un archivo `.env` en `apps/backend/` con las variables necesarias:

```env
PORT=3000
# Agrega aquí otras variables de entorno según necesites
```

#### Buenas Prácticas

- Usa decoradores de NestJS para definir módulos, controladores y servicios
- Sigue la convención de nombres de NestJS
- Escribe tests para cada módulo nuevo
- Ejecuta `npm run lint` antes de hacer commit
- Usa `npm run format` para mantener el código formateado

### Para Desarrolladores Frontend

#### Estructura del Frontend

El frontend usa la estructura de App Router de Next.js:

```
apps/frontend/
├── app/                     # Directorio de la App Router
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globales
├── public/                  # Archivos estáticos
└── next.config.ts          # Configuración de Next.js
```

#### Configuración

- **Tailwind CSS**: Configurado y listo para usar
- **TypeScript**: Configurado con paths alias (`@/*` apunta a la raíz)
- **Next.js**: Versión 16.0.6 con React 19.2.0

#### Variables de Entorno

Crea un archivo `.env.local` en `apps/frontend/` para variables de entorno:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Agrega aquí otras variables de entorno públicas
```

**Nota**: Las variables de entorno que comienzan con `NEXT_PUBLIC_` son expuestas al cliente.

#### Buenas Prácticas

- Usa componentes de React con TypeScript
- Aprovecha las características de Next.js (Server Components, Server Actions, etc.)
- Usa Tailwind CSS para estilos
- Ejecuta `npm run lint` antes de hacer commit
- Sigue las convenciones de Next.js 16

## 🔄 Flujo de Trabajo con Git

El proyecto utiliza un flujo de trabajo basado en ramas separadas para frontend y backend. Sigue estos pasos según el área en la que trabajes:

### Para Desarrolladores Frontend

1. **Cambiar a la rama de desarrollo de frontend**:

```bash
git checkout dev-frontend
```

2. **Actualizar la rama local**:

```bash
git pull origin dev-frontend
```

3. **Crear una nueva rama de feature**:

```bash
git checkout -b feature/nueva-pagina
```

4. **Realizar tus cambios y commits**

5. **Hacer push de tu rama**:

```bash
git push origin feature/nueva-pagina
```

6. **Crear un Pull Request hacia `dev-frontend`**

### Para Desarrolladores Backend

1. **Cambiar a la rama de desarrollo de backend**:

```bash
git checkout dev-backend
```

2. **Actualizar la rama local**:

```bash
git pull origin dev-backend
```

3. **Crear una nueva rama de feature**:

```bash
git checkout -b feature/nueva-api
```

4. **Realizar tus cambios y commits**

5. **Hacer push de tu rama**:

```bash
git push origin feature/nueva-api
```

6. **Crear un Pull Request hacia `dev-backend`**

### Convenciones de Nombrado

- **Ramas de feature**: `feature/nombre-descriptivo` (ej: `feature/nueva-pagina`, `feature/nueva-api`)
- **Ramas de desarrollo**: `dev-frontend` y `dev-backend`
- Usa nombres descriptivos y en minúsculas separados por guiones

## 🔧 Configuración de Turborepo

El proyecto utiliza Turborepo para optimizar las tareas del monorepo:

- **Build**: Las tareas de build tienen dependencias entre sí (`dependsOn: ["^build"]`)
- **Dev**: El modo desarrollo no usa caché para reflejar cambios en tiempo real
- **Outputs**: Los artefactos de build se guardan en `dist/` (backend) y `.next/` (frontend)

## 📝 Notas Adicionales

- El proyecto está configurado para usar npm como gestor de paquetes
- Los archivos `.env` están en `.gitignore` - no se suben al repositorio
- Cada aplicación tiene su propio `package.json` y puede tener dependencias independientes
- El monorepo permite compartir código entre aplicaciones a través de la carpeta `packages/` (futuro)

## 🤝 Contribuir

Antes de contribuir, asegúrate de seguir el [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git) según corresponda (frontend o backend).

### Proceso de Contribución

1. **Sigue el flujo de Git** según tu área (frontend o backend)
2. **Realiza tus cambios** en tu rama de feature
3. **Ejecuta los linters y tests**:
   - Desde la raíz: `npm run lint` y `npm run test`
   - O desde la app específica: `cd apps/backend` o `cd apps/frontend` y ejecuta los comandos correspondientes
4. **Haz commit de tus cambios** con mensajes descriptivos:
   ```bash
   git commit -m 'feat: Agrega nueva funcionalidad'
   ```
5. **Haz push de tu rama**:
   ```bash
   git push origin feature/tu-feature
   ```
6. **Abre un Pull Request** hacia la rama correspondiente:
   - Frontend → `dev-frontend`
   - Backend → `dev-backend`

### Convenciones de Commits

- Usa prefijos descriptivos: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Ejemplos:
  - `feat: Agrega página de inicio`
  - `fix: Corrige error en endpoint de usuarios`
  - `docs: Actualiza README con nueva información`

## 📄 Licencia

Este proyecto es privado y no tiene licencia pública.
