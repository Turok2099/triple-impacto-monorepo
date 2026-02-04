# ✅ Solución Final - Deploy en Railway (Monorepo)

## 🎯 Problema Resuelto

**Error:** `Cannot find module '/app/dist/main'`

**Causa:** El archivo `.railwayignore` estaba excluyendo el directorio `dist/` del deploy, pero ese directorio contiene el código compilado necesario para ejecutar la aplicación.

---

## 🔧 Cambios Aplicados

### **1. Fix en `.railwayignore`**

**Archivo:** `apps/backend/.railwayignore`

**Antes:**

```plaintext
node_modules/
dist/              ← PROBLEMA: Railway excluía este directorio
.env
```

**Después:**

```plaintext
node_modules/
# dist/ - NECESARIO para Railway (contiene el build compilado)
.env
```

**¿Por qué?**

- El build genera `dist/` con el código compilado TypeScript → JavaScript
- Railway necesita este directorio para ejecutar `node dist/main`
- `.gitignore` sigue ignorando `dist/` correctamente (no sube archivos compilados a Git)

---

### **2. Configuración de Railway Actualizada**

**Archivo:** `apps/backend/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Flujo completo:**

1. ✅ `npm install` - Instala dependencias (incluye `@nestjs/cli` y `typescript`)
2. ✅ `npm run build` - Compila TypeScript → genera `dist/`
3. ✅ Copia archivos al contenedor (ahora **incluye** `dist/`)
4. ✅ `npm run start:prod` - Ejecuta `node dist/main`

---

### **3. Dependencies Corregidas**

**Archivo:** `apps/backend/package.json`

Movimos estas dependencias necesarias para el build:

```json
"dependencies": {
  "@nestjs/cli": "^11.0.0",    // ← Movido de devDependencies
  "typescript": "^5.7.3",       // ← Movido de devDependencies
  // ... resto
}
```

**¿Por qué?**
Railway instala solo `dependencies` en producción (`npm ci --omit=dev`), por eso necesitábamos mover las herramientas de build.

---

## 📦 Commits Realizados

```bash
✅ Commit 1: 4ca0de8 - Agregar buildCommand en railway.json
✅ Commit 2: fd05cf1 - Mover @nestjs/cli y typescript a dependencies
✅ Commit 3: f9827a1 - Permitir dist/ en Railway deploy

Push: Completado a origin/main
```

---

## 🏗️ Configuración del Monorepo

### **Estructura:**

```
triple-impacto-monorepo/
├── .gitignore              ← Ignora dist/ (correcto para Git)
├── apps/
│   ├── backend/
│   │   ├── .railwayignore  ← PERMITE dist/ (necesario para Railway)
│   │   ├── railway.json    ← Configuración de deploy
│   │   └── package.json    ← CLI y TypeScript en dependencies
│   └── frontend/
│       └── (Vercel)        ← No afectado
```

### **Archivos de Ignore - Diferenciación:**

| Archivo          | Propósito                   | ¿Ignora `dist/`? | ¿Por qué?                          |
| ---------------- | --------------------------- | ---------------- | ---------------------------------- |
| `.gitignore`     | Qué NO subir a GitHub       | ✅ SÍ            | Archivos generados no van a Git    |
| `.railwayignore` | Qué NO copiar al contenedor | ❌ NO            | Necesario en runtime para ejecutar |

---

## 🚀 Estado del Deploy

### **Railway detectará automáticamente:**

- Nuevo commit en GitHub
- Iniciará redeploy (2-3 minutos)

### **✅ Logs Esperados (correcto):**

```bash
# BUILD PHASE
> npm install
✓ @nestjs/cli@11.0.0 installed
✓ typescript@5.7.3 installed

> npm run build
Building NestJS application...
✓ Build successful
✓ dist/ directory created

# DEPLOY PHASE
Copying files to container...
✓ Including dist/ (total: X files)

# RUNTIME
> npm run start:prod
> node dist/main

🚀 Servidor corriendo en http://localhost:3000/api
🌐 CORS habilitado para: https://www.tripleimpacto.site
✓ Supabase client initialized successfully
✓ Fiserv Connect configurado (Store: 5926012006)

✅ Deployment successful
```

---

## 🔍 Verificación Post-Deploy

### **1. Health Check:**

```bash
curl https://backend-production-83f0.up.railway.app/api/health
```

**Respuesta esperada:** `{"status":"ok","database":"connected"}`

### **2. Info del API:**

```bash
curl https://backend-production-83f0.up.railway.app/api
```

**Respuesta esperada:**

```json
{
  "message": "Backend API - Triple Impacto",
  "version": "1.0.0"
}
```

### **3. Login desde Frontend:**

- Ve a: `https://www.tripleimpacto.site/login`
- Intenta hacer login
- **Debería funcionar sin errores de CORS**

---

## 📋 Checklist Completo

### **Configuración Backend (Railway):**

- [x] `railway.json` con buildCommand ✅
- [x] `@nestjs/cli` en dependencies ✅
- [x] `typescript` en dependencies ✅
- [x] `.railwayignore` permite `dist/` ✅
- [x] Commits y push completados ✅
- [ ] Railway redesplegó (espera 2-3 min)
- [ ] Backend responde correctamente
- [ ] CORS funciona con el frontend

### **Variables de Entorno (Railway):**

- [x] `FRONTEND_URL=https://www.tripleimpacto.site` ✅
- [x] `FISERV_CONNECT_*` (todas) ✅
- [x] `SUPABASE_*` (todas) ✅
- [x] `JWT_SECRET` (aleatorio) ✅
- [x] `API_BASE_URL` ✅

### **Pendientes (Post-Deploy):**

- [ ] Ejecutar migraciones SQL en Supabase:
  - `002-dashboard-cupones.sql`
  - `seed-organizaciones.sql`
  - `vincular-micrositios-organizaciones.sql`
- [ ] Configurar webhook en Fiserv Dashboard
- [ ] Probar flujo completo de donación

---

## 🆘 Troubleshooting

### **Si el deploy sigue fallando:**

#### **1. Verificar Logs de Build:**

Railway → Deployments → Click en deploy → "Build Logs"

**Buscar:**

```bash
✓ nest build
✓ dist/src/main.js created
```

#### **2. Verificar Logs de Deploy:**

Railway → Deployments → Click en deploy → "Deploy Logs"

**Buscar:**

```bash
Copying X files to /app
✓ dist/ included
```

#### **3. Verificar Runtime Logs:**

Railway → Deployments → "View Logs"

**Buscar errores como:**

```bash
Error: Cannot find module '@nestjs/core'  ← Problema de dependencies
SyntaxError: Unexpected token          ← Problema de compilación
EADDRINUSE: address already in use    ← Problema de puerto
```

---

## 📊 Resumen Técnico

### **Problema Original:**

```
Build ✓ → Deploy (excluye dist/) ✗ → Runtime (busca dist/main) ✗ → CRASH
```

### **Solución:**

```
Build ✓ → Deploy (INCLUYE dist/) ✓ → Runtime (encuentra dist/main) ✓ → SUCCESS
```

### **Archivos Modificados:**

1. `apps/backend/.railwayignore` - Permitir `dist/`
2. `apps/backend/railway.json` - Agregar `buildCommand`
3. `apps/backend/package.json` - Mover CLI a `dependencies`

---

## 🎯 Estado Actual

| Componente         | Estado                   |
| ------------------ | ------------------------ |
| **Backend Build**  | ✅ Configurado           |
| **Backend Deploy** | 🟡 En proceso (Railway)  |
| **Frontend**       | ✅ Deployado (Vercel)    |
| **Monorepo**       | ✅ Estructura preservada |
| **Git**            | ✅ Push completado       |

---

**⏱️ Próximo paso:** Espera 2-3 minutos y verifica que el backend responda en:

- `https://backend-production-83f0.up.railway.app/api`
- `https://backend-production-83f0.up.railway.app/api/health`

**🎉 Una vez que funcione, podrás continuar con las migraciones SQL y la configuración de Fiserv webhook.** 🚀
