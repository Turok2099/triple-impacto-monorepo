# Consulta y Consumo de Cupones - Integración Bonda

A continuación, se detalla la implementación exacta que estamos utilizando desde nuestro backend (basado en Node.js/NestJS) para consultar el catálogo de cupones y solicitar el código de un cupón específico. 

Ambas peticiones funcionan correctamente con otros micrositios, pero en las nuevas plataformas arrojan el error: `Ocurrió un error inesperado. Escribinos a soporte@bondacom.com con tu DNI`.

---

## 1. Consulta del catálogo de cupones

Para listar los cupones disponibles de un afiliado, realizamos un `GET` al endpoint `/api/cupones`.

**Implementación en TypeScript:**

```typescript
import axios from 'axios';

async function consultarCupones(apiKey: string, micrositioId: string, codigoAfiliado: string) {
  const url = 'https://apiv1.cuponstar.com/api/cupones';
  
  try {
    const response = await axios.get(url, {
      params: {
        key: apiKey,                   // Ejemplo: xUZyz1WLzllnbbi...
        micrositio_id: micrositioId,   // Ejemplo: 912360
        codigo_afiliado: codigoAfiliado, // Ejemplo: 12345677 (coincide con DNI/code del afiliado creado)
        subcategories: false           // Retornar categorías raíz
      }
    });
    
    console.log('Cupones obtenidos:', response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error Bonda:', error.response?.data || error.message);
    throw error;
  }
}
```

---

## 2. Consumo / Solicitud de código de cupón

Para consumir un cupón específico, la documentación de Bonda requiere enviar la petición usando `FormData` (`multipart/form-data`) mediante el método `POST`.

**Implementación en TypeScript:**

```typescript
import axios from 'axios';
import FormData from 'form-data';

async function solicitarCodigoCupon(apiKey: string, micrositioId: string, codigoAfiliado: string, cuponId: string) {
  // Construimos el payload como form-data según la especificación
  const form = new FormData();
  form.append('key', apiKey);
  form.append('micrositio_id', micrositioId);
  form.append('codigo_afiliado', codigoAfiliado);
  form.append('split', '1');

  const url = `https://apiv1.cuponstar.com/api/cupones/${cuponId}/codigo`;

  try {
    const response = await axios.post(url, form, {
      headers: form.getHeaders() // Inyecta el Content-Type multipart/form-data con los boundaries correctos
    });
    
    console.log('Código obtenido:', response.data.success.codigo);
    return response.data;
  } catch (error) {
    console.error('Error al consumir cupón Bonda:', error.response?.data || error.message);
    throw error;
  }
}
```

---

## Comportamiento Observado

1. La creación de usuarios vía `POST /api/v2/microsite/{id}/affiliates` retorna éxito (`success: true`) para el código de afiliado y DNI `12345677`.
2. Sin embargo, al invocar el método de **Consulta del catálogo** con esos mismos datos inmediatamente después, la API responde con un `HTTP 400`:
   ```json
   {
     "error": {
       "detail": "Ocurrió un error inesperado. Escribinos a soporte@bondacom.com con tu DNI",
       "code": "AuthorizationException"
     },
     "success": false
   }
   ```
