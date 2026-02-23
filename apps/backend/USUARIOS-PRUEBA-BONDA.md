# 👥 Usuarios de Prueba - Bonda API

Este documento lista todos los usuarios de prueba creados en los micrositios de Bonda para testing.

**Fecha de creación:** 27 de enero, 2026

---

## 📋 Usuarios Creados por Micrositio

| # | Micrositio | ID Micrositio | Código Afiliado | Email | Total Cupones | Status |
|---|------------|---------------|-----------------|-------|-------------:|--------|
| 1 | Club de Impacto Proyectar | 911436 | `12346000` | test.proyectar@tripleimpacto.local | 1,654 | ✅ |
| 2 | Biblioteca Rurales Argentinas | 911406 | `12345684` | test@tripleimpacto.local | 1,661 | ✅ |
| 3 | Haciendo Camino | 911405 | `12345683` | test@tripleimpacto.local | 1,661 | ✅ |
| 4 | Mamis Solidarias | 911340 | `12345718` | test@tripleimpacto.local | 1,661 | ✅ |
| 5 | Plato Lleno | 911322 | `12345700` | test@tripleimpacto.local | 1,661 | ✅ |
| 6 | Monte Adentro | 911321 | `12345699` | test@tripleimpacto.local | 1,661 | ✅ |
| 7 | **Fundación Padres** ⭐ | 911299 | `12345777` | test@tripleimpacto.local | 1,664 | ✅ |
| 8 | Proactiva | 911265 | `12345743` | test@tripleimpacto.local | 1,660 | ✅ |
| 9 | La Guarida | 911249 | `12345727` | test@tripleimpacto.local | 1,665 | ✅ |
| 10 | Techo | 911215 | `12345693` | test@tripleimpacto.local | 1,661 | ✅ |
| 11 | Regenerar Club | 911193 | `12345771` | test@tripleimpacto.local | 1,660 | ✅ |
| 12 | Loros Parlantes | 911192 | `12345770` | test@tripleimpacto.local | 1,660 | ✅ |

---

## 📊 Estadísticas Generales

- **Total usuarios creados:** 12
- **Total cupones disponibles:** ~19,929
- **Promedio de cupones por usuario:** 1,661
- **Rango de cupones:** 1,654 - 1,665
- **Tasa de éxito:** 100% (12/12)

---

## 🔍 Detalle por Usuario

### 1. Club de Impacto Proyectar
- **Código:** `12346000`
- **ID Bonda:** 20246486
- **Micrositio ID:** 911436
- **Cupones:** 1,654
- **Nota:** Usuario creado específicamente para este micrositio (segundo intento)

### 2. Biblioteca Rurales Argentinas
- **Código:** `12345684`
- **Micrositio ID:** 911406
- **Cupones:** 1,661

### 3. Haciendo Camino
- **Código:** `12345683`
- **Micrositio ID:** 911405
- **Cupones:** 1,661

### 4. Mamis Solidarias
- **Código:** `12345718`
- **Micrositio ID:** 911340
- **Cupones:** 1,661

### 5. Plato Lleno
- **Código:** `12345700`
- **Micrositio ID:** 911322
- **Cupones:** 1,661

### 6. Monte Adentro
- **Código:** `12345699`
- **Micrositio ID:** 911321
- **Cupones:** 1,661

### 7. Fundación Padres ⭐ (Principal)
- **Código:** `12345777`
- **Micrositio ID:** 911299
- **Cupones:** 1,664
- **Nota:** Micrositio principal del proyecto

### 8. Proactiva
- **Código:** `12345743`
- **Micrositio ID:** 911265
- **Cupones:** 1,660

### 9. La Guarida
- **Código:** `12345727`
- **Micrositio ID:** 911249
- **Cupones:** 1,665
- **Nota:** Mayor cantidad de cupones

### 10. Techo
- **Código:** `12345693`
- **Micrositio ID:** 911215
- **Cupones:** 1,661

### 11. Regenerar Club
- **Código:** `12345771`
- **Micrositio ID:** 911193
- **Cupones:** 1,660

### 12. Loros Parlantes
- **Código:** `12345770`
- **Micrositio ID:** 911192
- **Cupones:** 1,660

---

## 💾 Integración con Supabase

### Usuario de Prueba en Base de Datos

Los usuarios de prueba también están integrados en Supabase para testing completo:

**Email:** `test@tripleimpacto.local`  
**User ID:** Ver en Supabase tras ejecutar script  
**Vinculaciones:** 12 micrositios

### Ejecutar Script de Integración

```bash
# En Supabase SQL Editor
# Ejecutar: apps/backend/database/seed-usuarios-prueba-bonda.sql
```

**Resultado:**
- ✅ 1 usuario creado en tabla `usuarios`
- ✅ 12 vinculaciones en tabla `usuarios_bonda_afiliados`
- ✅ Acceso a ~19,929 cupones totales

Ver documentación completa: [README-USUARIOS-PRUEBA.md](./database/README-USUARIOS-PRUEBA.md)

---

## 🧪 Cómo Probar con estos Usuarios

### Login en la Aplicación

```bash
POST /api/auth/login
{
  "email": "test@tripleimpacto.local",
  "password": "test123"
}
```

### Consultar Cupones (API de Cupones)

```bash
curl -X GET "https://apiv1.cuponstar.com/api/cupones?key={API_KEY_CUPONES}&micrositio_id={MICROSITE_ID}&codigo_afiliado={CODIGO_AFILIADO}&subcategories=true"
```

**Ejemplo con Fundación Padres:**

```bash
curl -X GET "https://apiv1.cuponstar.com/api/cupones?key=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq&micrositio_id=911299&codigo_afiliado=12345777&subcategories=true"
```

### Verificar Usuario (API de Nóminas)

```bash
curl -X GET "https://apiv1.cuponstar.com/api/v2/microsite/{MICROSITE_ID}/affiliates/{CODIGO_AFILIADO}" \
  -H "token: {API_KEY_NOMINAS}"
```

**Ejemplo con Fundación Padres:**

```bash
curl -X GET "https://apiv1.cuponstar.com/api/v2/microsite/911299/affiliates/12345777" \
  -H "token: egNtOqB6R5fc5NdxmE45wWWNW0zp5TRNho6SjvcomgYhTGN75Er4CfCrVuOW9JzW"
```

---

## 📝 Scripts de Prueba Disponibles

### Probar todos los micrositios (Cupones)
```bash
cd apps/backend
npx ts-node scripts/probar-cupones-todos-micrositios.ts
```

### Probar todos los micrositios (Creación)
```bash
cd apps/backend
npx ts-node scripts/probar-creacion-todos-micrositios.ts
```

### Crear un usuario individual
```bash
cd apps/backend
npx ts-node scripts/crear-afiliado-simple.ts
```

---

## 🔑 API Keys

Las API Keys para cada micrositio están documentadas en:
- **Archivo:** `docs/BONDA-CREDENCIALES.md`
- **⚠️ CONFIDENCIAL** - No compartir públicamente

Cada micrositio tiene DOS API Keys:
- **API Key de Nóminas** → Para crear/gestionar usuarios
- **API Key de Cupones** → Para consultar cupones

---

## ⚠️ Notas Importantes

1. **Usuarios de prueba únicos:** Cada micrositio tiene su propio código de afiliado
2. **Email compartido:** La mayoría usa `test@tripleimpacto.local` (excepto Proyectar)
3. **DNI base:** Los códigos siguen el patrón `12345XXX` donde XXX se calcula del ID del micrositio
4. **Paginación:** La API devuelve 15 cupones por página, usa el campo `count` para el total
5. **Sincronización:** Usuarios recién creados pueden tardar algunos minutos en sincronizarse

---

## 📚 Ver También

- [BONDA-README.md](./docs/BONDA-README.md) - Índice principal de documentación Bonda
- [BONDA-CREDENCIALES.md](./docs/BONDA-CREDENCIALES.md) - API Keys de todos los micrositios
- [BONDA-USUARIOS-API.md](./docs/BONDA-USUARIOS-API.md) - Documentación API de Nóminas
- [BONDA-CUPONES-REFERENCIA.md](./docs/BONDA-CUPONES-REFERENCIA.md) - Documentación API de Cupones
- [RESULTADO-PRUEBA-CUPONES.md](./RESULTADO-PRUEBA-CUPONES.md) - Último reporte de pruebas

---

## 🎯 Próximos Pasos

Estos usuarios de prueba sirven para:

1. ✅ Verificar integración con APIs de Bonda
2. ✅ Probar consultas de cupones en desarrollo
3. ✅ Testing del dashboard de usuario
4. ⏳ Simular flujo completo de donación → usuario → cupones

**Para producción:** Los usuarios reales se crearán automáticamente después del pago con Fiserv.
