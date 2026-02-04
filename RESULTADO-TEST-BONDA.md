# 🧪 Resultado del Test: Códigos de Afiliado Bonda

**Fecha:** 27 de enero, 2026  
**Microsite:** Beneficios Fundación Padres (ID: 911299)  
**API:** https://apiv1.cuponstar.com

---

## 📋 Tests Realizados

### ✅ Test 1: Código Real (22380612)

**Request:**

```bash
GET /api/cupones_recibidos
  ?key=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq
  &micrositio_id=911299
  &codigo_afiliado=22380612
```

**Resultado:**

```json
{
  "count": 11,
  "results": [
    {
      "id": 14822,
      "nombre": "Dash",
      "descuento": "20%",
      "envio": {
        "codigo": "enero20",
        "mensaje": "Ingresá el código en www.dashdeportes.com.ar..."
      }
    }
    // ... 10 cupones más
  ]
}
```

**Status:** ✅ 200 OK  
**Conclusión:** Código válido, retorna 11 cupones solicitados

---

### ❌ Test 2: Código Inventado (99999999)

**Request:**

```bash
GET /api/cupones_recibidos
  ?key=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq
  &micrositio_id=911299
  &codigo_afiliado=99999999
```

**Resultado:**

```json
{
  "error": {
    "detail": "Ocurrió un error inesperado. Escribinos a soporte@bondacom.com con tu DNI",
    "code": "AuthorizationException"
  },
  "success": false
}
```

**Status:** ❌ 400 Bad Request  
**Conclusión:** Bonda **VALIDA** la existencia del código de afiliado

---

### ❌ Test 3: Código Vacío ("")

**Request:**

```bash
GET /api/cupones_recibidos
  ?key=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq
  &micrositio_id=911299
  &codigo_afiliado=
```

**Resultado:**

```json
{
  "error": "Usuario no autentificado",
  "code": "MISSING_DATA_MDW"
}
```

**Status:** 🟡 200 OK (pero con error en el body)  
**Conclusión:** El parámetro `codigo_afiliado` es **obligatorio**

---

## 🎯 Conclusión Final

### ❌ NO puedes usar códigos genéricos

Bonda **SÍ valida** que el código de afiliado exista en su base de datos antes de retornar cupones.

**Implicaciones:**

1. **No puedes** usar códigos inventados para mostrar cupones
2. **Debes crear** afiliados en Bonda antes de consultar cupones
3. **Cada usuario** necesita ser registrado en Bonda con su DNI

---

## 💡 Estrategia Recomendada

### Para el HOME (Visitantes)

**Opción A: Tabla `public_coupons` (ACTUAL) ✅**

- Mantener la tabla `public_coupons` en Supabase
- Sync automático con un código válido (ej: 22380612)
- Mostrar cupones sin códigos (solo info del descuento)
- **Ventaja:** No requiere crear afiliados por cada visitante

**Implementación:**

```sql
-- Ya tienes esto funcionando
SELECT * FROM public_coupons WHERE activo = true;
```

---

### Para Usuarios Logueados (Dashboard)

**Opción B: Crear afiliado automáticamente al donar**

- Usuario dona → Backend crea afiliado en Bonda
- Usa DNI del usuario como `codigo_afiliado`
- Consulta cupones con ese código

**Implementación:**

```typescript
// Al completar donación (webhook de Fiserv)
if (donacion.estado === "completada") {
  // Crear afiliado en Bonda
  await bondaService.crearAfiliado({
    code: usuario.dni,
    email: usuario.email,
    nombre: usuario.nombre,
    // ...
  });

  // Vincular en tu base de datos
  await supabase.insert("usuarios_bonda_afiliados", {
    usuario_id: usuario.id,
    codigo_afiliado: usuario.dni,
    bonda_microsite_id: microsite.id,
  });
}
```

**Flujo:**

```
1. Usuario registra → Solo crea usuario local
2. Usuario dona → Crea afiliado Bonda automáticamente
3. Usuario dashboard → Consulta cupones con su DNI
4. Usuario solicita → Obtiene código del cupón
```

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────┐
│           VISITANTE (SIN LOGIN)         │
└───────────────┬─────────────────────────┘
                │
                ├─► HOME (/)
                │   └─► public_coupons (sin códigos)
                │       └─► Sync con código demo (22380612)
                │
                v
┌─────────────────────────────────────────┐
│      USUARIO REGISTRADO (CON LOGIN)     │
└───────────────┬─────────────────────────┘
                │
                ├─► Dona ($$$)
                │   └─► Backend crea afiliado Bonda
                │       └─► codigo_afiliado = usuario.dni
                │
                ├─► DASHBOARD (/dashboard)
                │   └─► Consulta cupones con su DNI
                │       └─► Puede solicitar códigos
                │
                v
┌─────────────────────────────────────────┐
│    USUARIO CON AFILIADO BONDA ACTIVO    │
└─────────────────────────────────────────┘
```

---

## ✅ Lo Que Ya Tienes Implementado

1. ✅ Tabla `public_coupons` para visitantes
2. ✅ Sync automático de cupones públicos
3. ✅ Tabla `usuarios_bonda_afiliados` para vincular usuarios
4. ✅ Dashboard de cupones
5. ✅ Webhook de Fiserv para donaciones

---

## 🔧 Lo Que Falta Implementar

1. ⬜ **Crear afiliado Bonda automáticamente** al completar donación

   - Endpoint: `POST /api/v2/microsite/{id}/affiliates`
   - Usar DNI como `codigo_afiliado`

2. ⬜ **Validar que el usuario tenga afiliado** antes de mostrar dashboard

   - Verificar en `usuarios_bonda_afiliados`
   - Si no tiene → Mostrar mensaje "Doná para acceder"

3. ⬜ **Manejo de errores** en consulta de cupones
   - Si el afiliado fue eliminado en Bonda
   - Si expiraron los cupones

---

## 📝 Próximos Pasos

### 1. Verificar el Webhook de Fiserv

**Revisar:** `apps/backend/src/modules/payments/fiserv-webhook.service.ts`

**Líneas críticas:**

```typescript
// ¿Ya está creando el afiliado Bonda automáticamente?
if (donacion.estado === "completada") {
  await this.crearAfiliadoBonda(usuario);
}
```

### 2. Implementar Creación de Afiliado

**Archivo:** `apps/backend/src/modules/bonda/bonda.service.ts`

**Método necesario:**

```typescript
async crearAfiliado(usuario: Usuario, microsite: BondaMicrosite) {
  const response = await fetch(
    `https://apiv1.cuponstar.com/api/v2/microsite/${microsite.microsite_id}/affiliates`,
    {
      method: 'POST',
      headers: {
        'token': microsite.api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: usuario.dni,
        email: usuario.email,
        nombre: usuario.nombre,
        // ... otros campos
      }),
    }
  );

  return response.json();
}
```

### 3. Testing

**Probar:**

1. Donar con usuario de prueba
2. Verificar que se creó el afiliado en Bonda
3. Verificar registro en `usuarios_bonda_afiliados`
4. Ver cupones en dashboard con el DNI del usuario

---

## 🚫 Lo Que NO Puedes Hacer

- ❌ Usar códigos inventados para consultar cupones
- ❌ Mostrar cupones de usuario sin crear afiliado primero
- ❌ Compartir un código genérico entre todos los usuarios

---

## ✅ Lo Que SÍ Puedes Hacer

- ✅ Usar `public_coupons` para visitantes (sin códigos)
- ✅ Crear afiliados automáticamente al donar
- ✅ Consultar cupones por usuario con su DNI
- ✅ Mostrar códigos solo a usuarios con afiliado activo

---

**Resumen:** Bonda valida códigos, así que necesitas crear afiliados reales para cada usuario que done.
