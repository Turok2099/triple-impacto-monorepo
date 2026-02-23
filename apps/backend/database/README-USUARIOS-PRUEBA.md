# 👥 Usuarios de Prueba Bonda en Supabase

Este documento explica cómo insertar y usar los usuarios de prueba de Bonda en la base de datos de Supabase.

---

## 📋 ¿Qué Contiene Este Script?

El script `seed-usuarios-prueba-bonda.sql` crea:

### 1 Usuario de Prueba Principal

- **Email:** `test@tripleimpacto.local`
- **Nombre:** Usuario Prueba Bonda
- **Teléfono:** +54 9 11 1234-5678
- **Estado:** Activo y verificado

### 12 Vinculaciones con Micrositios Bonda

| Micrositio | Código Afiliado | Cupones Disponibles |
|------------|----------------:|--------------------:|
| Club de Impacto Proyectar | 12346000 | 1,654 |
| Biblioteca Rurales Argentinas | 12345684 | 1,661 |
| Haciendo Camino | 12345683 | 1,661 |
| Mamis Solidarias | 12345718 | 1,661 |
| Plato Lleno | 12345700 | 1,661 |
| Monte Adentro | 12345699 | 1,661 |
| **Fundación Padres** | **12345777** | **1,664** |
| Proactiva | 12345743 | 1,660 |
| La Guarida | 12345727 | 1,665 |
| Techo | 12345693 | 1,661 |
| Regenerar Club | 12345771 | 1,660 |
| Loros Parlantes | 12345770 | 1,660 |

**Total:** ~19,929 cupones disponibles

---

## 🚀 Cómo Ejecutar el Script

### Paso 1: Verificar Prerequisitos

Asegúrate de que ya ejecutaste:
1. ✅ `supabase-schema.sql` - Tablas creadas
2. ✅ `seed-bonda-microsites.sql` - Micrositios cargados

### Paso 2: Ejecutar en Supabase

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega todo el contenido de `seed-usuarios-prueba-bonda.sql`
4. Haz clic en **Run**

### Paso 3: Verificar Resultado

El script mostrará:

```
NOTICE: Usuario de prueba creado exitosamente: [UUID]
NOTICE: Total de vinculaciones creadas: 12 micrositios
```

Y dos tablas de verificación:
- Resumen del usuario
- Detalle de todas las vinculaciones

---

## 🔐 Credenciales de Prueba

### Para Login en Frontend

**Email:** `test@tripleimpacto.local`  
**Password:** (ver backend - hash en BD)

**Nota:** El script inserta un hash de prueba. Para producción, genera un hash real con bcrypt.

### Generar Password Hash Real

```typescript
import * as bcrypt from 'bcrypt';

const password = 'test123';
const hash = await bcrypt.hash(password, 10);
console.log(hash); // Reemplazar en el script SQL
```

---

## 🧪 Casos de Uso

### 1. Testing de Dashboard

El usuario puede:
- ✅ Ver cupones de 12 micrositios diferentes
- ✅ Solicitar cupones y obtener códigos
- ✅ Ver estadísticas de cupones por micrositio
- ✅ Probar filtros y búsquedas

### 2. Testing de APIs

```bash
# Login
POST /api/auth/login
{
  "email": "test@tripleimpacto.local",
  "password": "test123"
}

# Obtener cupones (cualquier micrositio)
GET /api/bonda/cupones?microsite=beneficios-fundacion-padres
Authorization: Bearer <token>

# Solicitar cupón
POST /api/bonda/solicitar-cupon
Authorization: Bearer <token>
{
  "bondaCuponId": "14830",
  "codigoAfiliado": "12345777",
  "micrositioSlug": "beneficios-fundacion-padres"
}
```

### 3. Testing Multi-ONG

Como el usuario está vinculado con 12 micrositios:

```bash
# Ver cupones de diferentes ONGs
GET /api/bonda/cupones?microsite=beneficios-fundacion-padres
GET /api/bonda/cupones?microsite=club-impacto-proyectar
GET /api/bonda/cupones?microsite=comunidad-techo
```

---

## 🔍 Queries Útiles

### Ver usuario y sus vinculaciones

```sql
SELECT 
  u.nombre,
  u.email,
  u.estado,
  COUNT(uba.id) as micrositios_vinculados
FROM usuarios u
LEFT JOIN usuarios_bonda_afiliados uba ON u.id = uba.user_id
WHERE u.email = 'test@tripleimpacto.local'
GROUP BY u.id, u.nombre, u.email, u.estado;
```

### Ver detalle de afiliaciones

```sql
SELECT 
  bm.nombre as micrositio,
  uba.affiliate_code,
  uba.created_at
FROM usuarios u
INNER JOIN usuarios_bonda_afiliados uba ON u.id = uba.user_id
INNER JOIN bonda_microsites bm ON uba.bonda_microsite_id = bm.id
WHERE u.email = 'test@tripleimpacto.local'
ORDER BY bm.nombre;
```

### Eliminar usuario de prueba (si necesitas resetear)

```sql
-- Esto eliminará el usuario y todas sus vinculaciones (CASCADE)
DELETE FROM usuarios WHERE email = 'test@tripleimpacto.local';
```

---

## ⚠️ Notas Importantes

### Password Hash

El hash incluido (`$2b$10$TEST.HASH.PLACEHOLDER`) es un placeholder. Para testing real:

1. Genera un hash válido con bcrypt
2. Reemplaza la línea en el script:
   ```sql
   password_hash = '$2b$10$TU_HASH_REAL_AQUI'
   ```

### Códigos de Afiliado

Los códigos de afiliado en el script son los MISMOS que se crearon en Bonda:
- ✅ Ya existen en Bonda
- ✅ Ya tienen cupones disponibles
- ✅ Listos para usar inmediatamente

### Conflictos

El script usa `ON CONFLICT DO UPDATE` para:
- Actualizar usuario existente si el email ya existe
- Actualizar vinculaciones si ya existen

Esto permite ejecutar el script múltiples veces sin errores.

---

## 📚 Documentos Relacionados

- [USUARIOS-PRUEBA-BONDA.md](../USUARIOS-PRUEBA-BONDA.md) - Listado completo de usuarios
- [INTEGRACION-SOLICITUD-CUPONES.md](../INTEGRACION-SOLICITUD-CUPONES.md) - Cómo usar la API
- [supabase-schema.sql](./supabase-schema.sql) - Esquema de la base de datos
- [seed-bonda-microsites.sql](./seed-bonda-microsites.sql) - Seed de micrositios

---

## ✅ Checklist de Setup

Antes de probar con este usuario:

- [ ] Base de datos creada (`supabase-schema.sql`)
- [ ] Micrositios cargados (`seed-bonda-microsites.sql`)
- [ ] Usuario de prueba insertado (`seed-usuarios-prueba-bonda.sql`)
- [ ] Password hash actualizado (opcional para testing)
- [ ] Backend corriendo y conectado a Supabase
- [ ] Variables de entorno configuradas

---

## 🎯 Resultado Esperado

Después de ejecutar el script, deberías tener:

✅ 1 usuario en tabla `usuarios`  
✅ 12 vinculaciones en tabla `usuarios_bonda_afiliados`  
✅ Acceso a ~19,929 cupones totales  
✅ Usuario listo para testing completo de la aplicación

**El usuario de prueba está completamente funcional y listo para usar.** 🎉
