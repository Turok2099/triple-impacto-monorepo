# 💳 Guía Completa: Pagos con Fiserv Connect

## 📋 Tabla de Contenidos
1. [Resumen del Flujo](#resumen-del-flujo)
2. [Configuración](#configuración)
3. [Testing Local](#testing-local)
4. [Deployment](#deployment)
5. [Troubleshooting](#troubleshooting)

---

## Resumen del Flujo

### Flujo Completo de Pago

```
1. Usuario → Formulario de Donación (/donar)
   - Selecciona monto
   - Selecciona organización
   - Click "Proceder al Pago"

2. Frontend → Backend: POST /api/payments/fiserv/crear-transaccion
   - Envía: { amount, organizacion_id, responseSuccessURL, responseFailURL }
   - Backend crea payment_attempt en estado "pending"
   - Backend genera hashExtended (seguridad)
   - Backend retorna: { gatewayUrl, formParams }

3. Frontend → Auto-submit formulario POST a Fiserv
   - Redirige usuario a Fiserv Connect
   - Usuario sale temporalmente de nuestro sitio

4. Usuario → Ingresa datos de tarjeta en Fiserv
   - Página segura de Fiserv
   - Fiserv procesa el pago

5. Fiserv → Webhook a Backend: POST /api/payments/fiserv/notification
   - Envía: approval_code, oid, chargetotal, notification_hash, etc.
   - Backend valida notification_hash (seguridad)
   - Backend actualiza payment_attempt a "completed"
   - Backend crea donación en estado "completada"
   - Backend crea afiliado Bonda automáticamente (si es primer pago)

6. Fiserv → Redirige usuario de vuelta
   - Si éxito: /donar/success?approval_code=XXX&oid=XXX
   - Si error: /donar/error?failReason=XXX

7. Usuario ve confirmación
   - Página de éxito con detalles
   - Acceso inmediato al dashboard de cupones
```

---

## Configuración

### Backend (NestJS)

#### Variables de Entorno (.env)

```bash
# Fiserv Connect
FISERV_CONNECT_URL=https://test.ipg-online.com/connect/gateway/processing
FISERV_CONNECT_STORE_ID_1=5926012005
FISERV_CONNECT_SHARED_SECRET="dv'B99xY{vLd"
FISERV_CONNECT_TIMEZONE=America/Buenos_Aires

# URL base de la API (para construir webhook URL automáticamente)
API_BASE_URL=http://localhost:3000

# Producción:
# FISERV_CONNECT_URL=https://www.ipg-online.com/connect/gateway/processing
# API_BASE_URL=https://tu-backend.railway.app
```

⚠️ **IMPORTANTE:** Estas credenciales son de **TESTING**. Usar credenciales de producción en deploy real.

### Frontend (Next.js)

#### Variables de Entorno (.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# URLs de retorno (Fiserv redirige aquí)
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3001/donar/success
NEXT_PUBLIC_PAYMENT_ERROR_URL=http://localhost:3001/donar/error
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Producción:
# NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
# NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://www.tripleimpacto.site/donar/success
# NEXT_PUBLIC_PAYMENT_ERROR_URL=https://www.tripleimpacto.site/donar/error
# NEXT_PUBLIC_SITE_URL=https://www.tripleimpacto.site
```

---

## Testing Local

### 1. Preparar Base de Datos

Asegúrate de tener estas tablas en Supabase:
- ✅ `usuarios`
- ✅ `donaciones`
- ✅ `payment_attempts`
- ✅ `organizaciones`
- ✅ `bonda_microsites`
- ✅ `usuarios_bonda_afiliados`

### 2. Iniciar Servidores

```bash
# Terminal 1: Backend
cd apps/backend
npm run start:dev

# Terminal 2: Frontend
cd apps/frontend
npm run dev
```

### 3. Testing con Tarjetas de Prueba

**Tarjetas de prueba de Fiserv:**

#### ✅ Pago Exitoso
```
Número: 4111 1111 1111 1111 (Visa)
CVV: 123
Fecha: cualquier fecha futura (ej: 12/25)
Nombre: Test User
```

#### ❌ Pago Rechazado
```
Número: 4000 0000 0000 0002
CVV: 123
Fecha: cualquier fecha futura
Nombre: Test Declined
```

### 4. Flujo de Testing

1. Ir a `http://localhost:3001`
2. Registrarse / Iniciar sesión
3. Ir a `http://localhost:3001/donar`
4. Seleccionar monto y organización
5. Click "Proceder al Pago"
6. **Serás redirigido a Fiserv** (página de prueba)
7. Ingresar tarjeta de prueba
8. Completar el pago
9. **Serás redirigido de vuelta** a `/donar/success`
10. Verificar que se creó:
    - ✅ Donación en tabla `donaciones` (estado: completada)
    - ✅ Payment attempt en `payment_attempts` (status: completed)
    - ✅ Usuario vinculado en `usuarios_bonda_afiliados` (si es primer pago)

### 5. Testing del Webhook (CRÍTICO)

El webhook es el endpoint que Fiserv llama para confirmar el pago. **DEBE ser accesible públicamente**.

#### Opción A: Usar ngrok (Recomendado para local)

```bash
# Instalar ngrok
brew install ngrok  # macOS
# o descargar de https://ngrok.com/

# Exponer el backend
ngrok http 3000

# Copiar la URL que aparece, ejemplo:
# https://abc123.ngrok.io

# Configurar en backend .env:
API_BASE_URL=https://abc123.ngrok.io

# Reiniciar backend
npm run start:dev
```

Ahora el webhook URL será:
```
https://abc123.ngrok.io/api/payments/fiserv/notification
```

#### Opción B: Usar backend en Railway

Si ya tienes el backend en Railway:
```bash
API_BASE_URL=https://tu-backend.railway.app
```

### 6. Verificar Logs

```bash
# Backend logs
# Buscar en consola:
✅ Transacción preparada: user=... order_id=... amount=...
✅ Fiserv notification: pago completado user=... oid=...
✅ Afiliado registrado: user=... microsite=... code=...
```

---

## Deployment

### Backend (Railway)

#### 1. Configurar Variables de Entorno

```bash
# Fiserv PRODUCCIÓN (obtener de Fiserv)
FISERV_CONNECT_URL=https://www.ipg-online.com/connect/gateway/processing
FISERV_CONNECT_STORE_ID_1=TU_STORE_ID_PROD
FISERV_CONNECT_SHARED_SECRET=TU_SECRET_PROD

# URL base
API_BASE_URL=https://tu-backend.railway.app

# Resto de variables...
SUPABASE_URL=...
JWT_SECRET=...
```

#### 2. Configurar Webhook en Fiserv Dashboard

1. Login a Fiserv Merchant Portal
2. Ir a Settings → Webhooks
3. Agregar URL de notificación:
   ```
   https://tu-backend.railway.app/api/payments/fiserv/notification
   ```
4. Habilitar notificaciones para: "Payment Completed"

### Frontend (Vercel)

#### 1. Configurar Variables de Entorno

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://www.tripleimpacto.site/donar/success
NEXT_PUBLIC_PAYMENT_ERROR_URL=https://www.tripleimpacto.site/donar/error
NEXT_PUBLIC_SITE_URL=https://www.tripleimpacto.site
```

#### 2. Rebuild y Deploy

```bash
git push origin main
# Vercel auto-deploy
```

### Supabase

No requiere cambios adicionales. Las tablas ya están creadas.

---

## Troubleshooting

### ❌ Error: "Fiserv Connect no está configurado"

**Causa:** Faltan variables de entorno en el backend.

**Solución:**
```bash
# Verificar en backend/.env:
FISERV_CONNECT_URL=...
FISERV_CONNECT_STORE_ID_1=...
FISERV_CONNECT_SHARED_SECRET=...

# Reiniciar backend
npm run start:dev
```

---

### ❌ Error: "Se requiere autenticación"

**Causa:** Token JWT no se está enviando o es inválido.

**Solución:**
1. Verificar que estás logueado
2. Abrir DevTools → Network → ver request
3. Verificar header `Authorization: Bearer <token>`
4. Si falta, verificar `AuthContext` en frontend

---

### ❌ El webhook NO llega al backend

**Causa:** El backend no es accesible públicamente (localhost).

**Solución:**
1. Usar ngrok para exponer localhost
2. O deployar backend en Railway
3. Verificar que la URL esté correcta en `API_BASE_URL`
4. Verificar logs de Fiserv Dashboard

---

### ❌ Error: "Hash de notificación inválido"

**Causa:** El `SHARED_SECRET` no coincide o la validación falla.

**Solución:**
1. Verificar que `FISERV_CONNECT_SHARED_SECRET` es correcto
2. No debe tener espacios extra ni comillas adicionales
3. En `.env` debe estar como: `FISERV_CONNECT_SHARED_SECRET="dv'B99xY{vLd"`
4. Verificar logs del backend: `Fiserv notification: hash inválido`

---

### ❌ Usuario es redirigido a Fiserv pero no vuelve

**Causa:** URLs de retorno incorrectas o usuario cerró la ventana.

**Solución:**
1. Verificar `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` en frontend
2. Verificar que las URLs sean accesibles públicamente
3. Si usuario cierra ventana, el `payment_attempt` queda "pending"
4. Implementar cronjob para marcar como "cancelled" después de 1 hora

---

### ❌ El afiliado NO se crea en Bonda

**Causa:** Error al llamar API de Bonda o credenciales incorrectas.

**Solución:**
1. Verificar logs: `Fiserv webhook: error al crear afiliado Bonda`
2. Verificar tabla `bonda_microsites` tiene datos correctos
3. Verificar que `organizacion_id` en donación coincida con una ONG vinculada
4. Verificar credenciales de Bonda API

---

### ❌ Error: "El monto mínimo es $XXX"

**Causa:** Usuario intenta donar menos del monto mínimo de la organización.

**Solución:**
1. Verificar tabla `organizaciones` → columna `monto_minimo`
2. Frontend ya valida esto, pero backend también
3. Actualizar monto mínimo en Supabase si es necesario

---

## Monitoreo en Producción

### Logs a Verificar

```bash
# Railway logs
railway logs --tail

# Buscar:
✅ "Transacción preparada"
✅ "Fiserv notification: pago completado"
✅ "Afiliado registrado"
⚠️ "Fiserv notification: hash inválido"
⚠️ "Error al crear afiliado"
```

### Métricas Importantes

- **Tasa de conversión:** Transacciones creadas vs completadas
- **Tiempo de webhook:** Cuánto tarda en llegar
- **Errores de hash:** Indicador de problemas de seguridad
- **Afiliados creados:** Verificar que se crean correctamente

---

## Seguridad

### ✅ Implementado

- ✅ Validación de `hashExtended` al enviar pago
- ✅ Validación de `notification_hash` en webhook
- ✅ JWT requerido para crear transacción
- ✅ `SHARED_SECRET` nunca expuesto al frontend
- ✅ PCI Compliance (Fiserv maneja datos sensibles)

### ⚠️ Recomendaciones Adicionales

- [ ] Rate limiting en endpoint de crear transacción
- [ ] Logging de IPs sospechosas en webhook
- [ ] Alertas de intentos de webhook inválidos
- [ ] Validación de monto máximo por transacción
- [ ] Verificación de email antes de permitir donar

---

## FAQ

### ¿Puedo usar MercadoPago en vez de Fiserv?

Sí, pero requiere crear un módulo nuevo similar a `FiservConnectService`. El flujo sería:
1. Usuario → Checkout MercadoPago
2. MercadoPago → Webhook a tu backend
3. Backend → Crear donación y afiliado

### ¿Puedo aceptar transferencias bancarias?

Sí, pero sería un flujo manual:
1. Usuario dona por transferencia
2. Admin verifica el pago
3. Admin marca manualmente la donación como completada
4. Se activa el afiliado Bonda

### ¿Cómo puedo ofrecer pagos recurrentes (suscripciones)?

Fiserv Connect soporta pagos recurrentes, pero requiere configuración adicional y usar tokens de tarjeta. Contactar a Fiserv para habilitar esta función.

---

## 🚀 Próximos Pasos

1. ✅ Testing local completo
2. ✅ Deploy a Railway/Vercel
3. ⬜ Testing en producción con tarjetas reales
4. ⬜ Configurar webhook en Fiserv Dashboard
5. ⬜ Monitoreo y alertas
6. ⬜ Generar certificados de donación (futuro)

---

**¿Necesitas ayuda?** Revisa los logs o contacta a soporte@tripleimpacto.site
