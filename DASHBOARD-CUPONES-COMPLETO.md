# 🎟️ Dashboard de Cupones - Implementación Completa

## ✅ Resumen de lo Implementado

Se ha implementado un **sistema completo de dashboard de cupones** donde los usuarios pueden:

1. ✓ **Solicitar cupones manualmente** (hacer clic en "Solicitar")
2. ✓ **Ver códigos de cupones** directamente en pantalla (sin email/SMS)
3. ✓ **Ver cupones activos** con todos sus detalles
4. ✓ **Ver historial completo** de cupones solicitados
5. ✓ **Marcar cupones como usados**
6. ✓ **Ver estadísticas** (cupones activos, usados, total donado)

## 📁 Archivos Creados/Modificados

### Backend

#### Base de Datos
- `apps/backend/database/migrations/002-dashboard-cupones.sql` - Migración principal
- `apps/backend/database/migrations/README-DASHBOARD.md` - Guía de implementación

#### DTOs
- `apps/backend/src/modules/bonda/dto/solicitar-cupon.dto.ts` - DTO para solicitar cupón
- `apps/backend/src/modules/bonda/dto/cupon-solicitado.dto.ts` - DTO de respuesta
- `apps/backend/src/modules/bonda/dto/historial-cupones.dto.ts` - DTO de historial

#### Servicios
- `apps/backend/src/modules/supabase/supabase.service.ts` - **MODIFICADO** (agregados métodos de dashboard)
- `apps/backend/src/modules/bonda/bonda.service.ts` - **MODIFICADO** (agregado método solicitarCuponEspecifico)

#### Controladores
- `apps/backend/src/modules/bonda/bonda.controller.ts` - **MODIFICADO** (agregados 5 nuevos endpoints)

### Frontend

#### API Client
- `apps/frontend/lib/dashboard.ts` - Cliente completo con todas las funciones

#### Componentes
- `apps/frontend/components/dashboard/CuponCard.tsx` - Tarjeta de cupón con código visible
- `apps/frontend/components/dashboard/EstadisticasCard.tsx` - Estadísticas del usuario
- `apps/frontend/components/dashboard/CuponDisponibleCard.tsx` - Tarjeta de cupón para solicitar

#### Páginas
- `apps/frontend/app/dashboard/page.tsx` - Dashboard principal
- `apps/frontend/app/dashboard/mis-cupones/page.tsx` - Cupones activos
- `apps/frontend/app/dashboard/historial/page.tsx` - Historial completo
- `apps/frontend/app/dashboard/cupones-disponibles/page.tsx` - Catálogo de cupones

## 🚀 Pasos para Activar el Dashboard

### 1. Ejecutar la Migración de Base de Datos

```sql
-- Copiar y ejecutar en Supabase Dashboard → SQL Editor
-- Archivo: apps/backend/database/migrations/002-dashboard-cupones.sql
```

Esto creará:
- Tabla `usuario_cupones_solicitados`
- Vista `usuario_estadisticas_cupones`
- Funciones `marcar_cupon_como_usado` y `puede_solicitar_cupon`
- Políticas RLS para seguridad

### 2. Verificar la Migración

```sql
-- Verificar que todo se creó correctamente
SELECT * FROM usuario_cupones_solicitados LIMIT 1;
SELECT * FROM usuario_estadisticas_cupones LIMIT 1;
```

### 3. Preparar Usuario de Prueba

#### Opción A: Usuario Nuevo

```bash
# 1. Registrar usuario
POST http://localhost:3000/api/auth/register
{
  "nombre": "Usuario Test",
  "email": "test@tripleimpacto.com",
  "password": "test123456",
  "telefono": "+54 9 11 1234-5678"
}

# 2. Login para obtener token
POST http://localhost:3000/api/auth/login
{
  "email": "test@tripleimpacto.com",
  "password": "test123456"
}
```

#### Opción B: Usuario Existente

Si ya tienes un usuario, solo haz login.

### 4. Vincular Usuario con Bonda (SQL)

```sql
-- 1. Obtener ID del usuario
SELECT id, email FROM usuarios WHERE email = 'test@tripleimpacto.com';
-- Copiar el UUID del usuario

-- 2. Obtener ID del micrositio de Bonda
SELECT id, nombre, slug FROM bonda_microsites 
WHERE slug = 'beneficios-fundacion-padres';
-- Copiar el UUID del micrositio

-- 3. Crear vinculación usuario-afiliado
INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
VALUES (
  '<UUID_USUARIO>',  -- El UUID copiado en paso 1
  '<UUID_MICROSITIO>',  -- El UUID copiado en paso 2
  '22380612'  -- Código de afiliado de prueba
);
```

### 5. Crear Donación (opcional pero recomendado)

Para que el usuario tenga acceso completo a los códigos de cupones:

```sql
INSERT INTO donaciones (
  usuario_id,
  monto,
  moneda,
  estado,
  organizacion_nombre,
  completed_at
) VALUES (
  '<UUID_USUARIO>',
  1000.00,
  'ARS',
  'completada',
  'Fundación Padres',
  NOW()
);
```

### 6. Iniciar el Backend

```bash
cd apps/backend
npm run start:dev
```

### 7. Iniciar el Frontend

```bash
cd apps/frontend
npm run dev
```

### 8. Probar el Dashboard

1. Ir a `http://localhost:3001/login`
2. Iniciar sesión con las credenciales del usuario de prueba
3. Ir a `http://localhost:3001/dashboard`
4. Explorar las diferentes secciones:
   - Dashboard principal
   - Cupones disponibles
   - Mis cupones
   - Historial

## 🔌 Endpoints del Backend

### 1. Dashboard Completo
```http
GET /api/bonda/dashboard
Authorization: Bearer <token>

Respuesta:
{
  "usuario": { "id", "nombre", "email" },
  "estadisticas": {
    "cuponesActivos": 3,
    "cuponesUsados": 12,
    "totalCuponesSolicitados": 15,
    "totalDonado": 5000
  },
  "cuponesActivos": [...],
  "cuponesRecientes": [...]
}
```

### 2. Solicitar Cupón
```http
POST /api/bonda/solicitar-cupon
Authorization: Bearer <token>
Content-Type: application/json

{
  "bondaCuponId": "2048",
  "codigoAfiliado": "22380612",
  "micrositioSlug": "beneficios-fundacion-padres"
}

Respuesta:
{
  "id": "uuid",
  "nombre": "Cinemark 2x1",
  "codigo": "ABC123XYZ",  ⭐ CÓDIGO VISIBLE
  "estado": "activo",
  ...
}
```

### 3. Mis Cupones Activos
```http
GET /api/bonda/mis-cupones
Authorization: Bearer <token>

Respuesta: Array de cupones activos
```

### 4. Historial con Paginación
```http
GET /api/bonda/historial-cupones?pagina=1&limite=20&estado=todos
Authorization: Bearer <token>

Respuesta:
{
  "cupones": [...],
  "total": 25,
  "pagina": 1,
  "limite": 20,
  "totalPaginas": 2
}
```

### 5. Marcar como Usado
```http
PATCH /api/bonda/cupones/:id/usar
Authorization: Bearer <token>

Respuesta:
{
  "success": true,
  "message": "Cupón marcado como usado exitosamente"
}
```

## 📱 Flujo de Usuario Completo

### Paso 1: Login
```
Usuario → Login → Token JWT
```

### Paso 2: Ver Dashboard
```
Usuario → /dashboard → Ver estadísticas + cupones activos
```

### Paso 3: Explorar Catálogo
```
Usuario → /dashboard/cupones-disponibles
         → Ver todos los cupones de Bonda
```

### Paso 4: Solicitar Cupón
```
Usuario → Click "Solicitar Cupón"
         → Backend busca cupón en Bonda
         → Backend guarda en usuario_cupones_solicitados
         → Frontend muestra éxito
```

### Paso 5: Ver Código
```
Usuario → /dashboard/mis-cupones
         → Ver cupón con CÓDIGO VISIBLE
         → Copiar código al portapapeles
```

### Paso 6: Usar Cupón
```
Usuario → Usa el código en el comercio
         → Click "Marcar como usado"
         → Cupón cambia a estado "usado"
```

### Paso 7: Ver Historial
```
Usuario → /dashboard/historial
         → Ver todos los cupones (activos, usados, vencidos)
         → Filtrar por estado
         → Paginación
```

## ⚠️ Notas Importantes

### Cómo Funciona Bonda

**IMPORTANTE:** La API de Bonda funciona así:

1. El endpoint `/api/cupones_recibidos` devuelve cupones que el usuario **ya recibió** en Bonda
2. **No hay endpoint separado** para "solicitar" cupones individuales
3. Los códigos ya vienen incluidos en la respuesta si el cupón fue "recibido"

Por lo tanto, nuestro flujo:
```
Usuario solicita → Backend busca en "cupones recibidos" de Bonda
                → Si está, lo guarda en nuestra BD
                → Frontend muestra el código
```

Si un cupón NO está en "cupones recibidos", el usuario recibirá el error:
```
"Cupón no encontrado en tu lista de cupones recibidos de Bonda"
```

**Solución:** El usuario debe primero solicitar el cupón en el sitio oficial de Bonda.

### Sin Límites de Cupones

Configuración actual: **Opción D - Sin límites**
- Usuario puede solicitar ilimitados cupones
- Se trackea todo para analytics
- No hay restricciones por mes/categoría/monto

### Prevención de Duplicados

El sistema previene duplicados activos:
- Usuario NO puede solicitar el mismo cupón dos veces si ya tiene uno activo
- Puede solicitarlo de nuevo si el anterior está "usado" o "vencido"

### Seguridad

- ✅ JWT requerido en todos los endpoints
- ✅ RLS en Supabase - usuarios solo ven sus propios datos
- ✅ Verificación de propiedad antes de marcar como usado
- ✅ Códigos de afiliado vinculados en la BD (no en el frontend)

## 🎨 Características del UI

### Dashboard Principal
- Estadísticas en tarjetas coloridas
- Grid de cupones activos
- Tabla de cupones recientes
- Enlaces rápidos a secciones

### Cupones Activos
- Tarjetas con imagen, nombre, empresa
- **CÓDIGO DESTACADO** en un box especial
- Botón "Copiar código" con feedback visual
- Botón "Marcar como usado"
- Mensaje/instrucciones de uso
- Fechas: solicitado, usado, vencimiento

### Catálogo
- Grid responsive de cupones disponibles
- Imagen, nombre, descuento
- Botón "Solicitar Cupón"
- Feedback de éxito/error
- Banner informativo de cómo funciona

### Historial
- Tabla completa con paginación
- Filtros por estado (todos, activo, usado, vencido, cancelado)
- Visualización de códigos
- Navegación entre páginas

## 🧪 Testing

### Test 1: Solicitar Cupón

```bash
# Login
POST http://localhost:3000/api/auth/login
{
  "email": "test@tripleimpacto.com",
  "password": "test123456"
}
# Guardar el token

# Ver cupones disponibles
GET http://localhost:3000/api/bonda/cupones?microsite=beneficios-fundacion-padres
Authorization: Bearer <TOKEN>
# Copiar un bondaCuponId (ej: "2048")

# Solicitar ese cupón
POST http://localhost:3000/api/bonda/solicitar-cupon
Authorization: Bearer <TOKEN>
{
  "bondaCuponId": "2048",
  "codigoAfiliado": "22380612",
  "micrositioSlug": "beneficios-fundacion-padres"
}
# Verificar que devuelve el cupón con código
```

### Test 2: Ver Dashboard

```bash
GET http://localhost:3000/api/bonda/dashboard
Authorization: Bearer <TOKEN>
# Verificar estadísticas y cupones
```

### Test 3: Marcar como Usado

```bash
# Obtener mis cupones
GET http://localhost:3000/api/bonda/mis-cupones
Authorization: Bearer <TOKEN>
# Copiar el UUID de un cupón

# Marcarlo como usado
PATCH http://localhost:3000/api/bonda/cupones/<UUID>/usar
Authorization: Bearer <TOKEN>
# Verificar success: true
```

### Test 4: Historial

```bash
# Ver historial completo
GET http://localhost:3000/api/bonda/historial-cupones?pagina=1&limite=20&estado=todos
Authorization: Bearer <TOKEN>

# Ver solo usados
GET http://localhost:3000/api/bonda/historial-cupones?estado=usado
Authorization: Bearer <TOKEN>
```

## 📊 Base de Datos

### Tabla Principal: `usuario_cupones_solicitados`

Campos importantes:
- `usuario_id` - FK a usuarios
- `bonda_cupon_id` - ID del cupón en Bonda
- `nombre`, `descuento`, `empresa_nombre` - Info del cupón
- **`codigo`** - EL CÓDIGO DEL CUPÓN ⭐
- `codigo_id` - ID del código en Bonda
- `estado` - activo, usado, vencido, cancelado
- `codigo_afiliado` - Código usado para solicitar
- `micrositio_slug` - Micrositio de Bonda
- `mensaje` - Instrucciones de Bonda
- `bonda_raw_data` - JSON completo para debugging

### Vista: `usuario_estadisticas_cupones`

Agregaciones automáticas:
- Cupones activos por usuario
- Cupones usados por usuario
- Total de cupones solicitados
- Fecha del último cupón solicitado

## 🔮 Próximos Pasos (Opcional)

### Mejoras Futuras
1. **Notificaciones push** cuando un cupón esté por vencer
2. **Búsqueda y filtros** en el catálogo (por empresa, descuento, categoría)
3. **Favoritos** - guardar cupones para solicitar después
4. **Compartir cupón** - enviar código por email/WhatsApp
5. **Límites configurables** - restricciones por plan de donación
6. **Analytics detallado** - cupones más populares, tasas de uso
7. **Integración con calendar** - agregar fecha de vencimiento

### Optimizaciones
1. **Cache de cupones** disponibles (Redis)
2. **Infinite scroll** en vez de paginación
3. **PWA** - dashboard accesible sin conexión
4. **Dark mode** para el dashboard

## ✅ Checklist de Deployment

- [ ] Ejecutar migración SQL en Supabase producción
- [ ] Verificar que `bonda_microsites` tiene datos correctos
- [ ] Configurar variables de entorno en Railway/Vercel
- [ ] Probar endpoints en producción con Postman
- [ ] Crear usuario de prueba en producción
- [ ] Vincular usuario con Bonda en producción
- [ ] Verificar que el frontend muestra el dashboard
- [ ] Probar solicitar cupón end-to-end
- [ ] Verificar seguridad (RLS, JWT)
- [ ] Monitoring: configurar alertas de errores

## 📝 Comandos Útiles

```bash
# Backend - Desarrollo
cd apps/backend
npm run start:dev

# Frontend - Desarrollo
cd apps/frontend
npm run dev

# Backend - Build
npm run build

# Frontend - Build
npm run build

# Tests
npm run test

# Ver logs de Supabase
# → Ir a Supabase Dashboard → Logs
```

## 🆘 Troubleshooting

### "Cupón no encontrado en cupones recibidos"
- El usuario debe solicitar el cupón en Bonda primero
- Verificar que el `codigo_afiliado` es correcto
- Verificar que el `micrositio_slug` es correcto

### "Se requiere autenticación"
- Verificar que el token JWT es válido
- El token debe ir en header: `Authorization: Bearer <token>`

### "Complete una donación para acceder"
- El usuario no tiene vínculo en `usuarios_bonda_afiliados`
- Ejecutar el SQL de vinculación

### "Error al guardar cupón"
- Verificar que la migración se ejecutó correctamente
- Ver logs del backend
- Verificar RLS en Supabase

## 🎉 ¡Listo!

El dashboard está completamente implementado y listo para usar. 

**Código de Afiliado de Prueba:** `22380612`  
**Micrositio:** `beneficios-fundacion-padres`

Sigue los pasos de testing y deployment para ponerlo en producción. 🚀
