# 🎯 SOLUCIÓN: Timezone Incorrecto en Fiserv

## ❌ Problema Identificado por Fiserv

**Mensaje de soporte:**

> "Sus transacciones están fallando porque en el parámetro `txndatetime` están enviando el horario UTC-6, pero para Buenos Aires lo correcto es UTC-3."

## 🔧 Corrección Aplicada

### Antes (❌ Incorrecto):

```typescript
function getTxndatetime(): string {
  const now = new Date(); // ← Usaba hora LOCAL del servidor
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  // ...
}
```

**Problema:** Si el servidor está en otra zona horaria (ej: México UTC-6), generaba el datetime incorrecto.

### Ahora (✅ Correcto):

```typescript
function getTxndatetime(): string {
  // Usa EXPLÍCITAMENTE la zona horaria de Buenos Aires (UTC-3)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Buenos_Aires", // ← UTC-3
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Extrae cada parte y genera el formato YYYY:MM:DD-HH:mm:ss
  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || "00";

  return `${get("year")}:${get("month")}:${get("day")}-${get("hour")}:${get(
    "minute"
  )}:${get("second")}`;
}
```

**Solución:** Ahora usa `Intl.DateTimeFormat` con `timeZone: 'America/Buenos_Aires'` para **garantizar** que siempre use UTC-3, sin importar dónde esté el servidor.

---

## 📊 Ejemplo de Salida

### Antes (Incorrecto si servidor en UTC-6):

```
txndatetime: 2026:02:02-06:30:45  ❌ (UTC-6, 3 horas menos)
```

### Ahora (Correcto):

```
txndatetime: 2026:02:02-09:30:45  ✅ (UTC-3, Buenos Aires)
```

---

## 🧪 Cómo Probar

### 1. Reiniciar el Backend

```bash
# Terminal 1 (backend)
Ctrl+C
npm run dev
```

### 2. Verificar en Logs

Espera a ver:

```
[Nest] LOG [FiservConnectService] Fiserv Connect configurado (Store: 5926012006)
```

### 3. Probar Donación

1. Ve a: `http://localhost:3001/donar`
2. Llena el formulario (Organización + $5,000)
3. Click en "Proceder al Pago"

### 4. Verificar txndatetime en Logs

Busca en Terminal 1:

```javascript
[Nest] DEBUG [FiservConnectService] Params Fiserv Connect:
{
  storename: '5926012006',
  chargetotal: '5000.00',
  currency: '032',
  txndatetime: '2026:02:02-09:30:45',  ← Hora de Buenos Aires (UTC-3)
  timezone: 'America/Buenos_Aires',
  ...
}
```

---

## ✅ Resultado Esperado

Con el timezone correcto, deberías:

1. ✅ **Ser redirigido** al formulario de pago de Fiserv sin errores
2. ✅ **Ver el formulario** para ingresar datos de tarjeta
3. ✅ **Poder usar** la tarjeta de prueba:
   ```
   4111 1111 1111 1111
   12/26
   123
   Test User
   ```

---

## 📝 Cambios Completos en esta Sesión

| #   | Corrección                       | Estado       |
| --- | -------------------------------- | ------------ |
| 1   | Currency: "ARS" → "032"          | ✅           |
| 2   | Store ID configurado             | ✅           |
| 3   | **Timezone: hora local → UTC-3** | ✅ (CRÍTICO) |

---

**Fecha:** 2026-02-02
**Estado:** Listo para probar con timezone correcto
