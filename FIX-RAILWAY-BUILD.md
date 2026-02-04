# 🔧 Fix: Error de Deploy en Railway

## ❌ Error Original

```
Error: Cannot find module '/app/dist/main'
```

---

## 🔍 Causa del Problema

Railway estaba ejecutando `npm run start:prod` (que corre `node dist/main`) **SIN ejecutar el build primero**.

Resultado:

- ❌ No se compilaba TypeScript → JavaScript
- ❌ No se generaba el directorio `dist/`
- ❌ El servidor intentaba ejecutar un archivo que no existía

---

## ✅ Solución Aplicada

Se actualizó `apps/backend/railway.json` para **forzar el build** antes del start:

### **Antes:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod"
  }
}
```

### **Después (✅ Corregido):**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build" // ← AGREGADO
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE", // ← AGREGADO
    "restartPolicyMaxRetries": 10 // ← AGREGADO
  }
}
```

---

## 🚀 Qué Hace Ahora

1. **`npm install`** → Instala dependencias
2. **`npm run build`** → Compila TypeScript (genera `dist/`)
3. **`npm run start:prod`** → Ejecuta `node dist/main`

**Bonus:** Si el servidor falla, Railway lo reiniciará automáticamente (hasta 10 intentos).

---

## 📋 Próximos Pasos

### **1. Railway Redesplegará Automáticamente**

Railway detectará el cambio en GitHub y redesplegará:

- Ve a tu proyecto en Railway
- Verás un nuevo deploy en curso
- Espera 2-3 minutos

### **2. Verificar Logs de Railway**

Después del redeploy, verifica los logs:

#### **✅ Logs Correctos (esperados):**

```bash
> backend@0.0.1 build
> nest build

✓ Build successful

> backend@0.0.1 start:prod
> node dist/main

🚀 Servidor corriendo en http://localhost:3000/api
🌐 CORS habilitado para: http://localhost:3001, http://localhost:3000, https://www.tripleimpacto.site
```

#### **❌ Si aún ves errores:**

Busca líneas como:

```
npm ERR! missing script: build
Error: Cannot find module '@nestjs/core'
```

---

## 🔍 Verificación Post-Deploy

### **1. Verificar que el Backend Responde:**

```bash
# Desde tu navegador o terminal:
curl https://backend-production-83f0.up.railway.app/api
```

**Respuesta esperada:**

```json
{
  "message": "Backend API - Triple Impacto",
  "version": "1.0.0"
}
```

### **2. Verificar Health Check:**

```bash
curl https://backend-production-83f0.up.railway.app/api/health
```

**Respuesta esperada:**

```json
{
  "status": "ok",
  "database": "connected"
}
```

### **3. Verificar CORS (desde el frontend):**

Intenta hacer login desde `https://www.tripleimpacto.site`:

- Si funciona → ✅ CORS resuelto
- Si falla → Verifica que `FRONTEND_URL=https://www.tripleimpacto.site` en Railway

---

## 📊 Checklist Final

- [x] `railway.json` actualizado con `buildCommand`
- [x] Commit y push completado
- [ ] Railway redesplegó automáticamente
- [ ] Backend responde en `/api`
- [ ] Backend responde en `/api/health`
- [ ] Login funciona desde el frontend
- [ ] CORS permite `https://www.tripleimpacto.site`

---

## 🆘 Troubleshooting

### **Si el build sigue fallando:**

#### **Opción 1: Verificar Variables de Entorno**

Railway necesita todas las variables críticas:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `FRONTEND_URL=https://www.tripleimpacto.site`

#### **Opción 2: Forzar Redeploy Manual**

1. Ve a Railway → Tu proyecto backend
2. Click en "Deployments"
3. Click en los 3 puntos del último deploy
4. Click "Redeploy"

#### **Opción 3: Verificar Logs de Build**

En Railway → Deployments → Click en el deploy → Ver "Build Logs":

```
Buscá líneas como:
✓ Dependencies installed
✓ Build completed
✗ Error: ...
```

---

## 📝 Resumen Técnico

| Concepto    | Antes                          | Después                        |
| ----------- | ------------------------------ | ------------------------------ |
| **Build**   | ❌ No se ejecutaba             | ✅ `npm run build`             |
| **Start**   | ❌ `node dist/main` (sin dist) | ✅ `node dist/main` (con dist) |
| **Restart** | ❌ Manual                      | ✅ Automático (10 intentos)    |
| **Estado**  | 💥 Crashed                     | ✅ Running                     |

---

**🎯 Estado:** Corrección aplicada y pusheada. Railway debe redeplegar automáticamente en 2-3 minutos.

**✅ Próximo paso:** Esperar el redeploy y verificar que el backend responda correctamente.
