# Dashboard de Cupones - Guía de Implementación

## 📝 Descripción General

Este dashboard permite a los usuarios:
1. Ver cupones disponibles de Bonda
2. **Solicitar cupones manualmente** (hacer clic en "Solicitar")
3. Ver los **códigos de cupones** directamente en pantalla (sin esperar email/SMS)
4. Ver historial de cupones solicitados
5. Marcar cupones como usados
6. Ver estadísticas de cupones

## 🗄️ Migración de Base de Datos

### Paso 1: Ejecutar la Migración

Copiar y ejecutar el archivo `002-dashboard-cupones.sql` en Supabase Dashboard → SQL Editor

Esto creará:
- ✅ Tabla `usuario_cupones_solicitados` - Cupones solicitados por usuarios
- ✅ Vista `usuario_estadisticas_cupones` - Estadísticas agregadas
- ✅ Función `marcar_cupon_como_usado` - Marcar cupón como usado
- ✅ Función `puede_solicitar_cupon` - Verificar duplicados
- ✅ Políticas RLS para seguridad

### Paso 2: Verificar la Migración

```sql
-- Verificar que la tabla existe
SELECT * FROM usuario_cupones_solicitados LIMIT 1;

-- Verificar que la vista existe
SELECT * FROM usuario_estadisticas_cupones LIMIT 1;

-- Verificar que las funciones existen
SELECT proname FROM pg_proc WHERE proname IN ('marcar_cupon_como_usado', 'puede_solicitar_cupon');
```

## 🔌 Endpoints del Backend

### 1. Solicitar un Cupón
```http
POST /api/bonda/solicitar-cupon
Authorization: Bearer <token>

Body:
{
  "bondaCuponId": "2048",
  "codigoAfiliado": "22380612",
  "micrositioSlug": "beneficios-fundacion-padres",
  "celular": "+54 9 11 1234-5678" // Opcional
}

Response:
{
  "id": "uuid",
  "bondaCuponId": "2048",
  "nombre": "Cinemark 2x1",
  "descuento": "2x1",
  "empresaNombre": "Cinemark",
  "codigo": "ABC123XYZ", // ⭐ EL CÓDIGO VISIBLE
  "estado": "activo",
  "imagenPrincipal": "https://...",
  "createdAt": "2026-01-27T...",
  ...
}
```

### 2. Mis Cupones Activos
```http
GET /api/bonda/mis-cupones
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "nombre": "Cinemark 2x1",
    "codigo": "ABC123XYZ",
    "estado": "activo",
    ...
  }
]
```

### 3. Dashboard Completo
```http
GET /api/bonda/dashboard
Authorization: Bearer <token>

Response:
{
  "usuario": {
    "id": "uuid",
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  },
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

### 4. Historial de Cupones
```http
GET /api/bonda/historial-cupones?pagina=1&limite=20&estado=todos
Authorization: Bearer <token>

Response:
{
  "cupones": [...],
  "total": 25,
  "pagina": 1,
  "limite": 20,
  "totalPaginas": 2
}
```

### 5. Marcar Cupón como Usado
```http
PATCH /api/bonda/cupones/:id/usar
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Cupón marcado como usado exitosamente"
}
```

## 🧪 Testing con el Usuario de Prueba

### Código de Afiliado de Prueba
```
CODIGO_AFILIADO: 22380612
MICROSITIO: beneficios-fundacion-padres
```

### Flujo de Prueba Completo

1. **Registrar usuario** (si no existe):
```bash
POST http://localhost:3000/api/auth/register
{
  "nombre": "Usuario Test",
  "email": "test@example.com",
  "password": "test123",
  "telefono": "+54 9 11 1234-5678"
}
```

2. **Login**:
```bash
POST http://localhost:3000/api/auth/login
{
  "email": "test@example.com",
  "password": "test123"
}
```

3. **Crear afiliado Bonda para el usuario** (SQL directo en Supabase):
```sql
-- Primero, obtener el ID del usuario
SELECT id FROM usuarios WHERE email = 'test@example.com';

-- Luego, obtener el ID del micrositio
SELECT id FROM bonda_microsites WHERE slug = 'beneficios-fundacion-padres';

-- Finalmente, crear el afiliado
INSERT INTO usuarios_bonda_afiliados (user_id, bonda_microsite_id, affiliate_code)
VALUES (
  '<USER_ID>',
  '<MICROSITE_ID>',
  '22380612'
);
```

4. **Obtener cupones disponibles**:
```bash
GET http://localhost:3000/api/bonda/cupones?microsite=beneficios-fundacion-padres
Authorization: Bearer <token>
```

5. **Solicitar un cupón específico**:
```bash
POST http://localhost:3000/api/bonda/solicitar-cupon
Authorization: Bearer <token>
{
  "bondaCuponId": "2048",
  "codigoAfiliado": "22380612",
  "micrositioSlug": "beneficios-fundacion-padres"
}
```

6. **Ver mis cupones activos**:
```bash
GET http://localhost:3000/api/bonda/mis-cupones
Authorization: Bearer <token>
```

7. **Ver dashboard completo**:
```bash
GET http://localhost:3000/api/bonda/dashboard
Authorization: Bearer <token>
```

## ⚠️ Notas Importantes

### Cómo Funciona la Solicitud de Cupones

**IMPORTANTE:** La API de Bonda funciona de la siguiente manera:

1. El endpoint `/api/cupones_recibidos` devuelve cupones que el usuario **ya recibió/solicitó** en Bonda
2. **No hay un endpoint separado** para "solicitar" un cupón individual
3. Bonda envía los códigos automáticamente por email/SMS cuando el usuario los solicita **en su sitio**

Por lo tanto, nuestro flujo es:
```
Usuario ve catálogo → Usuario hace clic en "Solicitar" 
→ Backend busca el cupón en los "cupones recibidos" de Bonda
→ Backend guarda el cupón en nuestra BD
→ Frontend muestra el CÓDIGO en pantalla
```

### ¿Qué pasa si el cupón no está "recibido"?

Si el usuario intenta solicitar un cupón que aún no está en su lista de "cupones recibidos" en Bonda, el sistema retornará un error:

```json
{
  "message": "Cupón no encontrado en tu lista de cupones recibidos de Bonda"
}
```

**Solución:** El usuario debe primero solicitar el cupón en el sitio de Bonda, o implementar integración con el endpoint de Bonda que permite "reclamar" cupones (si existe).

### Sin Límites de Cupones

Configuración actual: **Sin límites (opción D)**
- Usuario puede solicitar todos los cupones que quiera
- Se trackea para analytics
- No hay restricciones por mes/categoría

Para agregar límites en el futuro, modificar la función `puede_solicitar_cupon` en la migración SQL.

### Duplicados

El sistema previene duplicados activos:
- Un usuario NO puede solicitar el mismo cupón dos veces si ya tiene uno activo
- Puede solicitar el mismo cupón nuevamente si el anterior está "usado" o "vencido"

## 🎨 Frontend

Ver:
- `apps/frontend/app/dashboard/` - Páginas del dashboard
- `apps/frontend/components/dashboard/` - Componentes del dashboard
- `apps/frontend/lib/dashboard.ts` - API client

## 📊 Estadísticas

El dashboard muestra:
- Cupones activos (disponibles para usar)
- Cupones usados (ya utilizados)
- Total de cupones solicitados
- Total donado por el usuario
- Último cupón solicitado

Estas estadísticas se calculan automáticamente a través de la vista `usuario_estadisticas_cupones`.

## 🔒 Seguridad

- ✅ Todos los endpoints requieren autenticación (JWT)
- ✅ RLS en Supabase - usuarios solo ven sus propios cupones
- ✅ Verificación de propiedad antes de marcar como usado
- ✅ Validación de duplicados activos
- ✅ Códigos de afiliado vinculados al usuario en la BD
