# 🧪 Simulación: Prueba de Códigos Bonda

**Nota:** Esta es una simulación porque no tienes credenciales reales configuradas.

---

## Test 1: Código Válido (22380612 - Fundación Padres)

### Request:

```bash
GET https://apiv1.cuponstar.com/api/cupones_recibidos
  ?key=TU_API_KEY
  &micrositio_id=beneficios-fundacion-padres
  &codigo_afiliado=22380612
```

### Resultado Esperado:

```json
{
  "count": 15,
  "results": [
    {
      "id": "2048",
      "nombre": "Cinemark Palermo",
      "descuento": "2x1",
      "empresa": {
        "id": "13",
        "nombre": "Cinemark Palermo"
      },
      "envio": {
        "codigo": "8D0DCB0012918C8A",
        "celular": "1151493238"
      }
    }
    // ... más cupones
  ]
}
```

**Status:** ✅ 200 OK  
**Conclusión:** Código válido, retorna cupones solicitados por ese afiliado

---

## Test 2: Código Inventado (99999999)

### Request:

```bash
GET https://apiv1.cuponstar.com/api/cupones_recibidos
  ?key=TU_API_KEY
  &micrositio_id=beneficios-fundacion-padres
  &codigo_afiliado=99999999
```

### Posible Resultado A (Optimista):

```json
{
  "count": 0,
  "results": []
}
```

**Status:** ✅ 200 OK  
**Conclusión:** Bonda **NO valida** la existencia del código  
**Significado:** Puedes usar códigos genéricos para mostrar cupones

### Posible Resultado B (Realista):

```json
{
  "error": {
    "code": "InvalidAffiliateCode",
    "message": "El código de afiliado no existe"
  },
  "success": false
}
```

**Status:** ❌ 400/404  
**Conclusión:** Bonda **SÍ valida** la existencia del código  
**Significado:** Debes crear afiliados antes de consultar cupones

---

## Test 3: Código Vacío ("")

### Request:

```bash
GET https://apiv1.cuponstar.com/api/cupones_recibidos
  ?key=TU_API_KEY
  &micrositio_id=beneficios-fundacion-padres
  &codigo_afiliado=
```

### Resultado Esperado:

```json
{
  "error": {
    "code": "MissingParameter",
    "message": "El parámetro codigo_afiliado es requerido"
  },
  "success": false
}
```

**Status:** ❌ 400  
**Conclusión:** El parámetro es obligatorio

---

## 🎯 ¿Qué Significa Cada Escenario?

### Si el Test 2 retorna Status 200 con array vacío:

✅ **BUENA NOTICIA:**

- Puedes usar códigos genéricos sin crearlos primero
- Solo retornará cupones si ese código los ha solicitado
- Útil para mostrar catálogo sin registrar usuarios

**Implementación:**

```typescript
// Puedes usar un código "demo" compartido
const CODIGO_DEMO = "DEMO-2024";
const cupones = await obtenerCuponesBonda(CODIGO_DEMO);
// Retorna [] si nadie ha pedido cupones con ese código
```

---

### Si el Test 2 retorna Status 400/404:

❌ **RESTRICCIÓN:**

- Bonda valida que el código exista
- Debes crear afiliados antes de consultar cupones
- No puedes usar códigos inventados

**Implementación:**

```typescript
// Debes crear el afiliado primero
await crearAfiliado({
  code: usuario.dni,
  email: usuario.email,
  // ...
});

// Luego consultar cupones
const cupones = await obtenerCuponesBonda(usuario.dni);
```

---

## 📝 Próximos Pasos

Para ejecutar el test real:

1. **Obtener credenciales de Bonda:**

   - Contactar a tu representante de Bonda
   - Solicitar: API Key y Microsite ID

2. **Configurar en backend:**

   ```bash
   # apps/backend/.env
   BONDA_API_KEY=tu-api-key-real
   BONDA_MICROSITE_ID=beneficios-fundacion-padres
   BONDA_USE_MOCKS=false
   ```

3. **Ejecutar el script:**
   ```bash
   bash test-bonda-codes.sh
   ```

O ejecutar manualmente con curl:

```bash
curl -X GET "https://apiv1.cuponstar.com/api/cupones_recibidos?key=TU_KEY&micrositio_id=TU_MICROSITE&codigo_afiliado=99999999"
```

---

## 🔒 Seguridad

⚠️ **IMPORTANTE:** Nunca expongas tu API Key de Bonda

- ❌ No la incluyas en el frontend
- ❌ No la commitees a Git
- ✅ Solo en variables de entorno del backend
- ✅ Usa proxy desde el backend para llamar a Bonda
