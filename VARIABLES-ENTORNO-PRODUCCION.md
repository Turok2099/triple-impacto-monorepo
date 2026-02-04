# 🔐 Variables de Entorno para Producción

## 📋 Índice
- [Backend (Railway)](#backend-railway)
- [Frontend (Vercel)](#frontend-vercel)
- [Checklist de Despliegue](#checklist-de-despliegue)

---

## 🚂 Backend (Railway)

### **Configuración del Servidor**
```bash
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://www.tripleimpacto.site
```

### **Supabase (PostgreSQL)**
```bash
SUPABASE_URL=https://faibhrhrassmrokvzqeu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **JWT (Autenticación)**
```bash
JWT_SECRET=<CAMBIAR-POR-SECRET-SEGURO-ALEATORIO>
JWT_EXPIRES_IN=24h
```
⚠️ **IMPORTANTE:** Generar un JWT_SECRET único para producción:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Bonda API**
```bash
# Ya configurado en Supabase (tabla bonda_microsites)
# NO necesitas estas variables:
# BONDA_API_KEY=
# BONDA_MICROSITE_ID=

# Sync automático (cron job)
BONDA_USE_MOCKS=false
SYNC_SECRET=<CAMBIAR-POR-SECRET-SEGURO-ALEATORIO>
```

### **Fiserv Connect** ⭐ (CRÍTICO)
```bash
FISERV_CONNECT_URL=https://test.ipg-online.com/connect/gateway/processing
FISERV_CONNECT_STORE_ID_1=5926012006
FISERV_CONNECT_STORE_ID_2=5926012005
FISERV_CONNECT_SHARED_SECRET=dv'B99xY{vLd
FISERV_CONNECT_TIMEZONE=America/Buenos_Aires
```

⚠️ **IMPORTANTE para PRODUCCIÓN:**
- Cambiar URL a: `https://www.ipg-online.com/connect/gateway/processing` (sin "test")
- Usar Store IDs de PRODUCCIÓN (no los de TEST)
- Obtener Shared Secret de PRODUCCIÓN de Fiserv

### **API Base URL** (Para Webhooks)
```bash
API_BASE_URL=https://tu-backend.railway.app
```
⚠️ Reemplazar `tu-backend.railway.app` con tu dominio real de Railway

### **URLs de Pago** (Frontend)
```bash
# Estas NO van en el backend, solo en el frontend
# (Se incluyen aquí como referencia)
```

---

## ⚡ Frontend (Vercel)

### **API Backend**
```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
```
⚠️ Reemplazar `tu-backend.railway.app` con tu dominio real de Railway

### **URLs de Retorno de Pago** (Fiserv)
```bash
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://www.tripleimpacto.site/donar/success
NEXT_PUBLIC_PAYMENT_ERROR_URL=https://www.tripleimpacto.site/donar/error
NEXT_PUBLIC_SITE_URL=https://www.tripleimpacto.site
```
⚠️ Asegurar que estas URLs estén configuradas en el dashboard de Fiserv como "URLs permitidas"

---

## ✅ Checklist de Despliegue

### **Pre-Despliegue**

#### Backend (Railway)
- [ ] Configurar **todas** las variables de entorno listadas arriba
- [ ] Cambiar `JWT_SECRET` a un valor aleatorio seguro
- [ ] Cambiar `SYNC_SECRET` a un valor aleatorio seguro
- [ ] Configurar `API_BASE_URL` con tu dominio de Railway
- [ ] **Para PRODUCCIÓN:** Cambiar Fiserv a URLs de producción
- [ ] Verificar que `FRONTEND_URL` apunte a tu dominio de Vercel

#### Frontend (Vercel)
- [ ] Configurar `NEXT_PUBLIC_API_URL` con tu backend de Railway
- [ ] Configurar URLs de Fiserv con tu dominio de Vercel
- [ ] Verificar que `NEXT_PUBLIC_SITE_URL` sea correcto

### **Post-Despliegue**

#### Base de Datos (Supabase)
- [ ] Ejecutar migración: `apps/backend/database/migrations/002-dashboard-cupones.sql`
- [ ] Ejecutar seed: `apps/backend/database/seed-organizaciones.sql`
- [ ] Ejecutar vinculación: `vincular-micrositios-organizaciones.sql`
- [ ] Verificar que tabla `payment_attempts` existe
- [ ] Verificar que tabla `usuarios_bonda_afiliados` existe

#### Fiserv Dashboard
- [ ] Configurar webhook URL: `https://tu-backend.railway.app/api/payments/fiserv/notification`
- [ ] Agregar URLs permitidas (whitelist):
  - `https://www.tripleimpacto.site/donar/success`
  - `https://www.tripleimpacto.site/donar/error`
- [ ] Verificar que el Store ID esté activo
- [ ] Confirmar el Shared Secret correcto
- [ ] **Para PRODUCCIÓN:** Solicitar activación en ambiente PRODUCCIÓN

#### Testing Inicial
- [ ] Probar registro de usuario
- [ ] Probar login
- [ ] Probar flujo de donación completo:
  1. Ir a `/donar`
  2. Seleccionar organización
  3. Ingresar monto ($5000+)
  4. Completar pago en Fiserv
  5. Verificar redirección a `/donar/success`
  6. Verificar creación de registro en `donaciones`
  7. Verificar creación de afiliado en `usuarios_bonda_afiliados`
- [ ] Probar dashboard de cupones (`/dashboard`)
- [ ] Verificar que el cron job de sincronización esté corriendo

---

## 🚨 Advertencias de Seguridad

### **NUNCA Commitear:**
```bash
❌ .env (backend)
❌ .env.local (frontend)
❌ JWT_SECRET
❌ SUPABASE_SERVICE_ROLE_KEY
❌ FISERV_CONNECT_SHARED_SECRET
❌ SYNC_SECRET
```

### **Gitignore Verificado:**
```bash
✅ apps/backend/.env
✅ apps/frontend/.env.local
```

---

## 🔄 Diferencias TEST vs PRODUCCIÓN

| Variable | TEST | PRODUCCIÓN |
|----------|------|------------|
| `FISERV_CONNECT_URL` | `https://test.ipg-online.com/...` | `https://www.ipg-online.com/...` |
| `FISERV_CONNECT_STORE_ID_1` | `5926012006` (TEST) | *Obtener de Fiserv* |
| `FISERV_CONNECT_SHARED_SECRET` | `dv'B99xY{vLd` (TEST) | *Obtener de Fiserv* |
| `NODE_ENV` | `development` | `production` |
| `BONDA_USE_MOCKS` | `true` | `false` |
| `API_BASE_URL` | `https://xxx.ngrok-free.dev` | `https://tu-backend.railway.app` |

---

## 📞 Contactos para Activación

### **Fiserv (Pagos)**
- Solicitar activación de Store en PRODUCCIÓN
- Obtener Shared Secret de PRODUCCIÓN
- Configurar webhook URL de producción
- Solicitar certificado SSL si es necesario

### **Bonda (Cupones)**
- Ya configurado en Supabase
- Los micrositios se administran desde la BD

---

## 🆘 Troubleshooting

### **Backend no arranca en Railway**
- Verificar que todas las variables estén configuradas
- Ver logs de Railway para identificar el error
- Verificar que el `PORT` sea 3000 o el que Railway asigne

### **Frontend no conecta con Backend**
- Verificar que `NEXT_PUBLIC_API_URL` apunte al backend correcto
- Verificar CORS en el backend (debe incluir tu dominio de Vercel)
- Verificar que el backend esté corriendo

### **Fiserv rechaza pagos**
- Verificar que el Store esté activo en PRODUCCIÓN
- Verificar el Shared Secret
- Verificar que las URLs de retorno estén en whitelist de Fiserv
- Verificar que el timezone sea `America/Buenos_Aires` (UTC-3)
- Verificar que currency sea `032` (no "ARS")

### **Webhook de Fiserv no llega**
- Verificar que `API_BASE_URL` esté correctamente configurada
- Verificar que la URL del webhook esté configurada en Fiserv Dashboard
- Verificar que el endpoint `/api/payments/fiserv/notification` sea accesible públicamente

---

**Última actualización:** 2026-02-02
**Estado:** Listo para desplegar en TEST
**Próximo paso:** Solicitar credenciales de PRODUCCIÓN a Fiserv
