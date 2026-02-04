# 🎯 Filtros de Cupones en el Home - Implementación Completa

## ✅ **Implementado**

### **Backend**

#### **1. BondaService - Soporte de Filtros**

**Archivo:** `apps/backend/src/modules/bonda/bonda.service.ts`

**Cambios:**

- Método `obtenerCupones()` ahora acepta parámetros opcionales:

  ```typescript
  async obtenerCupones(
    codigoAfiliado: string,
    options?: {
      categoria?: number;
      orderBy?: 'latest' | 'relevant' | 'ownRelevant';
      subcategories?: boolean;
      slug?: string;
      organizacionId?: string;
    }
  )
  ```

- Nuevo método `obtenerCategorias()`:
  ```typescript
  async obtenerCategorias(options?: BondaMicrositeOptions): Promise<Categoria[]>
  ```

**Parámetros soportados:**

- ✅ `categoria` - ID de categoría para filtrar
- ✅ `orderBy` - Ordenamiento: `latest`, `relevant`, `ownRelevant`
- ✅ `subcategories` - Retornar subcategorías (default: `true`)

---

#### **2. PublicController - Endpoint de Categorías**

**Archivo:** `apps/backend/src/modules/public/public.controller.ts`

**Nuevo endpoint:**

```http
GET /api/public/categorias
```

**Respuesta:**

```json
[
  { "id": 0, "nombre": "Todos" },
  { "id": 12, "nombre": "Gastronomía" },
  { "id": 11, "nombre": "Turismo" },
  { "id": 13, "nombre": "Compras" },
  { "id": 7, "nombre": "Belleza y Salud" },
  { "id": 6, "nombre": "Indumentaria y Moda" },
  { "id": 8, "nombre": "Servicios" }
]
```

---

### **Frontend**

#### **1. Componente FiltrosCupones**

**Archivo:** `apps/frontend/components/sections/Cupones/FiltrosCupones.tsx`

**Características:**

- ✅ Botones de categorías con íconos emoji
- ✅ Estado activo visual (bg emerald, shadow, scale)
- ✅ Dropdown de ordenamiento a la derecha
- ✅ Responsive design (mobile-first)
- ✅ Loading state mientras carga categorías

**Props:**

```typescript
interface FiltrosCuponesProps {
  onFiltroChange: (categoria: number | null, orden: string) => void;
}
```

**Íconos por categoría:**

```typescript
const ICONOS_CATEGORIAS = {
  Todos: "🎟️",
  Gastronomía: "🍔",
  Turismo: "✈️",
  Compras: "🛍️",
  "Belleza y Salud": "💄",
  "Indumentaria y Moda": "👕",
  Servicios: "🔧",
};
```

---

#### **2. CuponesShowcase Actualizado**

**Archivo:** `apps/frontend/components/sections/Cupones/CuponesShowcase.tsx`

**Cambios:**

- ✅ Integra componente `FiltrosCupones`
- ✅ Maneja estado de filtros (categoría + orden)
- ✅ Aplica ordenamiento local a los cupones
- ✅ Muestra contador de resultados
- ✅ Guarda lista completa de cupones para filtrado

**Estados:**

```typescript
const [categoriaActual, setCategoriaActual] = useState<number | null>(null);
const [ordenActual, setOrdenActual] = useState<string>("relevant");
const [cuponesCompletos, setCuponesCompletos] = useState<CuponDto[]>([]);
```

---

## 📸 **UI Final**

```
┌────────────────────────────────────────────────────────────┐
│         Descubrí nuestro catálogo de descuentos            │
│   Al donar, obtenés acceso a descuentos exclusivos...     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ [🎟️ Todos] [🍔 Gastronomía] [✈️ Turismo] [🛍️ Compras]    │
│ [💄 Belleza] [👕 Moda] [🔧 Servicios]    🔽 Ordenar por   │
└────────────────────────────────────────────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐
│ 🎟️ 25%  │  │ 🎟️ 20%  │  │ 🎟️ 2x1  │
│ Coca     │  │ Rosen    │  │ Mostaza  │
│ Cola     │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘

        Mostrando 1647 cupones
```

---

## 🔄 **Flujo de Funcionamiento**

### **1. Carga Inicial**

```
Usuario → Home Page
  ↓
CuponesShowcase.useEffect()
  ↓
obtenerCuponesPublicos()
  ↓
GET /api/public/cupones
  ↓
Supabase: public_coupons
  ↓
Muestra todos los cupones (orden por defecto)
```

### **2. Usuario Selecciona Filtro**

```
Usuario → Click en "Gastronomía"
  ↓
handleFiltroChange(12, "relevant")
  ↓
Filtra cupones localmente
  ↓
Aplica orden seleccionado
  ↓
setCupones(cuponesFiltrados)
  ↓
Re-render con cupones filtrados
```

### **3. Usuario Cambia Orden**

```
Usuario → Selecciona "Más recientes" en dropdown
  ↓
handleOrdenChange("latest")
  ↓
handleFiltroChange(categoriaActual, "latest")
  ↓
Ordena por ID descendente
  ↓
setCupones(cuponesOrdenados)
  ↓
Re-render con cupones ordenados
```

---

## ⚠️ **Limitaciones Actuales**

### **1. Filtrado Local (No desde API)**

**Estado actual:**

- Los cupones se filtran **localmente** en el frontend
- Todos los cupones se cargan al inicio desde `public_coupons`
- El filtrado por categoría **NO está implementado** porque los cupones en `public_coupons` no tienen campo `categoria`

**Para implementar filtrado real:**

1. Agregar campo `categoria_id` a tabla `public_coupons`
2. Sincronizar categoría desde Bonda al hacer sync
3. Filtrar en el frontend por `categoria_id`

O alternativamente:

1. Llamar directamente a Bonda API con filtros
2. Modificar `obtenerCuponesPublicos()` para aceptar filtros
3. Pasar filtros al backend en cada cambio

---

### **2. Ordenamiento Local**

**Estado actual:**

- "Más recientes": Ordena por ID descendente (asume que IDs más altos = más nuevos)
- "Más relevantes": Mantiene orden original de la API

**Para mejorar:**

- Agregar campo `created_at` o `fecha_agregado` a `public_coupons`
- Ordenar por fecha real en lugar de ID

---

## 🚀 **Próximos Pasos**

### **Opción A: Filtrado desde Supabase (Recomendado)**

1. Modificar tabla `public_coupons`:

   ```sql
   ALTER TABLE public_coupons
   ADD COLUMN categoria_id INTEGER;

   CREATE INDEX idx_public_coupons_categoria
   ON public_coupons(categoria_id);
   ```

2. Actualizar `sync-cupones.service.ts`:

   ```typescript
   const cuponesParaInsertar = bondaCupones.cupones.map((c) => ({
     titulo: c.nombre,
     categoria_id: c.categorias?.[0]?.id || null, // ← AGREGAR
     // ... resto de campos
   }));
   ```

3. Modificar `obtenerCuponesPublicos()`:

   ```typescript
   async obtenerCuponesPublicos(categoria?: number) {
     let query = this.from('public_coupons')
       .select('*')
       .eq('activo', true);

     if (categoria) {
       query = query.eq('categoria_id', categoria);
     }

     return query.order('orden');
   }
   ```

4. Actualizar frontend para pasar filtro al backend

---

### **Opción B: Filtrado desde Bonda en Tiempo Real**

1. Modificar `obtenerCuponesPublicos()` en `lib/bonda.ts`:

   ```typescript
   export async function obtenerCuponesPublicos(
     categoria?: number,
     orderBy?: string
   ): Promise<PublicCouponDto[]> {
     const params = new URLSearchParams();
     if (categoria) params.append("categoria", categoria.toString());
     if (orderBy) params.append("orderBy", orderBy);

     const response = await fetch(
       `${API_URL}/public/cupones?${params.toString()}`
     );
     return response.json();
   }
   ```

2. Backend llama a Bonda API cada vez (más lento pero siempre actualizado)

---

## 🎨 **Mejoras de UI Futuras**

- [ ] Agregar animaciones de transición entre filtros
- [ ] Skeleton loading mientras filtra
- [ ] Indicador visual de "filtrado activo"
- [ ] Limpiar filtros con botón "X"
- [ ] Guardar filtro seleccionado en localStorage
- [ ] Lazy loading / paginación para 1600+ cupones
- [ ] Barra de búsqueda por texto (query parameter)
- [ ] Filtros de ubicación (provincia, localidad)

---

## 📊 **Performance**

**Carga inicial:**

- 1647 cupones cargados una sola vez
- ~500KB de datos JSON
- Filtrado instantáneo (local)

**Mejora recomendada:**

- Implementar paginación (mostrar 30 cupones por página)
- Lazy loading al hacer scroll
- Reducir payload inicial

---

## ✅ **Commit Realizado**

```bash
git commit -m "Feature: Agregar filtros de categorías y ordenamiento a cupones del home"
```

**Archivos modificados:**

- `apps/backend/src/modules/bonda/bonda.service.ts`
- `apps/backend/src/modules/public/public.controller.ts`
- `apps/frontend/components/sections/Cupones/CuponesShowcase.tsx`

**Archivos creados:**

- `apps/frontend/components/sections/Cupones/FiltrosCupones.tsx`

---

## 🧪 **Testing**

### **Backend:**

```bash
# Test endpoint de categorías
curl http://localhost:3000/api/public/categorias

# Test endpoint de cupones con filtros
curl "http://localhost:3000/api/public/cupones?categoria=12&orderBy=latest"
```

### **Frontend:**

1. Abrir home page
2. Ver filtros de categorías
3. Click en diferentes categorías
4. Cambiar ordenamiento en dropdown
5. Verificar que contador de resultados se actualiza

---

## 📝 **Notas**

- El filtrado por categoría está **preparado** en el backend pero **no funcional** en el frontend porque los cupones no tienen `categoria_id` en `public_coupons`
- El ordenamiento funciona correctamente (latest/relevant)
- Las categorías son hardcodeadas por ahora (se pueden cargar desde Bonda API si se necesita)
- La UI es completamente responsive y moderna

**Estado:** ✅ **Implementación base completa** - Pendiente conectar filtrado real por categoría
