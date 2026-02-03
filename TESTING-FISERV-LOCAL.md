# 🧪 Testing de Fiserv en Local - Paso a Paso

## ✅ Verificación Previa

Asegúrate de tener corriendo:

- ✅ Terminal 1: Backend en `http://localhost:3000`
- ✅ Terminal 2: Frontend en `http://localhost:3001`
- ✅ Terminal 3: Ngrok exponiendo puerto 3000

---

## 📝 Paso 1: Insertar Organizaciones en Supabase

1. **Ir a Supabase Dashboard:**

   - Abrir: https://supabase.com/dashboard/project/faibhrhrassmrokvzqeu

2. **Ir al SQL Editor:**

   - Click en "SQL Editor" en el menú lateral

3. **Ejecutar el script:**

   - Copiar todo el contenido de `apps/backend/database/seed-organizaciones.sql`
   - Pegar en el editor
   - Click en "Run"

4. **Verificar resultado:**
   - Deberías ver 3 organizaciones listadas
   - Si aparecen, ¡todo bien! ✅

---

## 🧪 Paso 2: Flujo Completo de Testing

### 1. Abrir el sitio

Ir a: `http://localhost:3001`

---

### 2. Registrarse / Iniciar Sesión

**Si no tienes cuenta:**

- Click en "Registro"
- Llenar formulario
- Confirmar email (si está habilitado)

**Si ya tienes cuenta:**

- Click en "Login"
- Ingresar credenciales

---

### 3. Ir a la página de donación

Navegar a: `http://localhost:3001/donar`

Deberías ver:

- ✅ Banner de beneficios
- ✅ Formulario con organizaciones (Fundación Padres, Techo, Cáritas)
- ✅ Montos sugeridos (500, 1000, 2000, 5000, 10000)
- ✅ Input para monto personalizado

---

### 4. Llenar el formulario

1. **Seleccionar organización:**

   - Click en cualquiera de las 3 organizaciones

2. **Seleccionar monto:**

   - Opción A: Click en un monto sugerido (ej: 1000)
   - Opción B: Ingresar monto personalizado

3. **Verificar resumen:**

   - Debería mostrar el monto y organización seleccionada

4. **Click en "Proceder al Pago"**

---

### 5. Verificar redirección a Fiserv

Deberías ver:

1. **Primero:** Pantalla de "Redirigiendo al pago seguro..." (1-2 segundos)
2. **Luego:** Página de Fiserv Connect (ambiente de prueba)

**Si NO te redirige:**

- ❌ Verificar logs del backend (ver errores)
- ❌ Verificar que ngrok esté corriendo
- ❌ Verificar que `API_BASE_URL` esté configurado

---

### 6. Completar el pago en Fiserv

En la página de Fiserv, ingresar datos de tarjeta de **PRUEBA**:

#### ✅ Pago Exitoso:

```
Número de tarjeta: 4111 1111 1111 1111
Fecha de vencimiento: 12/25 (cualquier fecha futura)
CVV: 123
Nombre: Test User
```

#### ❌ Pago Rechazado (opcional, para probar):

```
Número de tarjeta: 4000 0000 0000 0002
CVV: 123
Fecha: 12/25
Nombre: Test Declined
```

Click en **"Submit Payment"** o "Pagar"

---

### 7. Verificar redirección de vuelta

**Si el pago fue exitoso:**

- Deberías volver a: `http://localhost:3001/donar/success`
- Ver mensaje de "¡Donación Exitosa!"
- Ver detalles: monto, código de aprobación, número de orden

**Si el pago fue rechazado:**

- Deberías volver a: `http://localhost:3001/donar/error`
- Ver mensaje de error explicativo

---

## 🔍 Paso 3: Verificar en Backend (CRÍTICO)

### 1. Ver logs del backend

En la **Terminal 1** (backend), deberías ver:

```bash
✅ Transacción preparada: user=<uuid> order_id=<id> amount=1000
✅ Fiserv notification received: oid=<id>
✅ Fiserv notification: pago completado user=<uuid> oid=<id>
✅ Donación creada: id=<uuid>
✅ Afiliado Bonda creado: user=<uuid> microsite=...
```

**Si NO ves estos logs:**

- ❌ El webhook no está llegando
- ❌ Verificar que ngrok esté corriendo
- ❌ Verificar `API_BASE_URL` en backend/.env

---

### 2. Ver dashboard de ngrok

Abrir en el navegador:

```
http://127.0.0.1:4040
```

Deberías ver:

- ✅ Una petición POST a `/api/payments/fiserv/notification`
- ✅ Status: 200 OK (si fue exitoso)
- ✅ Ver los parámetros que envió Fiserv

**Si NO aparece la petición:**

- ❌ Fiserv no está enviando el webhook
- ❌ La URL de ngrok no está correcta en `API_BASE_URL`

---

## 🗄️ Paso 4: Verificar en Supabase

### 1. Ver tabla `payment_attempts`

**Ir a:**
Supabase → Table Editor → `payment_attempts`

**Deberías ver:**

- ✅ Un nuevo registro con:
  - `status: 'completed'`
  - `amount: 1000` (o el monto que elegiste)
  - `user_id: <uuid>`
  - `fiserv_raw_response: {...}` (JSON con los datos de Fiserv)

---

### 2. Ver tabla `donaciones`

**Ir a:**
Supabase → Table Editor → `donaciones`

**Deberías ver:**

- ✅ Un nuevo registro con:
  - `estado: 'completada'`
  - `monto: 1000`
  - `usuario_id: <uuid>`
  - `organizacion_id: <uuid>`
  - `payment_id: <approval_code>`
  - `completed_at: <timestamp>`

---

### 3. Ver tabla `usuarios_bonda_afiliados`

**Ir a:**
Supabase → Table Editor → `usuarios_bonda_afiliados`

**Deberías ver:**

- ✅ Un nuevo registro (si es tu primera donación) con:
  - `usuario_id: <uuid>`
  - `bonda_microsite_id: <uuid>`
  - `codigo_afiliado: <código>`
  - `estado: 'activo'`

---

## 🎉 Paso 5: Probar Dashboard de Cupones

Después de completar el pago:

1. **Ir a:** `http://localhost:3001/dashboard`

2. **Deberías ver:**

   - ✅ Estadísticas: Total donado, cupones activos, etc.
   - ✅ Sección "Mis cupones activos"
   - ✅ Enlace para "Ver cupones disponibles"

3. **Ir a:** `http://localhost:3001/dashboard/cupones-disponibles`

4. **Solicitar un cupón:**

   - Click en "Solicitar" en cualquier cupón
   - Ver el código del cupón
   - Click en "Copiar código"

5. **Ver tus cupones:** `http://localhost:3001/dashboard/mis-cupones`

6. **Ver historial:** `http://localhost:3001/dashboard/historial`

---

## ❌ Troubleshooting

### Problema: No se redirige a Fiserv

**Posibles causas:**

1. Backend no está corriendo
2. Error en la creación de transacción
3. Variables de Fiserv incorrectas

**Solución:**

- Abrir DevTools (F12) → Console
- Ver errores en rojo
- Verificar Network → ver la petición a `/api/payments/fiserv/crear-transaccion`

---

### Problema: El webhook NO llega

**Síntomas:**

- El pago se completa en Fiserv
- Vuelves a `/donar/success`
- PERO no se crea la donación ni el afiliado en la BD

**Posibles causas:**

1. Ngrok no está corriendo
2. `API_BASE_URL` no tiene la URL de ngrok
3. Fiserv no puede alcanzar la URL de ngrok

**Solución:**

1. Verificar que ngrok esté corriendo: ver Terminal 3
2. Verificar `API_BASE_URL` en `backend/.env`:
   ```bash
   API_BASE_URL=https://tu-url.ngrok-free.dev
   ```
3. Reiniciar backend después de cambiar `.env`
4. Verificar dashboard de ngrok: `http://127.0.0.1:4040`

---

### Problema: Error "No hay organizaciones disponibles"

**Causa:** No se ejecutó el script SQL de seed.

**Solución:**

1. Ir a Supabase SQL Editor
2. Ejecutar `apps/backend/database/seed-organizaciones.sql`
3. Refrescar la página `/donar`

---

### Problema: Error "Monto mínimo es $XXX"

**Causa:** Intentas donar menos del monto mínimo.

**Solución:**

- Verificar `monto_minimo` en tabla `organizaciones`
- Donar un monto mayor o igual al mínimo

---

### Problema: "Not allowed by CORS"

**Causa:** El frontend no está en la lista de orígenes permitidos.

**Solución:**

- Ya está configurado para `localhost:3001`
- Si usas otro puerto, agregar en `backend/src/main.ts`

---

## 📊 Checklist Final

Después de una prueba exitosa, deberías tener:

- ✅ 1 registro en `payment_attempts` (status: completed)
- ✅ 1 registro en `donaciones` (estado: completada)
- ✅ 1 registro en `usuarios_bonda_afiliados` (estado: activo)
- ✅ Página de éxito mostrada con datos correctos
- ✅ Dashboard de cupones accesible
- ✅ Logs en backend confirmando webhook recibido

---

## 🚀 Próximos Pasos

Si todo funciona en local:

1. **Commit y push** de los cambios
2. **Deploy** a Railway/Vercel
3. **Configurar** variables de producción
4. **Testing** en producción con tarjetas reales
5. **Configurar** webhook en Fiserv Dashboard (producción)

---

**¿Problemas?** Revisar los logs del backend y el dashboard de ngrok (`http://127.0.0.1:4040`)
