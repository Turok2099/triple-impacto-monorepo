# 🧪 Resultado de Prueba - Endpoints Bonda API

## 📊 Resultados de las Pruebas

### ❌ **Endpoint `/api/cupones` - FALLA**

**URL probada:**

```
https://apiv1.cuponstar.com/api/cupones?key=TOKEN&micrositio_id=911299
```

**Resultado:**

```json
{
  "error": "Usuario no autentificado",
  "code": "MISSING_DATA_MDW"
}
```

**Conclusión:**

- ❌ El endpoint `/api/cupones` **NO funciona** solo con `key` y `micrositio_id`
- ⚠️ Requiere autenticación adicional (posiblemente `codigo_afiliado`)
- La información compartida sobre este endpoint puede ser incorrecta o incompleta

---

### ✅ **Endpoint `/api/cupones_recibidos` - FUNCIONA**

**URL probada:**

```
https://apiv1.cuponstar.com/api/cupones_recibidos?key=TOKEN&micrositio_id=911299&codigo_afiliado=22380612
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
      "codigo_afiliado": "22380612",
      "incluir_codigo": "1",
      "envio": {
        "codigo_id": 6942773,
        "codigo": "enero20",
        "operadora": "ws",
        "celular": "ws",
        "mensaje": "...",
        "fecha": "2026-01-31 12:53:51"
      },
      "empresa": {
        "id": 12755,
        "nombre": "Dash"
      }
    }
    // ... más cupones
  ]
}
```

**Cupones retornados (11 en total):**

1. Dash - 20%
2. Chungo - 10%
3. Starbucks - 10%
4. Plataforma 10 - 50%
5. Quiksilver - 15%
6. Piccadely Online - 15%
7. Plataforma 10 - 50% (duplicado)
8. Mostaza - 40% (duplicado)
9. Mostaza - 40% (duplicado)
10. Mostaza - 20%
11. Digital Sport - 15%

**Observaciones:**

- ✅ El endpoint funciona correctamente
- ⚠️ **HAY DUPLICADOS** (Plataforma 10 y Mostaza aparecen 2 veces)
- ℹ️ Los duplicados tienen:
  - Mismo `id` de cupón
  - Diferente `codigo_id` (código único de cada solicitud)
  - Diferentes fechas de solicitud
- 📅 Son cupones **USADOS** entre sep-2025 y ene-2026

---

## 🤔 Problema Identificado

### El endpoint que informaste NO existe o requiere parámetros diferentes

**Lo que me dijiste:**

> "Ese endpoint es: `GET /api/cupones`"
> "No requiere usuario. Solo requiere: key, micrositio_id"

**Realidad:**

- ❌ El endpoint `/api/cupones` da error de autenticación
- No funciona solo con `key` y `micrositio_id`

---

## 💡 Opciones Disponibles

### **Opción 1: Contactar a Bonda (RECOMENDADO)**

Necesitas **confirmar con tu contacto de Bonda**:

1. ¿Existe un endpoint para obtener el **catálogo de cupones disponibles**?
2. ¿Cuál es el nombre exacto del endpoint?
3. ¿Qué parámetros requiere?
4. ¿Necesita código de afiliado o no?

**Pregunta específica para Bonda:**

> "¿Existe un endpoint que retorne el catálogo completo de cupones disponibles de un micrositio (cupones que aún no han sido solicitados por ningún usuario), sin necesidad de proporcionar un código de afiliado específico?"

---

### **Opción 2: Usar `/api/cupones_recibidos` con Filtrado**

Si Bonda confirma que NO existe un endpoint de catálogo público:

**Solución temporal:**

1. Usar `/api/cupones_recibidos` (el que funciona)
2. **Filtrar duplicados** en el backend por `id` de cupón
3. Esto seguirá mostrando cupones usados, pero al menos sin duplicados

**Ventajas:**

- ✅ Funciona ahora mismo
- ✅ No requiere cambios de API
- ✅ Elimina duplicados

**Desventajas:**

- ⚠️ Sigue mostrando cupones usados (no disponibles)
- ⚠️ El catálogo está limitado al historial de un usuario

---

### **Opción 3: Catálogo Manual**

Crear y mantener manualmente el catálogo en `public_coupons`:

- Sin sincronización automática con Bonda
- Control total del contenido
- Requiere mantenimiento manual

---

## 📋 Próximos Pasos

### 🔴 **URGENTE: Validar con Bonda**

Antes de hacer cualquier cambio en el código, **DEBES confirmar con Bonda**:

```
Asunto: Consulta sobre endpoint de catálogo de cupones

Hola equipo de Bonda,

Necesito obtener el catálogo completo de cupones disponibles de un micrositio
para mostrarlo en nuestra landing page pública.

Actualmente estoy usando /api/cupones_recibidos, pero este endpoint retorna
cupones que YA fueron solicitados por un usuario (historial), no los cupones
disponibles.

Preguntas:
1. ¿Existe un endpoint que retorne cupones DISPONIBLES (no usados)?
2. Si existe, ¿cuál es el nombre y qué parámetros requiere?
3. ¿Este endpoint requiere código de afiliado o solo token y microsite_id?

Gracias!
```

---

## 🛑 NO Proceder con Cambios en el Código

**Hasta que Bonda confirme el endpoint correcto:**

- ❌ NO modificar `bonda.service.ts`
- ❌ NO cambiar la URL del endpoint
- ❌ NO remover `codigo_afiliado` del código actual

**El código actual funciona, solo muestra duplicados.**
**La solución de duplicados es simple (filtrar por `id`).**
**Pero primero necesitamos confirmar cuál es el endpoint correcto.**

---

## 📧 Información para Compartir con Bonda

**Credenciales probadas:**

- Micrositio: Beneficios Fundación Padres
- ID: 911299
- Token: DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq

**Endpoint que funciona:**

```
https://apiv1.cuponstar.com/api/cupones_recibidos?key=TOKEN&micrositio_id=911299&codigo_afiliado=22380612
```

**Endpoint que NO funciona:**

```
https://apiv1.cuponstar.com/api/cupones?key=TOKEN&micrositio_id=911299
```

**Error recibido:**

```json
{
  "error": "Usuario no autentificado",
  "code": "MISSING_DATA_MDW"
}
```
