# Codex Backend

Este directorio contiene el API Gateway implementado en Node.js con Express, que gestiona las peticiones, autenticación, y orquesta la comunicación con el servicio Rust para la generación de códigos de barras y QR.

## Estructura del Proyecto

```
backend/
├── prisma/                  # Configuración y migraciones de Prisma ORM
│   └── schema.prisma        # Definición del esquema de la base de datos
│   └── seed.ts              # Script para poblar datos iniciales
├── src/                     # Código fuente TypeScript
│   ├── controllers/         # Lógica de manejo de requests/responses
│   │   └── auth.controller.ts # Controlador para autenticación
│   ├── lib/                 # Librerías o instancias compartidas
│   │   └── prisma.ts          # Instancia del cliente Prisma
│   ├── middleware/          # Middleware personalizado
│   │   ├── errorHandler.ts    # Manejo centralizado de errores
│   │   └── authMiddleware.ts  # Middleware de autenticación (Passport)
│   ├── models/              # Definición de modelos y acceso a datos
│   │   └── user.ts            # Modelo User y UserStore (ahora con Prisma)
│   ├── routes/              # Definición de rutas de la API
│   │   └── auth.routes.ts     # Rutas para autenticación
│   ├── services/            # Lógica de negocio
│   │   ├── auth.service.ts    # Servicio para lógica de autenticación
│   │   └── barcodeService.ts  # Servicio para generación de códigos
│   ├── utils/               # Utilidades y helpers
│   │   ├── errors.ts          # Sistema de errores tipificados
│   │   ├── logger.ts          # Configuración de logging (Winston)
│   │   └── cache.ts           # Módulo de caché en memoria (temporal)
│   ├── __tests__/           # Directorios de pruebas (distribuidos)
│   ├── config.ts            # Configuración principal de la app
│   ├── server-config.ts     # Configuración del servidor HTTP/HTTPS
│   ├── custom-types.d.ts    # Definiciones de tipos personalizados
│   └── index.ts             # Punto de entrada principal de la aplicación
├── certs/                   # Certificados SSL (si se usan)
├── logs/                    # Logs de la aplicación (rotados)
│   ├── combined.log         # Logs combinados
│   └── error.log            # Solo logs de errores
├── .env                     # Variables de entorno (¡NO incluir en Git!)
├── .gitignore               # Archivos ignorados por Git
├── jest.config.js           # Configuración de Jest para tests
├── tsconfig.json            # Configuración de TypeScript
├── package.json             # Dependencias y scripts
└── package-lock.json        # Lockfile de dependencias
```

## Características

- API Gateway con Express.
- **Base de Datos:** Persistencia con **PostgreSQL** gestionada mediante **Prisma ORM**.
- **Autenticación:** Sistema robusto con Passport (JWT, Local, API Key).
- **Generación de Códigos:** Orquestación de llamadas a servicio externo en Rust.
- **Seguridad:** Helmet, Rate Limiting, Validación (express-validator), XSS Clean, CORS seguro, HTTPS opcional.
- **Manejo de Errores:** Sistema tipificado con `AppError` y subclases, manejo centralizado.
- **Logging:** Estructurado con Winston (JSON a archivo, coloreado a consola), niveles configurables, rotación de archivos.
- **Monitoreo Básico:** Endpoint `/health` (estado propio y de Rust), Endpoint `/metrics` (estadísticas de caché en memoria - **tiempos estimados**).
- **Optimización:** Compresión de respuestas, Caché en memoria (MVP, **ver mejoras**), Headers HTTP Cache-Control.
- **Desarrollo:** TypeScript, Configuración basada en `.env`, Scripts npm para build/dev/test/seed.

## Sistema de Caché (MVP)

- Implementa un caché simple en memoria (`utils/cache.ts`) para las respuestas de `/generate`.
- **Limitaciones:** No persistente, sin límite de tamaño, solo TTL.
- **Mejora Planeada:** Migrar a **Redis** para mayor robustez y escalabilidad (ver `Codex.md`).
- El endpoint `/metrics` refleja las estadísticas (hits, misses, tamaño) de este caché en memoria. Los tiempos reportados son **estimados/placeholders**.

## Infraestructura de Testing

- Framework: **Jest** con `ts-jest` y `supertest`.
- **Comandos:** `npm test`, `npm run test:watch`, `npm run test:coverage`, etc. (ver `package.json`).
- **Estructura:** Los tests (`*.test.ts`) residen en directorios `__tests__/` junto al código que prueban (ej. `src/utils/__tests__/errors.test.ts`).

## Variables de Entorno (`.env`)

```
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

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

- **GET /**: Bienvenida.
- **GET /health**: Estado del sistema (propio y Rust).
- **GET /metrics**: Estadísticas del caché en memoria (hits, misses, tamaño).
- **POST /api/auth/register**: Registrar usuario.
- **POST /api/auth/login**: Iniciar sesión (devuelve JWT).
- **POST /api/auth/refresh**: Refrescar JWT.
- **GET /api/auth/me**: Obtener datos del usuario autenticado (JWT/API Key).
- **POST /api/auth/api-key**: Generar/Regenerar API Key para el usuario autenticado.
- **POST /generate**: Generar código de barras (requiere `barcode_type`, `data`, `options?`).
- **POST /generator**: Alias de `/generate`.

(Consultar `src/routes/` y `src/index.ts` para detalles y rutas protegidas adicionales).

## Próximos Pasos / Mejoras Pendientes (Resumen)

- **Base de Datos:** Asegurar configuración y conexión correcta a PostgreSQL.
- **API Keys:** Revisar/optimizar estrategia de búsqueda `findByApiKey` (actualmente ineficiente).
- **Caché:** Migrar de caché en memoria a Redis.
- **Métricas:** Implementar medición real de tiempos o eliminar estimados.
- **IDs:** Usar UUIDs para IDs de usuario.
- **Seguridad Logs:** Filtrar/enmascarar datos sensibles en logs.
- **Documentación API:** Generar documentación OpenAPI/Swagger.
- **Testing:** Ampliar cobertura de tests.
- **Organización Rutas:** Mover endpoints de `index.ts` a `src/routes/`.

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
- `middleware/__tests__/` - Tests específicos para middleware
  - `errorHandler.test.ts` - Tests para middleware de manejo de errores
- `utils/__tests__/` - Tests de utilidades y helpers
  - `errors.test.ts` - Tests para el sistema de errores

### Configuración

La configuración de Jest se encuentra en `jest.config.js`, con características como:

- Reporte de cobertura (coverage)
- Compatibilidad con TypeScript mediante ts-jest
- Configuración de tiempo de espera (timeout) para tests asíncronos
- Mock de servicios externos como `fetch`
- Setup global para todos los tests

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
- **GET /metrics** - Métricas detalladas del sistema, incluye:
  - Estadísticas de caché (hits, misses, hit rate)
  - Métricas por tipo de código de barras
  - Tiempos de respuesta estimados
  - Tamaño actual del caché
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
    "context": { /* Información adicional */ }
  }
}
```

Los códigos de error posibles incluyen:
- `VALIDATION_ERROR` - Error en los datos de entrada
- `AUTHENTICATION_ERROR` - Error de autenticación
- `AUTHORIZATION_ERROR` - Error de autorización
- `RESOURCE_NOT_FOUND` - Recurso no encontrado
- `INTERNAL_ERROR` - Error interno del servidor 