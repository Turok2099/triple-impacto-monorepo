# Scripts de Análisis Bonda

Scripts utilitarios para análisis de datos de cupones Bonda.

---

## 📊 analizar-cupones-bonda.ts

Script para extraer y analizar TODAS las marcas/empresas que participan en TODOS los micrositios de Bonda.

### Uso:

```bash
cd apps/backend
npm run analizar-bonda
```

### ¿Qué hace?

1. Conecta a Supabase y obtiene todos los micrositios activos
2. Por cada micrositio, llama a la API de Bonda con el código demo (22380612)
3. Extrae las marcas/empresas y sus descuentos
4. Genera dos archivos de salida:
   - **CSV**: Lista de marcas con estadísticas
   - **JSON**: Análisis completo con todos los detalles

### Archivos de salida:

```
scripts/output/
├── marcas-bonda-2026-01-31.csv        # CSV con marcas y estadísticas
└── analisis-completo-2026-01-31.json  # JSON con datos completos
```

### Ejemplo de salida CSV:

```csv
Empresa,Apariciones,Micrositios,Descuento_Promedio,Descuentos_Unicos
"Mostaza",3,"Beneficios Fundación Padres","33.3%","40% | 20%"
"Plataforma 10",2,"Beneficios Fundación Padres","50.0%","50%"
"Dash",1,"Beneficios Fundación Padres","20.0%","20%"
```

### Campos del CSV:

- **Empresa:** Nombre de la marca/empresa
- **Apariciones:** Cantidad de cupones de esa marca
- **Micrositios:** En qué micrositios aparece
- **Descuento_Promedio:** Promedio de descuentos (solo % numéricos)
- **Descuentos_Unicos:** Lista de todos los descuentos únicos

### Ejemplo de salida en consola:

```
📋 Top 10 Marcas:

   1. Mostaza                   - 3 cupones, 1 micrositios, promedio: 33.3%
   2. Plataforma 10             - 2 cupones, 1 micrositios, promedio: 50.0%
   3. Dash                      - 1 cupones, 1 micrositios, promedio: 20.0%
   ...
```

---

## ⚠️ Notas Importantes:

### Micrositios con error 400:

Si ves errores "Request failed with status code 400" en algunos micrositios:

```
📦 Procesando: Club Plato Lleno (club-plato-lleno)...
   ❌ Error: Error al obtener cupones de Bonda
```

**Causa:** Ese micrositio no tiene el `microsite_id` correcto en la tabla `bonda_microsites` de Supabase.

**Solución:** Actualizar el `microsite_id` en Supabase:

```sql
UPDATE bonda_microsites 
SET microsite_id = 'XXXXX' 
WHERE slug = 'club-plato-lleno';
```

### Código de afiliado demo:

El script usa el código `22380612` (proporcionado por Bonda para Fundación Padres). 

Si necesitás analizar con otro código de afiliado, modificar línea 51 del script:
```typescript
const DEMO_AFFILIATE_CODE = 'TU_CODIGO_AQUI';
```

---

## 🎯 Usos del Análisis:

1. **Conocer el catálogo completo** de marcas disponibles en Bonda
2. **Comparar descuentos** entre micrositios
3. **Identificar marcas populares** (más cupones = más presencia)
4. **Análisis de competencia** (qué marcas están en qué categorías)
5. **Reportes para ONGs** (qué beneficios tienen disponibles)

---

## 🔧 Troubleshooting:

### Error: "No hay micrositios activos"

```sql
-- Verificar micrositios en Supabase
SELECT slug, activo FROM bonda_microsites;

-- Activar micrositios
UPDATE bonda_microsites SET activo = true;
```

### Error al conectar con Supabase:

Verificar `.env`:
```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Script muy lento:

Es normal, hace 1 request por micrositio a Bonda API. Con 12 micrositios tarda ~10-15 segundos.

---

## 📝 Personalización:

### Cambiar formato de salida:

Editar líneas 140-160 del script para modificar el CSV/JSON generado.

### Agregar más estadísticas:

Ejemplo: agregar categorías de productos:
```typescript
// En el loop de cupones (línea ~75)
marca.categorias.add(cupon.categoria);
```

### Filtrar por categoría:

```typescript
// Solo analizar restaurantes
if (cupon.categoria === 'Gastronomía') {
  // procesar...
}
```

---

## 🗂️ Archivos Relacionados:

- `analizar-cupones-bonda.ts` - Script principal
- `output/` - Carpeta con archivos generados (ignorada por git)
- `../../src/modules/bonda/bonda.service.ts` - Servicio que llama a Bonda API
