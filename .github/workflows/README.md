# Configuración de GitHub Actions

Este documento describe la configuración actual de los workflows de CI/CD (Integración Continua / Despliegue Continuo) del proyecto Triple Impacto Monorepo.

## 📋 Resumen

El proyecto utiliza GitHub Actions para automatizar tareas de integración continua. Actualmente hay dos workflows configurados que se ejecutan de forma independiente según los cambios realizados en el código:

- **Backend CI**: Pipeline para la aplicación backend
- **Frontend CI**: Pipeline para la aplicación frontend

## 🔄 Workflows Configurados

### 1. Backend CI (`backend.yml`)

#### Descripción

Workflow que se encarga de validar, construir y probar la aplicación backend cuando hay cambios en el código del backend.

#### Triggers (Disparadores)

El workflow se ejecuta automáticamente cuando:

- Se hace `push` a cualquier rama que contenga cambios en `apps/backend/**`
- Se crea o actualiza un `pull_request` que incluye cambios en `apps/backend/**`

**Configuración:**

```yaml
on:
  push:
    paths:
      - "apps/backend/**"
  pull_request:
    paths:
      - "apps/backend/**"
```

#### Jobs y Steps

**Job: `build`**

- **Runner**: `ubuntu-latest` (última versión de Ubuntu disponible)

**Steps ejecutados:**

1. **Checkout repo**

   - Acción: `actions/checkout@v3`
   - Descripción: Descarga el código del repositorio en el runner

2. **Setup Node.js**

   - Acción: `actions/setup-node@v3`
   - Versión de Node.js: `18`
   - Descripción: Configura el entorno de Node.js necesario para ejecutar el proyecto

3. **Install dependencies**

   - Comando: `cd apps/backend && npm install`
   - Descripción: Instala todas las dependencias del proyecto backend definidas en `package.json`

4. **Build project**

   - Comando: `cd apps/backend && npm run build`
   - Descripción: Compila el proyecto TypeScript del backend, generando los archivos en el directorio `dist/`

5. **Run tests**
   - Comando: `cd apps/backend && npm test`
   - Descripción: Ejecuta la suite de tests unitarios y de integración del backend usando Jest

#### Flujo Completo

```
Push/PR con cambios en apps/backend/**
    ↓
Checkout del código
    ↓
Setup Node.js 18
    ↓
Instalación de dependencias
    ↓
Compilación del proyecto
    ↓
Ejecución de tests
    ↓
✅ Pipeline exitoso o ❌ Pipeline fallido
```

---

### 2. Frontend CI (`frontend.yml`)

#### Descripción

Workflow que se encarga de validar y construir la aplicación frontend cuando hay cambios en el código del frontend.

#### Triggers (Disparadores)

El workflow se ejecuta automáticamente cuando:

- Se hace `push` a cualquier rama que contenga cambios en `apps/frontend/**`
- Se crea o actualiza un `pull_request` que incluye cambios en `apps/frontend/**`

**Configuración:**

```yaml
on:
  push:
    paths:
      - "apps/frontend/**"
  pull_request:
    paths:
      - "apps/frontend/**"
```

#### Jobs y Steps

**Job: `build`**

- **Runner**: `ubuntu-latest` (última versión de Ubuntu disponible)

**Steps ejecutados:**

1. **Checkout repo**

   - Acción: `actions/checkout@v3`
   - Descripción: Descarga el código del repositorio en el runner

2. **Setup Node.js**

   - Acción: `actions/setup-node@v3`
   - Versión de Node.js: `18`
   - Descripción: Configura el entorno de Node.js necesario para ejecutar el proyecto

3. **Install dependencies**

   - Comando: `cd apps/frontend && npm install`
   - Descripción: Instala todas las dependencias del proyecto frontend definidas en `package.json`

4. **Build project**
   - Comando: `cd apps/frontend && npm run build`
   - Descripción: Construye la aplicación Next.js para producción, generando los archivos optimizados en `.next/`

#### Flujo Completo

```
Push/PR con cambios en apps/frontend/**
    ↓
Checkout del código
    ↓
Setup Node.js 18
    ↓
Instalación de dependencias
    ↓
Compilación del proyecto
    ↓
✅ Pipeline exitoso o ❌ Pipeline fallido
```

---

## 🔍 Características Clave

### Path-based Triggers

Ambos workflows utilizan **path filters** para ejecutarse solo cuando hay cambios relevantes:

- El workflow de backend solo se ejecuta si hay cambios en `apps/backend/**`
- El workflow de frontend solo se ejecuta si hay cambios en `apps/frontend/**`

**Ventajas:**

- ✅ Ahorro de recursos: No se ejecutan pipelines innecesarios
- ✅ Ejecución más rápida: Solo se procesa lo que cambió
- ✅ Separación de responsabilidades: Cada aplicación tiene su propio pipeline

### Versión de Node.js

Ambos workflows utilizan **Node.js 18**, que es la versión recomendada para el proyecto.

### Acciones Utilizadas

- `actions/checkout@v3`: Versión estable y ampliamente utilizada para checkout del código
- `actions/setup-node@v3`: Versión estable para configuración de Node.js

## 📊 Diferencias entre Workflows

| Aspecto             | Backend CI                    | Frontend CI         |
| ------------------- | ----------------------------- | ------------------- |
| **Tests**           | ✅ Incluye ejecución de tests | ❌ No incluye tests |
| **Steps**           | 5 steps                       | 4 steps             |
| **Tiempo estimado** | Mayor (incluye tests)         | Menor (solo build)  |

## 🚀 Cómo Funciona en la Práctica

### Escenario 1: Cambios solo en Backend

```
Developer hace push con cambios en apps/backend/src/main.ts
    ↓
✅ Backend CI se ejecuta
❌ Frontend CI NO se ejecuta
```

### Escenario 2: Cambios solo en Frontend

```
Developer hace push con cambios en apps/frontend/app/page.tsx
    ↓
❌ Backend CI NO se ejecuta
✅ Frontend CI se ejecuta
```

### Escenario 3: Cambios en Ambos

```
Developer hace push con cambios en apps/backend/ y apps/frontend/
    ↓
✅ Backend CI se ejecuta
✅ Frontend CI se ejecuta
(Ambos en paralelo)
```

### Escenario 4: Cambios en Raíz

```
Developer hace push con cambios solo en package.json (raíz)
    ↓
❌ Backend CI NO se ejecuta
❌ Frontend CI NO se ejecuta
```

## 🔧 Posibles Mejoras Futuras

### Para Backend CI

- [ ] Agregar step de linting (`npm run lint`)
- [ ] Agregar step de formateo de código
- [ ] Agregar step de análisis de código (SonarQube, CodeQL, etc.)
- [ ] Agregar step de cobertura de tests (`npm run test:cov`)
- [ ] Agregar step de tests e2e (`npm run test:e2e`)
- [ ] Agregar notificaciones (Slack, Discord, email)
- [ ] Agregar deployment automático en caso de éxito

### Para Frontend CI

- [ ] Agregar step de linting (`npm run lint`)
- [ ] Agregar step de tests (si se implementan tests en frontend)
- [ ] Agregar step de análisis de código
- [ ] Agregar step de análisis de bundle size
- [ ] Agregar step de Lighthouse CI para performance
- [ ] Agregar notificaciones
- [ ] Agregar deployment automático (Vercel, Netlify, etc.)

### Mejoras Generales

- [ ] Agregar cache de dependencias de npm para acelerar builds
- [ ] Agregar matrix strategy para probar en múltiples versiones de Node.js
- [ ] Agregar workflow de dependabot para actualizar dependencias
- [ ] Agregar workflow de seguridad (dependabot security updates)
- [ ] Agregar workflow para releases automáticos
- [ ] Agregar workflow para actualizar documentación

## 📝 Notas Importantes

1. **Versiones de Acciones**: Las acciones utilizadas (`@v3`) son versiones estables, pero se recomienda revisar periódicamente si hay actualizaciones disponibles.

2. **Node.js 18**: Si el proyecto requiere una versión diferente de Node.js, actualizar la configuración en ambos workflows.

3. **Monorepo**: La configuración actual está optimizada para un monorepo, donde cada aplicación se construye de forma independiente.

4. **Tests en Frontend**: Actualmente el frontend no tiene tests configurados en el pipeline. Si se agregan tests en el futuro, se debe actualizar el workflow.

5. **Dependencias**: Los workflows instalan dependencias directamente en cada aplicación. Si se implementa un sistema de cache de dependencias compartidas, se podría optimizar.

## 🔗 Referencias

- [Documentación de GitHub Actions](https://docs.github.com/en/actions)
- [actions/checkout](https://github.com/actions/checkout)
- [actions/setup-node](https://github.com/actions/setup-node)
- [Path filters en GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpaths)
