# 🔍 Análisis Completo: Integración de Fiserv

**Fecha:** 27 de enero de 2026  
**Estado:** Backend 80% completo, Frontend 0% implementado

---

## ✅ Lo que YA ESTÁ Implementado

### 🔧 Backend - Infraestructura Fiserv Connect

#### 1. Servicios y Módulos

**`FiservConnectService`** ✅
- **Ubicación:** `apps/backend/src/modules/payments/fiserv-connect/fiserv-connect.service.ts`
- **Funcionalidad:**
  - ✅ Configuración desde `.env` (URL, Store ID, Shared Secret)
  - ✅ Generación de `txndatetime` (formato requerido por Fiserv)
  - ✅ Construcción de parámetros de pago (`buildPaymentParams`)
  - ✅ Cálculo de `hashExtended` (seguridad)
  - ✅ Retorna URL del gateway de Fiserv
- **Variables de entorno:**
  ```
  FISERV_CONNECT_URL=https://test.ipg-online.com/connect/gateway/processing
  FISERV_CONNECT_STORE_ID_1=5926012005
  FISERV_CONNECT_SHARED_SECRET="dv'B99xY{vLd"
  FISERV_CONNECT_TIMEZONE=America/Buenos_Aires
  ```

**`FiservWebhookService`** ✅
- **Ubicación:** `apps/backend/src/modules/payments/fiserv-webhook.service.ts`
- **Funcionalidad:**
  - ✅ Procesa notificaciones servidor-a-servidor de Fiserv
  - ✅ Valida `notification_hash` (seguridad anti-fraude)
  - ✅ Actualiza `payment_attempts` a `completed`
  - ✅ Crea donación en estado `completada`
  - ✅ **Crea afiliado Bonda automáticamente** después del primer pago exitoso
  - ✅ Genera código de afiliado único basado en email
  - ✅ Vincula usuario con micrositio Bonda en `usuarios_bonda_afiliados`
- **Flujo:**
  ```
  Fiserv → POST /api/payments/fiserv/notification
         → Valida hash
         → Actualiza payment_attempt
         → Crea donación
         → Crea afiliado Bonda (si es primer pago)
         → Retorna 200 OK
  ```

**`connect-hash.util.ts`** ✅
- **Ubicación:** `apps/backend/src/modules/payments/fiserv-connect/utils/connect-hash.util.ts`
- **Funcionalidad:**
  - ✅ `createExtendedHash()` - Calcula hash para enviar a Fiserv (HMAC-SHA256)
  - ✅ `validateResponseHash()` - Valida hash de redirección de éxito/error
  - ✅ `validateNotificationHash()` - Valida hash de notificación webhook
  - ✅ Implementa exactamente el algoritmo del manual de Fiserv (Apéndice I)

#### 2. Controlador de Pagos

**`PaymentsController`** ✅
- **Ubicación:** `apps/backend/src/modules/payments/payments.controller.ts`
- **Endpoints:**

**POST `/api/payments/fiserv/crear-transaccion`** ✅
- Requiere: JWT (usuario autenticado)
- Body: `CrearTransaccionDto`
  ```typescript
  {
    amount: number,
    currency?: string, // default ARS
    organizacion_id?: UUID,
    responseSuccessURL: string, // donde redirigir si pago exitoso
    responseFailURL: string, // donde redirigir si pago falla
    transactionNotificationURL?: string // webhook (opcional)
  }
  ```
- Funcionalidad:
  - ✅ Genera UUID único (`order_id`)
  - ✅ Valida monto mínimo de organización (si aplica)
  - ✅ Crea `payment_attempt` en estado `pending`
  - ✅ Genera parámetros completos con `hashExtended`
  - ✅ Retorna URL del gateway + parámetros del formulario
- Respuesta:
  ```typescript
  {
    gatewayUrl: "https://test.ipg-online.com/...",
    formParams: {
      txntype: "sale",
      storename: "5926012005",
      chargetotal: "1000.00",
      currency: "ARS",
      hashExtended: "...",
      oid: "uuid",
      responseSuccessURL: "...",
      responseFailURL: "...",
      ...
    }
  }
  ```

**POST `/api/payments/fiserv/notification`** ✅
- Endpoint público (sin JWT)
- Recibe: `application/x-www-form-urlencoded` desde Fiserv
- Funcionalidad:
  - ✅ Delega a `FiservWebhookService`
  - ✅ Retorna `{ ok: true }`

#### 3. DTOs y Tipos

**`CrearTransaccionDto`** ✅
- Validaciones con `class-validator`
- Todos los campos necesarios

**`ConnectPaymentParams`** ✅
- Interface completa para el formulario POST a Fiserv

**`ConnectConfig`** ✅
- Interface para configuración de Fiserv

**`BuildPaymentParamsInput`** ✅
- Interface para generar parámetros

#### 4. Métodos en SupabaseService

**Ya implementados:** ✅
- `createPaymentAttempt()` - Crea intento de pago
- `getPaymentAttemptByOrderId()` - Busca por order_id
- `updatePaymentAttempt()` - Actualiza estado y respuesta de Fiserv
- `createDonacion()` - Crea donación completada
- `getBondaMicrositeByOrganizacionId()` - Obtiene micrositio por ONG
- `getAffiliateForUserAndMicrosite()` - Verifica si ya existe afiliado
- `upsertAffiliateForUser()` - Crea vinculación usuario-afiliado
- `findUserById()` - Obtiene datos del usuario

---

## ❌ Lo que FALTA Implementar

### 1. **Base de Datos - Tabla `payment_attempts`** ⚠️ **CRÍTICO**

**PROBLEMA:** El código del backend usa `payment_attempts` pero **la tabla NO existe** en `supabase-schema.sql`

**Solución:** Crear migración SQL:

```sql
-- Tabla: payment_attempts
-- Registra intentos de pago en Fiserv (antes de confirmar)
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario que intenta pagar
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Identificadores únicos
  order_id VARCHAR(40) UNIQUE NOT NULL, -- UUID enviado como oid a Fiserv
  store_id VARCHAR(50) NOT NULL, -- Store ID de Fiserv
  
  -- Información del pago
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Organización (opcional)
  organizacion_id UUID REFERENCES organizaciones(id) ON DELETE SET NULL,
  
  -- Estado del intento
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
  
  -- Respuesta de Fiserv (guardada cuando llega el webhook)
  fiserv_raw_response JSONB,
  
  -- Cuotas (para futuros pagos en cuotas)
  installments INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order ON payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created ON payment_attempts(created_at DESC);

-- Comentarios
COMMENT ON TABLE payment_attempts IS 'Intentos de pago en Fiserv (antes de confirmación)';
COMMENT ON COLUMN payment_attempts.order_id IS 'UUID único enviado como oid/merchantTransactionId a Fiserv';
COMMENT ON COLUMN payment_attempts.fiserv_raw_response IS 'JSON completo de la notificación de Fiserv';

-- RLS
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Los usuarios pueden ver sus propios intentos de pago"
  ON payment_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_payment_attempts_updated_at
  BEFORE UPDATE ON payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Acción:** Crear archivo `apps/backend/database/migrations/003-payment-attempts.sql` y ejecutar en Supabase.

---

### 2. **Frontend - Página de Donación** ❌ **NO EXISTE**

**PROBLEMA:** No existe ninguna interfaz para que el usuario done.

**Solución:** Crear páginas y componentes:

#### Páginas necesarias:

**`apps/frontend/app/donar/page.tsx`** ❌
- Formulario de donación
- Selección de monto
- Selección de organización
- Botón "Donar"

**`apps/frontend/app/donar/success/page.tsx`** ❌
- Página de éxito después del pago
- Mostrar detalles de la donación
- Mensaje de bienvenida si es primera donación
- Enlace al dashboard de cupones

**`apps/frontend/app/donar/error/page.tsx`** ❌
- Página de error si el pago falla
- Botón para reintentar

#### Componentes necesarios:

**`components/donar/FormularioDonacion.tsx`** ❌
```typescript
// Formulario con:
// - Input de monto (con montos sugeridos: 500, 1000, 2000, 5000)
// - Select de organización
// - Botón "Donar Ahora"
// - Al enviar: llama a POST /api/payments/fiserv/crear-transaccion
```

**`components/donar/FormularioPagoFiserv.tsx`** ❌
```typescript
// Componente que:
// 1. Recibe gatewayUrl y formParams del backend
// 2. Crea un <form> invisible con method="POST" action={gatewayUrl}
// 3. Agrega todos los formParams como <input type="hidden">
// 4. Auto-submit del formulario
// 5. Usuario es redirigido a Fiserv Connect
```

**`components/donar/TarjetaDonacion.tsx`** ❌
```typescript
// Card visual que muestra:
// - Monto de la donación
// - Organización seleccionada
// - Beneficios (acceso a cupones Bonda)
```

---

### 3. **Frontend - API Client para Pagos** ❌

**Archivo:** `apps/frontend/lib/payments.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface CrearTransaccionRequest {
  amount: number;
  currency?: string;
  organizacion_id?: string;
  responseSuccessURL: string;
  responseFailURL: string;
  transactionNotificationURL?: string;
}

export interface CrearTransaccionResponse {
  gatewayUrl: string;
  formParams: Record<string, string>;
}

/**
 * Crea una transacción de pago en Fiserv
 * Requiere token JWT
 */
export async function crearTransaccion(
  data: CrearTransaccionRequest,
  token: string,
): Promise<CrearTransaccionResponse> {
  const response = await fetch(`${API_URL}/payments/fiserv/crear-transaccion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear transacción');
  }

  return response.json();
}

/**
 * Envía el formulario de pago a Fiserv
 * Crea un form dinámico y lo envía
 */
export function enviarFormularioFiserv(
  gatewayUrl: string,
  formParams: Record<string, string>,
): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;

  Object.entries(formParams).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
```

---

### 4. **Variables de Entorno - Frontend** ⚠️

**Archivo:** `apps/frontend/.env.local`

**Falta agregar:**
```bash
# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# URLs de retorno después del pago (para Fiserv)
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3001/donar/success
NEXT_PUBLIC_PAYMENT_ERROR_URL=http://localhost:3001/donar/error
```

**Para producción (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://www.tripleimpacto.site/donar/success
NEXT_PUBLIC_PAYMENT_ERROR_URL=https://www.tripleimpacto.site/donar/error
```

---

### 5. **Variables de Entorno - Backend** ⚠️

**Archivo:** `apps/backend/.env`

**Falta agregar:**
```bash
# URL base de la API (para construir transactionNotificationURL automáticamente)
API_BASE_URL=http://localhost:3000

# Para producción:
# API_BASE_URL=https://tu-backend.railway.app
```

**Esta variable se usa en:**
```typescript
const notificationURL = body.transactionNotificationURL ??
  (process.env.API_BASE_URL
    ? `${process.env.API_BASE_URL}/api/payments/fiserv/notification`
    : undefined);
```

---

### 6. **Integración con Lista de Organizaciones** ⚠️

**Problema:** El usuario debe poder seleccionar una organización al donar.

**Solución:**

**Opción A: Usar datos hardcodeados existentes**
```typescript
// Ya existe: apps/frontend/lib/organizations.ts
import { organizations } from '@/lib/organizations';

// En FormularioDonacion.tsx:
<select name="organizacion">
  {organizations.map(org => (
    <option key={org.id} value={org.id}>
      {org.name}
    </option>
  ))}
</select>
```

**Opción B: Crear endpoint en backend** (RECOMENDADO)
```typescript
// Backend: GET /api/organizaciones
@Get('organizaciones')
async getOrganizaciones() {
  return this.supabase.getOrganizacionesActivas();
}

// Frontend: lib/organizations.ts
export async function obtenerOrganizaciones() {
  const response = await fetch(`${API_URL}/organizaciones`);
  return response.json();
}
```

---

### 7. **Flujo de Navegación** ❌

**Rutas que deben existir:**

```
/donar                  → Formulario de donación
/donar/procesando       → Loading mientras se crea transacción
                         → Auto-submit a Fiserv Connect
→ [Usuario sale a Fiserv]
→ [Usuario ingresa tarjeta en Fiserv]
→ [Fiserv procesa pago]
→ [Fiserv envía webhook a /api/payments/fiserv/notification]
→ [Fiserv redirige a:]
  /donar/success        → Si pago exitoso
  /donar/error          → Si pago falla

/donar/success          → Mostrar "¡Gracias por tu donación!"
                         → Si es primera donación: "Activamos tu cuenta Bonda"
                         → Botón "Ir al Dashboard de Cupones"

/donar/error            → Mostrar "Hubo un problema con tu pago"
                         → Botón "Reintentar"
```

---

### 8. **Manejo de Errores y Edge Cases** ⚠️

**Casos a manejar:**

#### Usuario cancela el pago en Fiserv
```typescript
// Fiserv redirige a responseFailURL con parámetros
// El frontend debe mostrar mensaje amigable
// El payment_attempt queda en "pending"
```

#### Webhook llega ANTES que la redirección
```typescript
// Es posible que el webhook de Fiserv llegue antes
// que la redirección del usuario
// SOLUCIÓN: /donar/success debe verificar estado del pago
```

#### Webhook falla / no llega
```typescript
// SOLUCIÓN: Implementar sistema de retry
// O permitir al usuario "Verificar Estado del Pago" manualmente
```

#### Usuario cierra la ventana en Fiserv
```typescript
// El payment_attempt queda "pending" indefinidamente
// SOLUCIÓN: Cronjob que marca "cancelled" los intentos > 1 hora
```

---

### 9. **Testing y Validación** ❌

**Tests necesarios:**

#### Unit Tests Backend
```typescript
// fiserv-connect.service.spec.ts
// - Validar generación de hashExtended
// - Validar formato de txndatetime

// fiserv-webhook.service.spec.ts
// - Validar hash de notificación
// - Validar creación de donación
// - Validar creación de afiliado Bonda
```

#### E2E Tests
```typescript
// payments.e2e-spec.ts
// - Flujo completo: crear transacción → webhook → verificar donación
```

#### Tests Frontend
```typescript
// FormularioDonacion.test.tsx
// - Validar envío de formulario
// - Validar selección de organización
```

---

### 10. **Documentación** ⚠️

**Falta crear:**

**`GUIA-PAGOS-FISERV.md`**
- Cómo funciona el flujo de pago
- Diagramas de secuencia
- Variables de entorno necesarias
- Cómo probar en local
- Cómo configurar webhook en Fiserv
- URLs de producción

**`TESTING-PAGOS.md`**
- Tarjetas de prueba de Fiserv
- Cómo simular pagos exitosos/fallidos
- Cómo probar webhooks localmente (ngrok)

---

## 📋 Checklist de Implementación

### Paso 1: Base de Datos
- [ ] Crear migración `003-payment-attempts.sql`
- [ ] Ejecutar en Supabase Development
- [ ] Ejecutar en Supabase Production
- [ ] Verificar índices y RLS

### Paso 2: Variables de Entorno
- [ ] Agregar `API_BASE_URL` en backend `.env`
- [ ] Agregar `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` en frontend
- [ ] Agregar `NEXT_PUBLIC_PAYMENT_ERROR_URL` en frontend
- [ ] Configurar en Railway (backend producción)
- [ ] Configurar en Vercel (frontend producción)

### Paso 3: Frontend - API Client
- [ ] Crear `apps/frontend/lib/payments.ts`
- [ ] Función `crearTransaccion()`
- [ ] Función `enviarFormularioFiserv()`
- [ ] Función `obtenerOrganizaciones()` (opcional)

### Paso 4: Frontend - Páginas
- [ ] Crear `app/donar/page.tsx` (formulario principal)
- [ ] Crear `app/donar/success/page.tsx` (éxito)
- [ ] Crear `app/donar/error/page.tsx` (error)

### Paso 5: Frontend - Componentes
- [ ] Crear `components/donar/FormularioDonacion.tsx`
- [ ] Crear `components/donar/FormularioPagoFiserv.tsx`
- [ ] Crear `components/donar/TarjetaDonacion.tsx`
- [ ] Crear `components/donar/ResumenDonacion.tsx`

### Paso 6: Integración
- [ ] Conectar formulario con API
- [ ] Implementar auto-submit a Fiserv
- [ ] Manejar respuesta de éxito
- [ ] Manejar respuesta de error

### Paso 7: Testing Local
- [ ] Probar crear transacción
- [ ] Probar redirección a Fiserv
- [ ] Probar webhook con ngrok
- [ ] Verificar creación de donación
- [ ] Verificar creación de afiliado Bonda

### Paso 8: Production
- [ ] Configurar webhook URL en Fiserv dashboard
- [ ] Probar pago real con tarjeta de prueba
- [ ] Verificar logs en Railway
- [ ] Verificar creación de donación en Supabase

### Paso 9: Documentación
- [ ] Crear `GUIA-PAGOS-FISERV.md`
- [ ] Crear `TESTING-PAGOS.md`
- [ ] Actualizar README principal

### Paso 10: Monitoreo
- [ ] Configurar alertas de errores en webhook
- [ ] Dashboard de pagos en admin
- [ ] Logs de transacciones fallidas

---

## 🎯 Prioridades

### 🔴 CRÍTICO (hacer ahora)
1. **Crear tabla `payment_attempts` en Supabase**
2. **Agregar `API_BASE_URL` en backend**
3. **Crear página `/donar` en frontend**
4. **Crear `lib/payments.ts`**

### 🟡 IMPORTANTE (hacer después)
5. Páginas de success/error
6. FormularioPagoFiserv (auto-submit)
7. Testing local con ngrok

### 🟢 NICE TO HAVE
8. Tests unitarios
9. Dashboard de pagos (admin)
10. Retry automático de webhooks

---

## 💡 Recomendaciones

### Seguridad
- ✅ El hash se está validando correctamente en el webhook
- ✅ El webhook NO requiere JWT (Fiserv es el cliente)
- ⚠️ Agregar rate limiting al endpoint de webhook
- ⚠️ Agregar logs detallados de intentos de webhook inválidos

### UX
- Mostrar loading mientras se crea la transacción
- Mostrar mensaje claro cuando el usuario es redirigido a Fiserv
- En /donar/success, verificar el estado del pago desde el backend (puede que el webhook llegue después)
- Ofrecer "Descargar Recibo" después de la donación

### Performance
- Cachear lista de organizaciones en el frontend
- Usar optimistic UI para el formulario de donación

### Monitoreo
- Agregar logging con `Logger` de NestJS en cada paso
- Enviar notificación por email al admin si un webhook falla
- Dashboard simple para ver pagos pendientes/completados

---

## 🚀 Siguiente Paso Recomendado

**Empezar por lo CRÍTICO:**

1. Crear y ejecutar la migración de `payment_attempts`
2. Agregar variables de entorno faltantes
3. Crear la página `/donar` con formulario básico
4. Crear `lib/payments.ts`
5. Probar flujo completo en local

Una vez funcionando básico:
- Mejorar UI/UX
- Agregar validaciones
- Testing exhaustivo

---

## 📞 ¿Necesitas Ayuda?

Si quieres que implemente alguna parte específica, solo dime cuál y empiezo. Por ejemplo:

- "Crea la migración de payment_attempts"
- "Crea la página de donar completa"
- "Crea el componente de formulario de pago"

¡Estoy listo para continuar! 🚀
