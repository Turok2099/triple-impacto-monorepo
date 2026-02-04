# 🔄 Flujo Completo: Usuario → Pago → Bonda

## 📋 Descripción General

Este documento describe el flujo completo desde que un usuario se registra hasta que obtiene acceso a los cupones de Bonda, pasando por el proceso de pago.

## 🎯 Flujo Propuesto (CORRECTO)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASE 1: REGISTRO                                │
└─────────────────────────────────────────────────────────────────────────┘

1. Usuario completa formulario de registro
   ├─ nombre, email, password, teléfono, provincia, localidad
   └─ acepta términos y condiciones

2. Frontend → Backend: POST /api/auth/register
   
3. Backend valida datos y crea usuario en Supabase
   ├─ Genera código de afiliado temporal (pre-generado)
   ├─ Hashea contraseña
   ├─ Estado inicial: 'registrado' (sin pago)
   ├─ bonda_sync_status: 'pending' (aún no se sincroniza)
   └─ Guarda en tabla 'usuarios'

4. Backend genera JWT y retorna al frontend
   
5. Usuario queda REGISTRADO pero SIN ACCESO a cupones Bonda
   └─ Puede ver el catálogo general pero no obtener códigos

┌─────────────────────────────────────────────────────────────────────────┐
│                     FASE 2: PRIMER PAGO                                 │
└─────────────────────────────────────────────────────────────────────────┘

6. Usuario autenticado accede a página de donación
   ├─ Selecciona monto a donar
   ├─ Selecciona organización beneficiaria
   └─ Hace clic en "Donar"

7. Frontend → Backend: POST /api/donaciones/create
   └─ Crea registro en tabla 'donaciones' con estado 'pendiente'

8. Backend → Frontend: Retorna payment_id y URL del gateway de pago (por implementar)

9. Frontend redirige al gateway de pago
   ├─ Usuario ingresa datos de tarjeta / método de pago
   └─ El gateway procesa el pago

10. Gateway → Backend: Webhook de confirmación
    └─ POST /api/webhooks/pago
    └─ Body: { payment_id, status, amount, ... }

┌─────────────────────────────────────────────────────────────────────────┐
│              FASE 3: ACTIVACIÓN EN BONDA (POST-PAGO)                    │
└─────────────────────────────────────────────────────────────────────────┘

11. Backend recibe confirmación del pago (webhook)
    ├─ Valida webhook signature (seguridad)
    └─ Verifica que payment_id existe y está pendiente

12. Backend actualiza estado de donación
    ├─ donaciones.estado = 'completada'
    ├─ donaciones.completed_at = NOW()
    └─ donaciones.payment_status = 'approved'

13. Backend verifica si es la PRIMERA donación del usuario
    └─ Query: SELECT COUNT(*) FROM donaciones 
             WHERE usuario_id = X AND estado = 'completada'

14. SI es la PRIMERA donación:
    ├─ Backend → Bonda API: POST /api/v2/microsite/{id}/affiliates
    │  └─ Body: { code, email, nombre, telefono, provincia, localidad }
    │
    ├─ Bonda confirma creación de afiliado
    │  └─ Response: { success: true, data: {...} }
    │
    ├─ Backend actualiza usuario en Supabase
    │  ├─ usuarios.bonda_sync_status = 'synced'
    │  ├─ usuarios.bonda_synced_at = NOW()
    │  └─ usuarios.estado = 'activo' (con acceso a Bonda)
    │
    └─ Backend registra log
       └─ logs_sync_bonda: { operacion: 'create', exitoso: true, ... }

15. Backend envía respuesta al webhook (200 OK)

16. Frontend recibe redirect del gateway con resultado
    └─ Redirige a /donacion/success

17. Usuario AHORA tiene acceso completo a cupones Bonda
    ├─ Puede ver cupones personalizados
    ├─ Puede obtener códigos de descuento
    └─ Dashboard muestra "Cuenta Activada con Bonda"

┌─────────────────────────────────────────────────────────────────────────┐
│                  DONACIONES POSTERIORES (2da, 3ra, etc)                 │
└─────────────────────────────────────────────────────────────────────────┘

18. En donaciones posteriores:
    ├─ Se repite flujo de pago (pasos 6-12)
    ├─ Se actualiza el registro de donación
    └─ NO se crea nuevo afiliado en Bonda (ya existe)
    └─ El usuario sigue teniendo acceso a cupones
```

## 🔧 Cambios Necesarios en el Código Actual

### ⚠️ IMPORTANTE: Actualmente estamos creando el afiliado en Bonda en el REGISTRO

**Debemos cambiar esto:**

```typescript
// ❌ ACTUAL (en auth.service.ts)
async register(registerDto: RegisterDto) {
  // ...
  const usuario = await this.supabaseService.createUser({...});
  
  // ⚠️ Esto NO debería estar aquí
  this.sincronizarConBonda(usuario.id, bondaCode, registerDto);
  
  return { user, token };
}
```

**Debe cambiarse a:**

```typescript
// ✅ CORRECTO (en auth.service.ts)
async register(registerDto: RegisterDto) {
  // ...
  const usuario = await this.supabaseService.createUser({
    ...datos,
    bonda_sync_status: 'pending', // Sin sincronizar
    estado: 'registrado', // Estado inicial
  });
  
  // NO sincronizar con Bonda aquí
  
  return { user, token };
}
```

**Y agregar la lógica en el webhook de pago:**

```typescript
// ✅ NUEVO (en webhooks.service.ts o donaciones.service.ts)
async procesarPagoAprobado(donacionId: string, usuarioId: string) {
  // 1. Actualizar donación
  await this.actualizarDonacion(donacionId, 'completada');
  
  // 2. Verificar si es primera donación
  const esPrimeraDonacion = await this.esPrimeraDonacion(usuarioId);
  
  if (esPrimeraDonacion) {
    // 3. Crear afiliado en Bonda
    const usuario = await this.supabaseService.findUserById(usuarioId);
    await this.bondaService.crearAfiliado({
      code: usuario.bonda_affiliate_code,
      email: usuario.email,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      provincia: usuario.provincia,
      localidad: usuario.localidad,
    });
    
    // 4. Actualizar estado del usuario
    await this.supabaseService.updateBondaSyncStatus(usuarioId, 'synced');
    await this.supabaseService.from('usuarios')
      .update({ estado: 'activo' })
      .eq('id', usuarioId);
  }
}
```

## 📊 Estados del Usuario

### En tabla `usuarios`:

| Estado | Descripción | Acceso a Bonda |
|--------|-------------|----------------|
| `registrado` | Usuario creado, sin pago | ❌ No |
| `activo` | Primera donación completada | ✅ Sí |
| `inactivo` | Usuario desactivado manualmente | ❌ No |
| `eliminado` | Usuario eliminó su cuenta | ❌ No |

### En campo `bonda_sync_status`:

| Estado | Descripción |
|--------|-------------|
| `pending` | Usuario registrado, esperando primer pago |
| `synced` | Afiliado creado exitosamente en Bonda |
| `error` | Error al crear afiliado en Bonda |

## 🗄️ Estructura de Datos

### Tabla `usuarios` (actualizada)

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  telefono VARCHAR(50),
  provincia VARCHAR(100),
  localidad VARCHAR(100),
  
  -- Código pre-generado para Bonda
  bonda_affiliate_code VARCHAR(255) UNIQUE NOT NULL,
  
  -- Estado del usuario
  estado VARCHAR(50) DEFAULT 'registrado',  -- registrado, activo, inactivo, eliminado
  
  -- Sincronización con Bonda
  bonda_sync_status VARCHAR(50) DEFAULT 'pending',  -- pending, synced, error
  bonda_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_donation_at TIMESTAMP WITH TIME ZONE,  -- Fecha de primera donación
  
  -- Metadata
  verificado BOOLEAN DEFAULT false
);
```

### Tabla `donaciones`

```sql
CREATE TABLE donaciones (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  
  -- Información de la donación
  monto DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  metodo_pago VARCHAR(50),
  
  -- Organización beneficiaria
  organizacion_id UUID,
  organizacion_nombre VARCHAR(255),
  
  -- Estado de la donación
  estado VARCHAR(50) DEFAULT 'pendiente',  -- pendiente, completada, fallida, reembolsada
  
  -- Información de pago externo (gateway por definir)
  payment_id VARCHAR(255) UNIQUE,
  payment_status VARCHAR(100),
  transaction_id VARCHAR(255),
  
  -- Certificado de donación
  certificado_url TEXT,
  certificado_generado BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  is_first_donation BOOLEAN DEFAULT false  -- Flag para identificar primera donación
);
```

## 🚀 Implementación por Fases

### Fase 1: Registro (YA IMPLEMENTADO - NECESITA AJUSTE)
- [x] Crear módulo de autenticación
- [ ] **Remover** sincronización con Bonda del registro
- [ ] Agregar campo `estado` en usuarios
- [ ] Actualizar estados iniciales

### Fase 2: Donaciones y gateway de pago (POR HACER)
- [ ] Crear módulo de donaciones
- [ ] Definir e integrar gateway de pago
- [ ] Crear endpoint para iniciar pago
- [ ] Crear webhook para recibir confirmaciones
- [ ] Validar signatures de webhook

### Fase 3: Activación en Bonda (POR HACER)
- [ ] Mover lógica de sincronización al webhook
- [ ] Detectar primera donación
- [ ] Crear afiliado en Bonda post-pago
- [ ] Actualizar estados del usuario
- [ ] Notificar al usuario por email

### Fase 4: Dashboard y Cupones (POR HACER)
- [ ] Mostrar estado de cuenta en dashboard
- [ ] Mostrar cupones según estado
- [ ] Implementar obtención de códigos
- [ ] Historial de donaciones

## 📝 Validaciones Importantes

### Seguridad del Webhook de pago

```typescript
async validarWebhookPago(signature: string, body: string): Promise<boolean> {
  // El gateway firma el webhook (ej. HMAC-SHA256)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAGO_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### Idempotencia del Webhook

```typescript
// Evitar procesar el mismo pago múltiples veces
async procesarWebhook(paymentId: string, data: any) {
  // Verificar si ya fue procesado
  const donacion = await this.getDonacionByPaymentId(paymentId);
  
  if (donacion.estado === 'completada') {
    this.logger.warn(`Webhook duplicado para payment_id: ${paymentId}`);
    return { message: 'Already processed' };
  }
  
  // Procesar el pago...
}
```

## 🎨 Experiencia de Usuario

### Vista del Usuario Registrado (Sin Pago)

```
┌─────────────────────────────────────────────┐
│  Dashboard - Triple Impacto                 │
├─────────────────────────────────────────────┤
│                                             │
│  👋 Hola, Juan                              │
│                                             │
│  ⚠️ Tu cuenta está pendiente de activación │
│                                             │
│  Para acceder a los cupones de descuento    │
│  exclusivos de Bonda, realiza tu primera    │
│  donación.                                  │
│                                             │
│  [Donar Ahora]                              │
│                                             │
│  📋 Catálogo General                        │
│  (Puedes ver los descuentos disponibles)    │
│                                             │
└─────────────────────────────────────────────┘
```

### Vista del Usuario Activo (Con Pago)

```
┌─────────────────────────────────────────────┐
│  Dashboard - Triple Impacto                 │
├─────────────────────────────────────────────┤
│                                             │
│  👋 Hola, Juan                              │
│                                             │
│  ✅ Cuenta Activada                         │
│  Código Bonda: juan_xy7k2p3                 │
│                                             │
│  🎟️ Mis Cupones (12)                       │
│  [Ver Todos]                                │
│                                             │
│  💰 Mis Donaciones                          │
│  Total donado: $5,000 ARS                   │
│  [Ver Historial]                            │
│                                             │
│  📊 Impacto Generado                        │
│  [Ver Detalles]                             │
│                                             │
└─────────────────────────────────────────────┘
```

## ⚡ Ventajas de Este Flujo

1. **Ahorro de recursos**: No se crean afiliados en Bonda que nunca pagarán
2. **Mejor control**: Solo usuarios pagos tienen acceso a cupones
3. **Motivación**: El acceso a Bonda es un incentivo para la primera donación
4. **Auditoría clara**: Fecha de primera donación = fecha de activación
5. **Escalable**: Fácil agregar lógica de suscripciones después

## 🔄 Flujos Alternativos

### Usuario cancela el pago

```
1. El gateway envía webhook con status: 'cancelled'
2. Backend actualiza donaciones.estado = 'fallida'
3. Backend NO crea afiliado en Bonda
4. Usuario puede reintentar el pago
```

### Error al crear afiliado en Bonda

```
1. Pago exitoso
2. Error al crear en Bonda (ej: código duplicado)
3. Backend:
   - Marca donaciones.estado = 'completada' (el pago fue exitoso)
   - Marca usuarios.bonda_sync_status = 'error'
   - Registra error en logs_sync_bonda
4. Sistema de retry automático intenta crear afiliado
5. Si persiste, notificar a administradores
```

## 📚 Próximos Pasos

1. **Ajustar módulo de autenticación** (remover sincronización de Bonda)
2. **Crear módulo de donaciones**
3. **Definir e integrar gateway de pago**
4. **Implementar webhooks**
5. **Crear lógica de activación post-pago**
6. **Actualizar frontend con estados**

---

**Resumen**: El usuario se registra → paga → se activa en Bonda. Este flujo maximiza el valor y minimiza costos. 🚀
