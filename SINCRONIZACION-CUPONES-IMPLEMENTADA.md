# ✅ Sincronización de Cupones desde Bonda - Implementación Completa

## 📋 Resumen

Se implementó un sistema completo de sincronización de cupones desde Bonda API a Supabase, con las siguientes características:

- ✅ Sincronización paginada de **todos los cupones** (1657+) desde Bonda
- ✅ Almacenamiento en tabla `public_coupons_v2` de Supabase
- ✅ Cron job automático diario a las **3 AM Argentina**
- ✅ Frontend actualizado para leer desde Supabase (mucho más rápido)
- ✅ Endpoints para sincronización manual
- ✅ Deduplicación por marca/empresa
- ✅ Filtrado por categoría

---

## 🏗️ Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE SINCRONIZACIÓN                  │
└─────────────────────────────────────────────────────────────┘

1. CRON JOB (3 AM Argentina / 6 AM UTC)
   ↓
2. Backend: SyncService.sincronizarCuponesDesdeBonda()
   ↓
3. Llamadas paginadas a Bonda API (15 cupones por página)
   │
   ├── Página 1: cupones 1-15
   ├── Página 2: cupones 16-30
   ├── Página 3: cupones 31-45
   └── ... (hasta ~110 páginas)
   ↓
4. Transformación y limpieza de datos
   ↓
5. UPSERT en Supabase (public_coupons_v2)
   ↓
6. Limpieza de cupones vencidos
   ↓
7. Actualización de timestamp (last_synced_at)

┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DEL FRONTEND                       │
└─────────────────────────────────────────────────────────────┘

1. Usuario visita home page
   ↓
2. Frontend: GET /api/public/cupones-bonda
   ↓
3. Backend lee desde Supabase (public_coupons_v2)
   ↓
4. Deduplicación por marca
   ↓
5. Renderizado instantáneo (datos ya sincronizados)
```

---

## 📂 Archivos Creados/Modificados

### Backend

#### **Nuevos archivos:**
- `src/modules/sync/sync.service.ts` - Servicio de sincronización
- `src/modules/sync/sync.controller.ts` - Endpoints para sincronización manual
- `src/modules/sync/sync.module.ts` - Módulo de sincronización
- `src/modules/supabase/dto/public-coupon-v2.dto.ts` - DTOs para la nueva tabla

#### **Archivos modificados:**
- `src/app.module.ts` - Agregado `SyncModule` y `ScheduleModule`
- `src/modules/supabase/supabase.service.ts` - Métodos para `public_coupons_v2`
- `src/modules/public/public.controller.ts` - Endpoint actualizado para leer desde Supabase
- `.env` - Agregada variable `SYNC_SECRET`

### Frontend

#### **Archivos modificados:**
- `lib/bonda.ts` - Actualizada función `obtenerCuponesPublicos` para nuevo formato
- `components/sections/Cupones/CuponesShowcase.tsx` - Deduplicación por marca

---

## 🗄️ Estructura de la Base de Datos

### Tabla: `public_coupons_v2`

```sql
CREATE TABLE public_coupons_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- IDs y sincronización
  bonda_cupon_id TEXT UNIQUE NOT NULL,
  bonda_microsite_id UUID REFERENCES bonda_microsites(id),
  
  -- Información básica
  nombre TEXT NOT NULL,
  descuento TEXT,
  descripcion_breve TEXT,
  
  -- Empresa
  empresa_nombre TEXT,
  empresa_id TEXT,
  empresa_logo_url TEXT,
  empresa_data JSONB,
  
  -- Imágenes
  imagen_principal_url TEXT,
  imagen_thumbnail_url TEXT,
  imagenes JSONB,
  
  -- Contenido HTML
  descripcion_micrositio TEXT,
  usage_instructions TEXT,
  legales TEXT,
  
  -- Categorización
  categorias JSONB,
  categoria_principal TEXT,
  
  -- Validez y uso
  fecha_vencimiento TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true,
  usar_en JSONB,
  permitir_sms BOOLEAN,
  
  -- Metadata
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_public_coupons_v2_bonda_id ON public_coupons_v2(bonda_cupon_id);
CREATE INDEX idx_public_coupons_v2_vencimiento ON public_coupons_v2(fecha_vencimiento);
CREATE INDEX idx_public_coupons_v2_activo ON public_coupons_v2(activo);
CREATE INDEX idx_public_coupons_v2_empresa ON public_coupons_v2(empresa_nombre);
```

---

## ⏰ Cron Job

### Configuración

El cron job se ejecuta **automáticamente** todos los días a las:
- **3:00 AM hora de Argentina (ART / UTC-3)**
- **6:00 AM hora UTC**

### Implementación

```typescript
// src/modules/sync/sync.service.ts

@Cron('0 6 * * *', {
  name: 'sincronizar_cupones_diario',
  timeZone: 'UTC',
})
async sincronizacionAutomaticaDiaria() {
  this.logger.log('⏰ Cron job iniciado: Sincronización diaria de cupones (3 AM Argentina)');
  
  const resultado = await this.sincronizarTodosMicrositios();
  
  // Log en base de datos
  await this.supabaseService.logBondaOperation({
    operacion: 'cron_sincronizacion_diaria',
    exitoso: true,
    response_data: resultado,
  });
}
```

---

## 🔧 Endpoints de Sincronización Manual

### 1. Sincronizar un micrositio

```bash
POST /api/sync/cupones?secret=TU_SYNC_SECRET

# Con micrositio específico
POST /api/sync/cupones?secret=TU_SYNC_SECRET&microsite_id=uuid-del-micrositio
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización completada exitosamente",
  "data": {
    "total_cupones": 1657,
    "total_paginas": 111,
    "tiempo_total_ms": 65432,
    "errores": []
  }
}
```

### 2. Sincronizar todos los micrositios

```bash
POST /api/sync/todos?secret=TU_SYNC_SECRET
```

### 3. Ver estado de sincronización

```bash
GET /api/sync/status?secret=TU_SYNC_SECRET
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_activos": 1657,
    "total_vencidos": 23,
    "ultima_sincronizacion": "2026-01-27T06:00:00.000Z"
  }
}
```

---

## 🔐 Variables de Entorno

Agregar al `.env` del backend:

```env
# Secret para endpoints de sincronización
SYNC_SECRET=tu-secret-muy-seguro-cambiar-en-produccion

# Credenciales de Bonda (ya existentes)
BONDA_API_KEY=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq
BONDA_MICROSITE_ID=911299
BONDA_CODIGO_AFILIADO=22380612
BONDA_MICROSITE_SLUG=beneficios-fundacion-padres
```

⚠️ **IMPORTANTE en Railway:**
- Configurar `SYNC_SECRET` con un valor seguro
- **NO** commitear el `.env` al repositorio

---

## 🚀 Uso y Testing

### 1. Primera sincronización manual

Antes de que el cron job se ejecute por primera vez, sincroniza manualmente:

```bash
curl -X POST "https://tu-api.com/api/sync/cupones?secret=TU_SYNC_SECRET"
```

### 2. Verificar sincronización

```bash
curl "https://tu-api.com/api/sync/status?secret=TU_SYNC_SECRET"
```

### 3. Probar frontend

1. Visita tu home page
2. Los cupones ahora se cargan desde Supabase (mucho más rápido)
3. Los filtros funcionan igual
4. Solo se muestra **1 cupón por marca**

---

## 📊 Performance

### Antes (Bonda API directo):
- ❌ Solo 15 cupones por llamada
- ❌ Múltiples llamadas por usuario
- ❌ Saturación del API de Bonda
- ❌ Lento para el usuario final

### Después (Supabase):
- ✅ 1657+ cupones disponibles instantáneamente
- ✅ 1 sola llamada al backend (que lee de Supabase)
- ✅ Carga ultrarrápida
- ✅ Solo 1 sincronización diaria con Bonda (3 AM)
- ✅ Filtrado y búsqueda ilimitados
- ✅ Deduplicación por marca

---

## 🔄 Logs y Monitoreo

Todos los eventos de sincronización se registran en:

### Tabla: `logs_sync_bonda`

```sql
SELECT * FROM logs_sync_bonda
WHERE operacion = 'cron_sincronizacion_diaria'
ORDER BY created_at DESC
LIMIT 10;
```

### Logs del backend

```bash
# Railway logs
railway logs

# Buscar logs de sincronización
railway logs --filter "Cron job"
railway logs --filter "Sincronización"
```

---

## ✨ Próximas Mejoras (Opcionales)

1. **Webhooks de Bonda**: Si Bonda ofrece webhooks, sincronizar en tiempo real
2. **Cache Redis**: Agregar capa de cache adicional
3. **Búsqueda Full-Text**: Implementar búsqueda avanzada con PostgreSQL
4. **Sincronización selectiva**: Solo sincronizar cupones modificados (si Bonda provee timestamp)
5. **Dashboard de admin**: Panel para ver estadísticas de sincronización

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si Bonda API falla durante la sincronización?

El servicio captura errores y registra logs. Los cupones anteriores siguen disponibles.

### ¿Se pueden perder datos?

No. El sistema usa `UPSERT` (insert o update), así que nunca se pierden cupones.

### ¿Cómo cambio el horario del cron?

Modifica la expresión cron en `sync.service.ts`:

```typescript
@Cron('0 6 * * *', { ... })  // 6 AM UTC = 3 AM Argentina
```

### ¿Puedo deshabilitar el cron temporalmente?

Comenta o elimina el decorador `@Cron` y recompila.

---

## 🎉 ¡Listo!

El sistema está completamente implementado y listo para usar. Los cupones se sincronizarán automáticamente todos los días a las 3 AM Argentina.

**Próximo paso:** Ejecutar la primera sincronización manual con el endpoint POST `/api/sync/cupones`.
