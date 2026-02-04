# ✅ Correcciones Aplicadas a Fiserv Connect

## 🔧 Cambios Realizados

### 1. **Currency Code Corregido** ✅

- **Antes:** `currency: "ARS"` (alfabético)
- **Ahora:** `currency: "032"` (numérico ISO 4217)

**Función agregada:**

```typescript
function getCurrencyCode(currency: string): string {
  const codes: Record<string, string> = {
    ARS: "032", // Peso argentino
    UYU: "858", // Peso uruguayo
    USD: "840", // Dólar estadounidense
  };
  return codes[currency.toUpperCase()] || currency;
}
```

### 2. **Store ID Configurado** ✅

- **Actualmente usando:** `5926012005` (Store ID 1)
- **Alternativo disponible:** `5926012006` (Store ID 2)

### 3. **Logging Mejorado** ✅

Ahora muestra:

- Currency original (ej: "ARS")
- Currency convertido (ej: "032")
- txndatetime generado
- Longitud del Shared Secret

---

## 🧪 Plan de Pruebas

### **Prueba 1: Store ID 5926012005** (Actual)

1. **Reiniciar el backend:**

   ```bash
   # Terminal 1 (backend)
   Ctrl+C
   npm run dev
   ```

2. **Esperar a ver en los logs:**

   ```
   [Nest] LOG [FiservConnectService] Fiserv Connect configurado (Store: 5926012005)
   ```

3. **Ir a:** `http://localhost:3001/donar`

4. **Llenar el formulario:**

   - Organización: Cualquiera
   - Monto: $5,000 (o más)

5. **Click en "Proceder al Pago"**

6. **Verificar logs del backend:**

   ```
   [Nest] DEBUG [FiservConnectService] Params Fiserv Connect:
   Object {
     storename: '5926012005',
     chargetotal: '5000.00',
     currency: '032',           ← DEBE SER '032'
     currencyOriginal: 'ARS',
     txntype: 'sale',
     mode: 'payonly',
     ...
   }
   ```

7. **Resultado Esperado:**
   - ✅ **Si funciona:** Verás el formulario de pago de Fiserv sin errores
   - ❌ **Si falla:** Pasa a Prueba 2

---

### **Prueba 2: Store ID 5926012006** (Si falla la Prueba 1)

1. **Editar `.env` del backend:**

   ```bash
   FISERV_CONNECT_STORE_ID_1=5926012006  # Cambiar de 5 a 6
   ```

2. **Reiniciar el backend:**

   ```bash
   Ctrl+C
   npm run dev
   ```

3. **Verificar en logs:**

   ```
   [Nest] LOG [FiservConnectService] Fiserv Connect configurado (Store: 5926012006)
   ```

4. **Repetir el flujo de donación**

5. **Resultado Esperado:**
   - ✅ **Si funciona:** Este es el Store correcto
   - ❌ **Si falla:** Ambos Stores tienen problemas → Contactar a Fiserv

---

## 📊 Checklist de Validación

Cuando pruebes, verifica que el formulario enviado a Fiserv tenga:

```html
<form
  method="POST"
  action="https://test.ipg-online.com/connect/gateway/processing"
>
  <input name="txntype" value="sale" />
  <input name="timezone" value="America/Buenos_Aires" />
  <input name="txndatetime" value="2026:02:02-12:45:30" />
  <input name="hash_algorithm" value="HMACSHA256" />
  <input name="mode" value="payonly" />
  <input name="storename" value="5926012005" />
  <input name="chargetotal" value="5000.00" />
  <input name="currency" value="032" /> ← CRÍTICO: Debe ser "032"
  <input name="responseSuccessURL" value="..." />
  <input name="responseFailURL" value="..." />
  <input name="transactionNotificationURL" value="..." />
  <input name="oid" value="..." />
  <input name="merchantTransactionId" value="..." />
  <input name="checkoutoption" value="combinedpage" />
  <input name="hashExtended" value="..." />
</form>
```

---

## 🎯 Qué Esperar

### ✅ **Si el Store Está Activo:**

- Verás el formulario de pago de Fiserv
- Podrás ingresar datos de tarjeta de prueba:
  ```
  4111 1111 1111 1111
  12/26
  123
  Test User
  ```

### ❌ **Si el Store NO Está Activo:**

- Error: "Your storename is not configured in the system"
- Significa que Fiserv debe activar ese Store ID

---

## 📞 Si Ambos Stores Fallan

Contacta a Fiserv con esta información:

```
Asunto: Activación de Store IDs en TEST

Hola,

Necesito activar los siguientes Store IDs en el ambiente TEST:
- Store ID 1: 5926012005
- Store ID 2: 5926012006
- Shared Secret: dv'B99xY{vLd

Configuración requerida:
- Moneda: ARS (código 032)
- Tipo de transacción: sale
- Modo: payonly
- URL: https://test.ipg-online.com/connect/gateway/processing

Por favor, confirmen cuál Store ID corresponde al Shared Secret
y activen la configuración.

Gracias
```

---

## 📝 Notas Importantes

1. **Currency Code:** Ahora usa códigos numéricos ISO 4217 (032 para ARS)
2. **Store ID:** Probando primero 5926012005, luego 5926012006
3. **Shared Secret:** `dv'B99xY{vLd` (12 caracteres con apóstrofe)
4. **Timezone:** `America/Buenos_Aires`
5. **Hash:** HMACSHA256 en Base64

---

**Fecha de correcciones:** 2026-02-02
**Estado:** Listo para probar
