# 🔍 Diagnóstico: Frontend NO Carga Cupones

**Fecha:** 27 de enero, 2026  
**Problema:** Frontend local no muestra cupones, pero el deployado sí.

---

## ✅ Estado Actual

### Backend Local (localhost:3000)

- ✅ **Estado:** Corriendo correctamente
- ✅ **Cupones:** 11 cupones disponibles en `/api/public/cupones`
- ✅ **Datos:** Cupones reales de Bonda (Dash, Chungo, Starbucks, Mostaza, etc.)
- ✅ **Response:** 200 OK, JSON válido

**Test realizado:**

```bash
curl http://localhost:3000/api/public/cupones
# Retorna: 11 cupones en formato JSON
```

### Frontend Local (localhost:3001)

- ✅ **Estado:** Corriendo en http://localhost:3001
- ✅ **Configuración:** `NEXT_PUBLIC_API_URL=http://localhost:3000/api`
- ⚠️ **Problema:** NO muestra cupones en la página

### Frontend Deployado (Vercel)

- ✅ **Estado:** Funciona correctamente
- ✅ **Cupones:** Se muestran correctamente
- ✅ **Configuración:** Apunta a Railway

---

## 🐛 Posibles Causas

### 1. Variables de Entorno No Actualizadas (MÁS PROBABLE)

**Causa:** Next.js requiere RESTART cuando cambias variables `NEXT_PUBLIC_*`

**Solución:**

```bash
# Terminal del frontend (Terminal 2)
# Presionar Ctrl+C para detener
# Luego ejecutar:
npm run dev
```

---

### 2. Cache del Navegador

**Causa:** El navegador está usando una versión cacheada que apunta a Railway

**Solución:**

1. Abrir DevTools (F12)
2. Right-click en el botón de Refresh
3. Seleccionar "Empty Cache and Hard Reload"

O simplemente:

- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

### 3. Error de Fetch en el Código

**Causa:** El componente que llama a `/api/public/cupones` tiene un error

**Verificar:**

1. Abrir http://localhost:3001 en el navegador
2. Abrir DevTools (F12) → Console
3. Buscar errores en rojo

**Verificar Network:**

1. DevTools → Network tab
2. Refrescar la página
3. Buscar petición a `localhost:3000/api/public/cupones`
4. Ver si:
   - ✅ La petición se hace
   - ✅ Status: 200
   - ✅ Response tiene datos

---

### 4. CORS Issue

**Causa:** Backend rechaza peticiones desde localhost:3001

**Síntoma:** Error en console: "CORS policy blocked"

**Verificación:**
El backend ya tiene localhost:3001 en allowedOrigins (main.ts línea 10)

**NO debería ser este el problema**, pero si lo es:

- Ver logs del backend (Terminal 1)
- Buscar: "CORS blocked origin"

---

### 5. Componente No Renderiza

**Causa:** El componente que muestra cupones tiene un error de lógica

**Verificar en el código:**

- ¿Hay un `if (cupones.length === 0)` que muestra mensaje "no hay cupones"?
- ¿El loading state está atascado?
- ¿Hay un error en el `useEffect` que hace el fetch?

---

## 🔧 Solución Paso a Paso

### Paso 1: Reiniciar Frontend (HACER PRIMERO)

```bash
# En Terminal 2 (frontend)
Ctrl + C  # Detener el servidor

# Esperar a que se detenga completamente

npm run dev  # Reiniciar
```

**Esperar a ver:**

```
✓ Ready in XXXXms
```

---

### Paso 2: Limpiar Cache del Navegador

1. Ir a http://localhost:3001
2. Abrir DevTools (F12)
3. Presionar `Ctrl + Shift + R` (hard refresh)

---

### Paso 3: Verificar en DevTools

**Console (errores):**

- ¿Hay errores en rojo?
- ¿Dice algo sobre "fetch failed" o "network error"?

**Network (peticiones):**

- ¿Se hace petición a `localhost:3000/api/public/cupones`?
- ¿Status Code es 200?
- ¿Response tiene datos?

**Si la petición NO se hace:**
→ Problema en el código del componente

**Si la petición se hace pero falla:**
→ Problema de CORS o backend

**Si la petición se hace y retorna datos pero no se muestran:**
→ Problema de renderizado en el componente

---

### Paso 4: Si Aún No Funciona - Verificar Componente

**¿Qué página estás viendo?**

- Página principal (`/`) → Ver `app/page.tsx`
- Página de cupones → Ver la página correspondiente

**Buscar el fetch:**

```typescript
// Buscar algo como:
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/public/cupones`
);
```

**Agregar logs temporales:**

```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Fetching cupones...');
const response = await fetch(...);
console.log('Response:', response.status);
const data = await response.json();
console.log('Cupones:', data);
```

---

## 📊 Tests de Verificación

### Test 1: Backend Responde

```bash
curl http://localhost:3000/api/public/cupones
```

**Esperado:** JSON con 11 cupones  
**Resultado:** ✅ PASA

### Test 2: Frontend Usa Variable Correcta

```bash
# Ver archivo .env.local
cat apps/frontend/.env.local | grep NEXT_PUBLIC_API_URL
```

**Esperado:** `NEXT_PUBLIC_API_URL=http://localhost:3000/api`  
**Resultado:** ✅ PASA

### Test 3: Frontend Carga Variable

```javascript
// En el navegador, console de DevTools:
console.log(process.env.NEXT_PUBLIC_API_URL);
```

**Esperado:** `http://localhost:3000/api`  
**Si muestra:** `undefined` o URL de Railway → Necesita restart

---

## 🎯 Diagnóstico Rápido

**Ejecuta esto en la consola del navegador (F12):**

```javascript
// Test rápido para ver si puede alcanzar el backend
fetch("http://localhost:3000/api/public/cupones")
  .then((r) => r.json())
  .then((data) => console.log("✅ Cupones:", data.length, "encontrados"))
  .catch((err) => console.error("❌ Error:", err));
```

**Si funciona:**
→ El problema es en el componente que renderiza

**Si falla:**
→ Problema de CORS o el backend no está corriendo

---

## ✅ Checklist de Solución

- [ ] Reiniciar frontend (`Ctrl+C` → `npm run dev`)
- [ ] Hard refresh del navegador (`Ctrl+Shift+R`)
- [ ] Verificar DevTools → Console (errores)
- [ ] Verificar DevTools → Network (peticiones)
- [ ] Ejecutar test de fetch manual en console
- [ ] Ver logs del backend (Terminal 1)
- [ ] Verificar que el backend está en localhost:3000
- [ ] Verificar que el frontend está en localhost:3001

---

## 📝 Notas

- **Frontend deployado funciona** → Backend Railway + Vercel funcionan bien
- **Frontend local no funciona** → Problema de configuración local
- **Backend local sirve cupones** → Backend está bien
- **Conclusión:** Problema en comunicación Frontend Local ↔ Backend Local

**Causa más probable:** Variables de entorno no actualizadas (necesita restart)

---

**Siguiente Paso:** Reiniciar el frontend y verificar en DevTools
