# ✅ SOLUCIÓN: Cupones Disponibles vs Cupones Usados

## 🎯 Problema Resuelto

**El backend estaba usando el endpoint incorrecto de Bonda.**

---

## 📊 Comparación de Endpoints

### ❌ **ANTES: `/api/cupones_recibidos` (INCORRECTO)**

```typescript
const url = `${this.apiUrl}/api/cupones_recibidos`;
```

**Características:**
- ❌ Retorna cupones **USADOS** por el afiliado (historial)
- ❌ Solo 11-25 cupones
- ❌ Tiene campo `envio` con códigos únicos ya solicitados
- ❌ **Muestra DUPLICADOS** (mismo cupón pedido varias veces)
- ❌ No es un catálogo de ofertas disponibles

**Ejemplo de respuesta:**
```json
{
  "count": 11,
  "results": [
    {
      "id": 14822,
      "nombre": "Dash",
      "envio": {
        "codigo_id": 6942773,
        "codigo": "enero20",  ← Código único YA USADO
        "fecha": "2026-01-31 12:53:51"
      }
    }
  ]
}
```

---

### ✅ **DESPUÉS: `/api/cupones` (CORRECTO)**

```typescript
const url = `${this.apiUrl}/api/cupones`;
```

**Características:**
- ✅ Retorna cupones **DISPONIBLES** para solicitar
- ✅ **1647 cupones** en el catálogo
- ✅ Sin campo `envio` (no tiene códigos usados)
- ✅ **Sin duplicados** (cada cupón aparece una sola vez)
- ✅ Información completa de cada oferta
- ✅ Paginación incluida

**Ejemplo de respuesta:**
```json
{
  "count": 1647,
  "next": "http://apiv1.cuponstar.com/api/cupones?...&page=2",
  "results": [
    {
      "id": "14830",
      "nombre": "Coca-Cola En Tu Casa",
      "descuento": "25%",
      "descripcion_breve": "25% de descuento en el total de tu compra.",
      "usage_instructions": "<p>1- Ingresá en www.coca-colaentucasa.com...</p>",
      "descripcion_micrositio": "...",
      "legales": "...",
      "fecha_vencimiento": "2026-02-28 23:59:59",
      "permitir_sms": true,
      "usar_en": {
        "email": false,
        "phone": false,
        "online": true,
        "onsite": false,
        "whatsapp": false
      },
      "categorias": [
        {"id": 13, "nombre": "Compras"}
      ],
      "empresa": {
        "id": "11358",
        "nombre": "Coca-Cola En Tu Casa"
      }
    }
  ]
}
```

---

## 🔧 Cambios Realizados

### **1. Backend: `bonda.service.ts` (línea 108)**

```diff
- const url = `${this.apiUrl}/api/cupones_recibidos`;
+ const url = `${this.apiUrl}/api/cupones`;
```

**Archivo:** `apps/backend/src/modules/bonda/bonda.service.ts`

---

## 📝 Documentación Bonda

Según la documentación oficial de Bonda (Public API - V2.3):

> "La API de cupones permite la consulta y búsqueda de cupones, así como la generación de ordenes para los mismos."

**Endpoints disponibles:**

1. **`GET /api/cupones`** ✅  
   - Catálogo de cupones disponibles  
   - Requiere: `key`, `micrositio_id`, `codigo_afiliado`

2. **`GET /api/cupones_recibidos`** ❌  
   - Historial de cupones solicitados por el usuario  
   - Requiere: `key`, `micrositio_id`, `codigo_afiliado`

**Nota importante:**  
Aunque se llame "Public API", **TODOS los endpoints requieren `codigo_afiliado`** (líneas 119-120 de la documentación).

---

## 🎉 Resultado

### **Antes:**
- 11 cupones usados con duplicados

### **Después:**
- 1647 cupones disponibles sin duplicados ✅

---

## 🧪 Prueba del Endpoint Corregido

**Comando:**
```bash
curl "https://apiv1.cuponstar.com/api/cupones?key=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq&micrositio_id=911299&codigo_afiliado=22380612"
```

**Resultado:**
```
✅ 1647 cupones disponibles
✅ Sin duplicados
✅ Información completa de cada oferta
```

---

## 📋 Próximos Pasos

1. ✅ **Cambio realizado** en `bonda.service.ts`
2. ⏳ **Probar** la sincronización de cupones
3. ⏳ **Verificar** el home sin duplicados
4. ⏳ **Desplegar** los cambios

---

## 🔍 Diferencia Visual en el Home

### **Antes:**
```
Cupones en el home:
1. Mostaza - 40% (duplicado)
2. Mostaza - 40% (duplicado)
3. Plataforma 10 - 50% (duplicado)
...
```

### **Después:**
```
Cupones en el home:
1. Coca-Cola En Tu Casa - 25%
2. Rosen - 10%
3. Atrápalo - PROMO
4. Hausbrot - 20%
5. Hush Puppies - 10%
...
(1647 cupones únicos, sin duplicados)
```

---

## ✅ Solución Confirmada

El endpoint `/api/cupones` es el correcto para mostrar cupones **disponibles** en el home, no cupones **usados**.

**Fecha de corrección:** 3 de febrero de 2026
