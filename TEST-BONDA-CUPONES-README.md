# 🧪 Test de Endpoint Bonda - Cupones Disponibles

## 📝 Descripción

Scripts para validar que el endpoint `/api/cupones` de Bonda funciona correctamente y retorna cupones **DISPONIBLES** (no usados).

---

## 🚀 Cómo Ejecutar los Scripts

### **Opción 1: PowerShell (Recomendado para Windows)**

```powershell
# En PowerShell
cd "c:/Programacion Local/triple-impacto-monorepo"
.\test-bonda-cupones-disponibles.ps1
```

Si aparece un error de "ejecución de scripts deshabilitada":

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\test-bonda-cupones-disponibles.ps1
```

---

### **Opción 2: Bash (Git Bash o WSL)**

```bash
# En Git Bash o WSL
cd "/c/Programacion Local/triple-impacto-monorepo"
chmod +x test-bonda-cupones-disponibles.sh
./test-bonda-cupones-disponibles.sh
```

---

### **Opción 3: cURL Directo (Rápido)**

**Fundación Padres:**

```bash
curl "https://apiv1.cuponstar.com/api/cupones?key=DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq&micrositio_id=911299"
```

**Club de Impacto Proyectar:**

```bash
curl "https://apiv1.cuponstar.com/api/cupones?key=DbMd4IZG6S6d9fAQ4Uro0J5EPjf9fZwC2256liZXrwkJg9i3HDXZuCbdZzED62Rg&micrositio_id=911436"
```

---

## 📊 Resultados Esperados

### ✅ **Si el endpoint funciona:**

```json
{
  "count": 45,
  "results": [
    {
      "id": "1",
      "nombre": "Cinemark - 2x1",
      "descuento": "2x1",
      "empresa": {
        "nombre": "Cinemark",
        "logo_thumbnail": { ... }
      },
      "foto_principal": { ... },
      ...
    }
  ]
}
```

**Características:**

- ✅ Retorna catálogo completo de cupones DISPONIBLES
- ✅ NO requiere código de afiliado
- ✅ NO muestra códigos únicos de usuario (esos vienen después de solicitar)
- ✅ Muestra fotos, descripciones, empresas

---

### ❌ **Si hay error:**

```json
{
  "error": "Invalid credentials",
  "success": false
}
```

**Posibles causas:**

- Token inválido
- Microsite ID incorrecto
- Micrositio inactivo en Bonda

---

## 📁 Archivos Generados

Los scripts generan archivos JSON con las respuestas:

- `cupones-911299.json` - Fundación Padres
- `cupones-911436.json` - Club de Impacto Proyectar
- `cupones-911322.json` - Club Plato Lleno

---

## 🔍 Diferencia entre Endpoints

| Endpoint                    | Descripción                         | Requiere Afiliado | Muestra Códigos |
| --------------------------- | ----------------------------------- | ----------------- | --------------- |
| `/api/cupones` ✅           | Catálogo de cupones **DISPONIBLES** | ❌ NO             | ❌ NO           |
| `/api/cupones_recibidos` ❌ | Historial de cupones **USADOS**     | ✅ SÍ             | ✅ SÍ           |

**Actualmente tu código usa:** `/api/cupones_recibidos` ❌  
**Debería usar:** `/api/cupones` ✅

---

## 🎯 Próximos Pasos

Si el test es exitoso (muestra cupones disponibles):

1. ✅ **Validar** que los datos son correctos
2. ✅ **Cambiar el código backend** para usar `/api/cupones`
3. ✅ **Eliminar** el parámetro `codigo_afiliado` de la sincronización
4. ✅ **Probar** que el home ya no muestra duplicados

---

## 📞 Micrositios Configurados

| Nombre                          | ID         | Token                                       |
| ------------------------------- | ---------- | ------------------------------------------- |
| Club de Impacto Proyectar       | 911436     | DbMd4IZG6S6d9fAQ4Uro0J5EPjf9fZwC2256...     |
| Beneficios Biblioteca Rurales   | 911406     | HzSJ8ja5ntXOPsjYxnlOsaTALKnv6tAjnVwP...     |
| Beneficios Haciendo Camino      | 911405     | yX2bueZCYRdaXEqYOAGdv7qwvGyisuALGhoV...     |
| Comunidad Mamis Solidarias      | 911340     | cdE7XhhpkkU9amSJ9sPuI1LFkMRzrMOzgeuX...     |
| Club Plato Lleno                | 911322     | s2uwjlmPcWsQmy9pEJFSmm2Zm8qNs8oUwA9G...     |
| Beneficios Monte Adentro        | 911321     | JABu8vQxB6ptpic1MaBdQkMnlPdDnxDM70zN...     |
| **Beneficios Fundación Padres** | **911299** | **DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYo...** |
| Club Proactiva                  | 911265     | lsmiw3D8zyCwk7ssUMNgbq1lksesHFi8ZcWv...     |
| Beneficios La Guarida           | 911249     | WAjqgmfu8zn8PynyOcZ87RNc46GmW1MK1rUL...     |
| Comunidad Techo                 | 911215     | gyAYd2JAdGWPiQnVoE8guA35kSeENpnJP1Yi...     |
| Regenerar Club                  | 911193     | 79BdxcA9dsUyOQgde5LHqwxn4k7wLp6s7OyJ...     |
| Beneficios Loros Parlantes      | 911192     | Khh70AhvxXNuhP72xP9u2upzzQ0YLqHl2BnO...     |

---

## 🆘 Ayuda

Si tienes problemas ejecutando los scripts:

1. Verifica que estás en el directorio correcto
2. Prueba con el comando cURL directo (Opción 3)
3. Verifica tu conexión a internet
4. Contacta a Bonda si el endpoint retorna errores de autenticación
