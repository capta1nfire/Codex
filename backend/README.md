# Codex Backend

Este directorio contiene el API Gateway implementado en Node.js con Express, que gestiona las peticiones, autenticación, y orquesta la comunicación con el servicio Rust para la generación de códigos de barras y QR.

## Estructura del Proyecto

```
backend/
├── dist/                    # Código JavaScript transpilado (para producción)
├── logs/                    # Logs de la aplicación (rotados, no versionados)
├── node_modules/            # Dependencias (no versionado)
├── prisma/                  # Configuración y migraciones de Prisma ORM
│   ├── schema.prisma        # Definición del esquema de la base de datos
│   └── migrations/          # Directorio de migraciones generadas
│   └── seed.ts              # Script opcional para poblar datos iniciales
├── src/                     # Código fuente TypeScript
│   ├── config.ts            # Carga y exporta variables de entorno y configuración.
│   ├── index.ts             # Punto de entrada principal: Configura Express, middleware, rutas.
│   ├── server-config.ts     # Configuración específica del servidor HTTP/HTTPS.
│   ├── controllers/         # Lógica de manejo de peticiones HTTP.
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts 
│   │   └── ... (otros)
│   ├── lib/                 # Instancias compartidas o configuraciones de librerías.
│   │   ├── prisma.ts          # Instancia global del cliente Prisma.
│   │   └── redis.ts           # Instancia/Configuración del cliente Redis.
│   ├── middleware/          # Funciones middleware reutilizables.
│   │   ├── authMiddleware.ts  # Autenticación (Passport strategies, JWT).
│   │   ├── errorMiddleware.ts # Manejo centralizado de errores.
│   │   └── validationMiddleware.ts # Validación de request body/params (Zod).
│   ├── models/              # Abstracción de datos y lógica de acceso (usando Prisma).
│   │   └── user.ts            # User model/store (UserStore).
│   ├── routes/              # Definición de los endpoints de la API.
│   │   ├── index.ts           # Agrupa y exporta todas las rutas.
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── avatar.routes.ts
│   │   └── generator.routes.ts
│   ├── schemas/             # Esquemas de validación de datos (Zod).
│   │   ├── auth.schema.ts
│   │   └── user.schema.ts
│   ├── services/            # Lógica de negocio y comunicación entre componentes.
│   │   ├── auth.service.ts
│   │   ├── avatar.service.ts  # Lógica para guardar/gestionar avatares.
│   │   └── generator.service.ts # Lógica para interactuar con el servicio Rust.
│   ├── types/               # Definiciones de tipos TypeScript personalizadas.
│   │   └── express.d.ts     # Extiende tipos de Express (ej. req.user).
│   ├── utils/               # Funciones y clases de utilidad generales.
│   │   ├── errors.ts          # Sistema de errores personalizados (AppError).
│   │   ├── logger.ts          # Configuración del logger (Winston).
│   │   └── metrics.ts         # Configuración y registro de métricas (prom-client).
│   ├── __tests__/           # Tests unitarios y de integración (Jest).
│   └── __mocks__/           # Mocks para tests.
├── uploads/                 # Directorio para archivos subidos (ej. avatares, no versionado).
├── .env.example             # Archivo de ejemplo para variables de entorno.
├── .gitignore               # Archivos ignorados por Git.
├── jest.config.cjs          # Configuración de Jest.
├── eslint.config.js         # Configuración de ESLint.
├── tsconfig.json            # Configuración de TypeScript.
├── package.json             # Dependencias y scripts npm.
└── README.md                # Este archivo.
```

## Características

- API Gateway con Express.
- **Base de Datos:** Persistencia con **PostgreSQL** gestionada mediante **Prisma ORM**.
- **Autenticación:** Sistema robusto con Passport (JWT, Local, API Key hasheada).
- **Generación de Códigos:** Orquestación de llamadas a microservicio Rust con cache DashMap avanzado.
- **Seguridad:** Helmet, Rate Limiting, Validación (express-validator), XSS Clean, CORS seguro, HTTPS opcional.
- **Manejo de Errores:** Sistema tipificado con `AppError` y manejo centralizado.
- **Logging:** Estructurado con Winston (JSON a archivo, coloreado a consola).
- **Métricas (Prometheus):** Endpoint `/metrics` expone métricas operacionales (duración/tasa HTTP, duración llamadas Rust) para Prometheus.
- **Caché (Redis):** Cliente Redis configurado (`lib/redis.ts`) e integrado activamente en `barcodeService` para cachear resultados de generación.
- **Optimización:** Compresión de respuestas, Headers HTTP Cache-Control.
- **Desarrollo:** TypeScript, Configuración basada en `.env`, Scripts npm para build/dev/test/seed.
- **Mejora Continua:** Mejorada consistencia en generación de claves Redis en `barcodeService`.

## Sistema de Caché y Métricas

- **Caché:**
  - El sistema está configurado para conectarse a un servidor **Redis** (definido por `REDIS_URL` en `.env`). La instancia del cliente está disponible en `lib/redis.ts`.
  - Actualmente, el `barcodeService.ts` **utiliza activamente** Redis, con consistencia mejorada en la generación de claves.
  - El **microservicio Rust** implementa su propio **caché inteligente DashMap** con TTL configurable, limpieza automática, y expone métricas avanzadas en `/analytics/performance`, `/status`, `/health`.
  - **Métricas:**
    - El endpoint `/metrics` expone métricas en formato **Prometheus** utilizando `prom-client`.
    - Métricas incluidas: Duración y tasa de solicitudes HTTP (desglosadas por método, ruta, código), duración de las llamadas al servicio Rust (desglosadas por tipo de código), métricas estándar de proceso Node.js.
    - Estas métricas están pensadas para ser recolectadas por un servidor Prometheus y visualizadas con Grafana (configurados en `docker-compose.yml` para desarrollo).
    - Las métricas detalladas del _caché interno de Rust_ se consultan directamente desde el frontend a `/analytics/performance` (servicio Rust).

## Infraestructura de Testing

- Framework: **Jest** con `ts-jest` y `supertest`.
- **Comandos:** `npm test`, `npm run test:watch`, `npm run test:coverage`, etc. (ver `package.json`).
- **Estructura:** Los tests (`*.test.ts`) residen en directorios `__tests__/` junto al código que prueban (ej. `src/utils/__tests__/errors.test.ts`).

## Variables de Entorno (`.env`)

```
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Caché Redis
REDIS_URL="redis://localhost:6379"

# Configuración del servidor
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Configuración del servicio Rust
RUST_SERVICE_URL=http://localhost:3002/generate
RUST_SERVICE_TIMEOUT_MS=5000 # Opcional, defecto 5000ms

# Configuración de CORS
ALLOWED_ORIGINS=http://localhost:3000 # Separados por coma si son varios

# Configuración de logging
LOG_LEVEL=info # (error, warn, info, http, verbose, debug, silly)

# Configuración de SSL/TLS
SSL_ENABLED=false
SSL_KEY_PATH=
SSL_CERT_PATH=
SSL_CA_PATH=

# Configuración de seguridad
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_REQUEST_SIZE=1mb
SESSION_SECRET= # Requerido por Passport, aunque no usemos sesiones explícitas
JWT_SECRET= # ¡IMPORTANTE: Cambiar por un secreto seguro!
JWT_EXPIRES_IN=1h

# Configuración de caché (para el caché en memoria actual)
CACHE_MAX_AGE=300
```

## Endpoints Principales

La API expone los siguientes grupos principales de endpoints bajo el prefijo `/api`:

- **`/auth`**: Autenticación y gestión de sesión.
  - `POST /register`: Registrar un nuevo usuario.
  - `POST /login`: Iniciar sesión (email/password), devuelve JWT.
  - `POST /refresh`: Refrescar un token JWT (si está implementado).
  - `GET /me`: Obtener datos del usuario actualmente autenticado (vía JWT).
  - `POST /api-key`: Generar/Regenerar API Key para el usuario autenticado.

- **`/users`**: Gestión de perfiles de usuario.
  - `PUT /:id`: Actualizar el perfil del usuario (requiere autenticación y ser el mismo usuario o admin).
  - `POST /profile-picture`: (Endpoint anterior, **AHORA OBSOLETO**, usar `/api/avatars/upload`).
  - `PUT /profile-picture/default`: (Endpoint anterior, **AHORA OBSOLETO**, usar `/api/avatars/default/:type`).
  - `DELETE /profile-picture`: (Endpoint anterior, **AHORA OBSOLETO**, usar `/api/avatars/reset`).

- **`/avatars`**: Gestión de imágenes de perfil (avatares).
  - `POST /upload`: Subir una nueva imagen de perfil personalizada (requiere autenticación).
  - `POST /default/:type`: Establecer un avatar predeterminado (ej. 'Vector') para el usuario autenticado.
  - `POST /reset`: Restablecer el avatar del usuario autenticado a sus iniciales.
  - `GET /default-options`: Obtener la lista de avatares predeterminados disponibles.

- **`/generate`**: Generación de códigos de barras y QR.
  - `POST /`: Endpoint principal para generar un código (requiere API Key o JWT).

- **Endpoints de Servicio/Monitoreo:**
  - `GET /`: Mensaje de bienvenida de la API.
  - `GET /health`: Estado de salud del servicio y dependencias.
  - `GET /metrics`: Métricas en formato Prometheus.

(Para detalles sobre parámetros, request body y respuestas específicas, consultar el código en `src/routes/` y los esquemas en `src/schemas/`).

## Próximos Pasos / Mejoras Pendientes (Resumen)

Consultar `CODEX.md` (Secciones 13 y 17) para el roadmap completo. Algunas prioridades:

- **Caché:** Implementar uso de Redis en `barcodeService`.
- **API Keys:** Optimizar búsqueda `findByApiKey`.
- **Seguridad Logs:** Filtrar/enmascarar datos sensibles en `errorHandler`.
- **Testing:** Ampliar cobertura.
- **Documentación API:** Generar documentación OpenAPI/Swagger.

## Sistema de Manejo de Errores

El backend implementa un sistema de errores tipificados para una gestión coherente:

- Cada tipo de error extiende la clase base `AppError`
- Errores específicos como `ValidationError`, `AuthenticationError`, `NotFoundError`
- Códigos HTTP estandarizados según el tipo de error
- Códigos internos de error para facilitar el debugging
- Middleware para capturar errores y estandarizar respuestas
- Wrapper para manejo de errores asíncronos

## Sistema de Logging

Se utiliza Winston para un logging estructurado:

- Diferentes niveles de log (error, warn, info, debug)
- Formato personalizado con timestamps
- Logs separados para errores y logs combinados
- Rotación de archivos para gestionar el espacio
- Integración con el manejo de errores

## Sistema de Monitoreo de Caché

El backend implementa un sistema avanzado de monitoreo de caché:

- Tracking de hits y misses para cada tipo de código de barras
- Estadísticas en tiempo real accesibles a través del endpoint `/metrics`
- Métricas detalladas:
  - Tasa de aciertos (hit rate) global y por tipo
  - Conteo de hits y misses
  - Tamaño actual del caché
  - Tiempo estimado de respuesta
- Integración con el dashboard de métricas del frontend
- Limpieza automática para optimizar el uso de memoria

## Soporte SSL/HTTPS

El backend incluye soporte completo para conexiones seguras:

- Configuración flexible mediante variables de entorno
- Carga de certificados SSL y claves privadas
- Fallback automático a HTTP si no se encuentran certificados
- Manejo de errores específicos para problemas de SSL
- Tests automatizados para verificar la funcionalidad

## Infraestructura de Testing

El backend incluye una completa infraestructura de testing con Jest y Supertest:

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con modo watch (para desarrollo)
npm run test:watch

# Ejecutar tests y generar reporte de cobertura
npm run test:coverage

# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar solo tests de integración
npm run test:integration
```

### Tipos de Tests

1. **Tests Unitarios**: Verifican componentes individuales como utilidades y funciones.

   - Tests para el sistema de errores
   - Tests para el sistema de logging

2. **Tests de Integración**: Prueban la interacción entre componentes.

   - Tests para el flujo de validación
   - Tests para el flujo de manejo de recursos no encontrados

3. **Tests de Middleware**: Validan el comportamiento de los middleware.

   - Tests para el middleware de manejo de errores
   - Tests para el wrapper de errores asíncronos

4. **Tests de Endpoints**: Verifican el comportamiento correcto de los endpoints de la API.
   - Tests para el endpoint de `/health`
   - Tests para el endpoint de `/metrics`
   - Tests para el endpoint de generación de códigos
5. **Tests de SSL/HTTPS**: Verifican la configuración segura del servidor.
   - Tests para diferentes configuraciones de SSL
   - Tests para fallback a HTTP

### Estructura de Tests

- `__tests__/` - Pruebas generales de la aplicación
  - `index.test.ts` - Tests para endpoints principales
  - `integration.test.ts` - Tests de integración
  - `health.test.ts` - Tests para el endpoint de salud
  - `performance.test.ts` - Tests de rendimiento y caché
  - `https.test.ts` - Tests para SSL/HTTPS
  - `test-error-handling.test.ts` - Tests para manejo de errores
  - `setup.ts` - Configuración común para todos los tests
  - `errors.test.ts` - Tests para el sistema de errores

### Configuración

La configuración de Jest se encuentra en `jest.config.js`, con características como:

- Reporte de cobertura (coverage)
- Compatibilidad con TypeScript mediante ts-jest
- Configuración de tiempo de espera (timeout) para tests asíncronos
- Mock de servicios externos como `fetch`
- Setup global para todos los tests

## Comandos Útiles

Además de los comandos de ejecución (`npm run dev`, `npm start`, `npm run build`) y testing (`npm test`, etc.) definidos en `package.json`, los siguientes comandos pueden ser útiles durante el desarrollo:

```bash
# Abrir Prisma Studio (GUI para explorar la base de datos)
npx prisma studio

# Ejecutar el script de seeding (si prisma/seed.ts está configurado)
npx prisma db seed

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Formatear el schema de Prisma
npx prisma format
```

## Instalación y Ejecución

Consulta el [README principal](../README.md) para instrucciones detalladas sobre instalación y ejecución del backend junto con el resto de componentes del sistema.

## Mejoras de Rendimiento

El backend incluye varias optimizaciones para mejorar el rendimiento:

### Compresión de Respuestas

Se utiliza el middleware `compression` para reducir el tamaño de las respuestas HTTP:

- Compresión automática de respuestas grandes como SVGs
- Reduce el ancho de banda y mejora los tiempos de carga
- Configurado para todos los endpoints de la API

### Sistema de Caché

Implementación avanzada de caché en memoria:

- Las respuestas del servicio Rust se almacenan en caché por 5 minutos (configurable)
- Mejora significativa en tiempos de respuesta para solicitudes repetidas
- Limpieza automática de entradas caducadas cada minuto
- Identificación de respuestas en caché mediante el campo `fromCache: true`
- Sistema de estadísticas detalladas por tipo de código
- Endpoint `/metrics` para acceso a métricas en tiempo real

### Optimización de Headers HTTP

Configuración de headers de caché para respuestas:

- Headers `Cache-Control` para permitir el almacenamiento en caché en navegadores
- Tiempo de vida configurable mediante la variable `CACHE_MAX_AGE`
- Soporte para ETags y Last-Modified en recursos estáticos

### Tests de Rendimiento

Suite de tests para verificar las optimizaciones:

- Tests para compresión de respuestas
- Tests para el sistema de caché y métricas
- Tests de comparación de rendimiento entre respuestas en caché y no en caché

## Variables de Entorno

El backend requiere las siguientes variables de entorno en un archivo `.env`:

```
# Configuración del servidor
PORT=3001
HOST=0.0.0.0

# Configuración del servicio Rust
RUST_SERVICE_URL=http://localhost:3002/generate

# Configuración de CORS
ALLOWED_ORIGINS=http://localhost:3000

# Configuración de logging
LOG_LEVEL=info

# Configuración de SSL/TLS
SSL_ENABLED=false
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
SSL_CA_PATH=/path/to/ca.crt

# Configuración de seguridad
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX=100           # 100 peticiones por ventana
MAX_REQUEST_SIZE=1mb
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=1h

# Configuración de caché y rendimiento
CACHE_MAX_AGE=300             # Tiempo de caché en segundos (5 minutos)
```

## Endpoints

- **GET /** - Ruta de bienvenida
- **GET /health** - Estado del sistema y dependencias, incluye:
  - Estado del API Gateway
  - Estado del servicio Rust
  - Uptime del sistema
  - Uso de memoria
  - Detalles de la plataforma
- **GET /metrics** - Métricas en formato Prometheus.
- **POST /generate** - Genera un código basado en los siguientes parámetros:
  - `barcode_type`: Tipo de código (qrcode, code128, pdf417, ean13, etc.)
  - `data`: Datos a codificar
  - `options`: Opciones adicionales de configuración (opcional)
- **POST /generator** - Alias para /generate, mantiene compatibilidad con clientes existentes

## Manejo de Errores en las Respuestas

Todas las respuestas de error siguen un formato estandarizado:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "context": {
      /* Información adicional */
    }
  }
}
```

Los códigos de error posibles incluyen:

- `VALIDATION_ERROR` - Error en los datos de entrada
- `AUTHENTICATION_ERROR` - Error de autenticación
- `AUTHORIZATION_ERROR` - Error de autorización
- `RESOURCE_NOT_FOUND` - Recurso no encontrado
- `INTERNAL_ERROR` - Error interno del servidor
