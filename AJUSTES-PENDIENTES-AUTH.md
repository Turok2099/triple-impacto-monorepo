# ⚠️ Ajustes Pendientes en el Módulo de Autenticación

## 🎯 Problema Identificado

Actualmente, el módulo de autenticación está creando afiliados en Bonda **inmediatamente en el registro**, pero según el flujo de negocio correcto, esto debería suceder **después del primer pago**.

## 🔧 Cambios Necesarios

### 1. Remover Sincronización del Registro

**Archivo**: `apps/backend/src/modules/auth/auth.service.ts`

**Cambio en el método `register`:**

```typescript
// ❌ CÓDIGO ACTUAL (Incorrecto)
async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
  // ... código de validación y creación de usuario ...
  
  // 5. Crear afiliado en Bonda (asíncrono, no bloquea el registro)
  this.sincronizarConBonda(usuario.id, bondaCode, registerDto).catch(
    (error) => {
      this.logger.error('Error en sincronización con Bonda:', error);
    },
  );
  
  // ... resto del código ...
}
```

```typescript
// ✅ CÓDIGO CORREGIDO
async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
  // ... código de validación y creación de usuario ...
  
  // NO sincronizar con Bonda aquí
  // La sincronización se hará después del primer pago
  
  this.logger.log(`✅ Usuario registrado (sin activar Bonda): ${email}`);
  
  // ... resto del código ...
}
```

### 2. Actualizar Estado Inicial del Usuario

**Archivo**: `apps/backend/src/modules/supabase/supabase.service.ts`

**Cambio en el método `createUser`:**

```typescript
// ❌ CÓDIGO ACTUAL
async createUser(userData: {...}) {
  const { data, error } = await this.from('usuarios')
    .insert({
      ...userData,
      bonda_sync_status: 'pending',
      // falta campo 'estado'
    })
    .select()
    .single();
  
  // ...
}
```

```typescript
// ✅ CÓDIGO CORREGIDO
async createUser(userData: {...}) {
  const { data, error } = await this.from('usuarios')
    .insert({
      ...userData,
      estado: 'registrado',           // ⬅️ Estado inicial
      bonda_sync_status: 'pending',   // Pendiente hasta el primer pago
    })
    .select()
    .single();
  
  this.logger.log(`✅ Usuario creado con estado 'registrado': ${data.email}`);
  return data;
}
```

### 3. Agregar Campo `estado` a la Tabla (Si no existe)

**Archivo**: `apps/backend/database/supabase-schema.sql`

Verificar que la tabla `usuarios` tenga:

```sql
CREATE TABLE usuarios (
  -- ... otros campos ...
  
  -- Estado del usuario
  estado VARCHAR(50) DEFAULT 'registrado',  -- registrado, activo, inactivo, eliminado
  
  -- ... otros campos ...
);
```

Si no existe, ejecutar en Supabase SQL Editor:

```sql
-- Agregar columna 'estado' si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'registrado';

-- Actualizar usuarios existentes
UPDATE usuarios 
SET estado = 'registrado' 
WHERE estado IS NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
```

### 4. Mantener el Método `sincronizarConBonda` (Para uso posterior)

**Archivo**: `apps/backend/src/modules/auth/auth.service.ts`

El método `sincronizarConBonda` NO debe eliminarse, solo **no debe llamarse desde `register`**.

Se usará después desde el módulo de donaciones:

```typescript
/**
 * Sincronizar usuario con Bonda
 * NOTA: Este método se llama desde el webhook de pago,
 * NO desde el registro
 */
private async sincronizarConBonda(
  usuarioId: string,
  bondaCode: string,
  data: RegisterDto,
): Promise<void> {
  // ... código existente permanece igual ...
}
```

**Hacer el método `public` para que pueda ser llamado desde otro módulo:**

```typescript
// Cambiar 'private' a 'public'
public async sincronizarConBonda(
  usuarioId: string,
  bondaCode: string,
  userData: {
    email: string;
    nombre: string;
    telefono?: string;
    provincia?: string;
    localidad?: string;
  },
): Promise<void> {
  // ... código existente ...
}
```

## 📋 Checklist de Ajustes

- [ ] Remover llamada a `sincronizarConBonda` del método `register`
- [ ] Actualizar `createUser` para incluir `estado: 'registrado'`
- [ ] Verificar que tabla `usuarios` tiene columna `estado`
- [ ] Si no existe, ejecutar ALTER TABLE en Supabase
- [ ] Cambiar `sincronizarConBonda` de `private` a `public`
- [ ] Actualizar tipo del parámetro `data` en `sincronizarConBonda`
- [ ] Probar registro de usuario (no debe crear en Bonda)
- [ ] Verificar en Supabase que `estado = 'registrado'`
- [ ] Documentar que Bonda se activará post-pago

## 🧪 Pruebas de Validación

### Test 1: Registro de Usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Prueba",
    "email": "prueba@example.com",
    "password": "password123",
    "telefono": "+54 9 11 1234-5678"
  }'
```

**Resultado esperado:**
- ✅ Usuario creado en Supabase
- ✅ `estado = 'registrado'`
- ✅ `bonda_sync_status = 'pending'`
- ✅ Token JWT retornado
- ❌ NO debe haber registro en `logs_sync_bonda` (aún no se sincroniza)

### Test 2: Verificar en Supabase

```sql
SELECT 
  id, 
  nombre, 
  email, 
  estado, 
  bonda_sync_status,
  bonda_affiliate_code,
  created_at
FROM usuarios
WHERE email = 'prueba@example.com';
```

**Resultado esperado:**
```
estado: 'registrado'
bonda_sync_status: 'pending'
bonda_affiliate_code: 'prueba_xy7k2p3' (generado)
```

### Test 3: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prueba@example.com",
    "password": "password123"
  }'
```

**Resultado esperado:**
- ✅ Login exitoso
- ✅ Token JWT retornado
- ✅ Usuario autenticado pero sin acceso a cupones Bonda

## 🎯 Resultado Final

Después de estos ajustes:

1. **Registro**: Usuario se crea localmente, sin tocar Bonda
2. **Estado**: `registrado` (sin acceso a cupones)
3. **Bonda**: Pendiente de activación
4. **Próximo paso**: Implementar módulo de donaciones (gateway de pago por definir)
5. **Activación**: Solo después del primer pago exitoso

## 📝 Notas Adicionales

- El código de afiliado (`bonda_affiliate_code`) se genera en el registro pero NO se usa hasta el primer pago
- Esto garantiza que el código esté disponible cuando sea necesario
- El usuario puede ver el catálogo general de cupones pero no obtener códigos
- La experiencia de usuario debe reflejar que la cuenta está "pendiente de activación"

---

**Próximo paso**: Después de hacer estos ajustes, crear el módulo de donaciones (gateway de pago por definir).
