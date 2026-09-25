# Backend - Triple Impacto

Backend desarrollado con NestJS para el proyecto Triple Impacto.

## 📁 Estructura del Proyecto

```
src/
├── app.module.ts          # Módulo raíz de la aplicación
├── app.controller.ts      # Controlador principal
├── app.service.ts         # Servicio principal
├── main.ts                # Punto de entrada de la aplicación
├── config/                # Configuración y variables de entorno
│   ├── config.module.ts
│   └── configuration.ts
├── common/                # Código compartido
│   └── dto/              # Data Transfer Objects comunes
│       └── pagination.dto.ts
└── modules/              # Módulos de la aplicación
    └── example/          # Módulo de ejemplo
        ├── example.module.ts
        ├── example.controller.ts
        ├── example.service.ts
        └── dto/
            ├── create-example.dto.ts
            └── example.dto.ts
```

## 🚀 Características Implementadas

- ✅ CORS habilitado
- ✅ Validación global con `class-validator`
- ✅ Prefijo global de rutas `/api`
- ✅ Endpoint de health check `/api/health`
- ✅ Configuración de variables de entorno
- ✅ Estructura modular escalable
- ✅ DTOs para validación de datos
- ✅ TypeScript con tipos estrictos

## 📝 Endpoints Disponibles

- `GET /api` - Información de la API
- `GET /api/health` - Estado de salud del servidor
- `GET /api/example` - Listar ejemplos (si el módulo está habilitado)
- `GET /api/example/:id` - Obtener un ejemplo (si el módulo está habilitado)
- `POST /api/example` - Crear un ejemplo (si el módulo está habilitado)

## 🔧 Configuración

Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=triple_impacto
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30m
JWT_REFRESH_SECRET=another-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
```

## 📦 Crear un Nuevo Módulo

Para crear un nuevo módulo, puedes usar el CLI de NestJS:

```bash
nest g module modules/nombre-del-modulo
nest g controller modules/nombre-del-modulo
nest g service modules/nombre-del-modulo
```

O crear manualmente la estructura siguiendo el ejemplo del módulo `example`.

## 🔍 Módulo de Ejemplo

El módulo `example` está incluido como referencia para crear nuevos módulos. Si no lo necesitas, puedes:

1. Eliminar la carpeta `src/modules/example`
2. Remover `ExampleModule` de `app.module.ts` (si se agregó)
