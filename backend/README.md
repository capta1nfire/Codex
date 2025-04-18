# Codex Backend

Este directorio contiene el API Gateway implementado en Node.js con Express, que gestiona las peticiones y orquesta los servicios del sistema Codex para la generación de códigos de barras y QR.

## Estructura del Proyecto

```
backend/
├── src/                       # Código fuente
│   ├── middleware/            # Middleware personalizado
│   │   └── errorHandler.ts    # Manejo centralizado de errores
│   ├── utils/                 # Utilidades y helpers
│   │   ├── errors.ts          # Sistema de errores tipificados
│   │   └── logger.ts          # Configuración de logging
│   ├── __tests__/             # Tests unitarios e integración
│   ├── custom-types.d.ts      # Definiciones de tipos personalizados
│   ├── test-error-handling.ts # Utilidad para probar manejo de errores
│   └── index.ts               # Punto de entrada principal
├── logs/                      # Logs de la aplicación
│   ├── combined.log           # Logs combinados (todos los niveles)
│   └── error.log              # Solo logs de errores
├── .env                       # Variables de entorno (no incluido en Git)
├── jest.config.js             # Configuración de Jest para tests
├── tsconfig.json              # Configuración de TypeScript
└── package.json               # Dependencias y scripts
```

## Características

- API Gateway implementado con Express para orquestar los servicios
- Seguridad reforzada mediante:
  - Helmet para configuración de headers HTTP
  - Express-rate-limit para protección contra ataques de fuerza bruta
  - Validación de entradas con express-validator
  - Sanitización XSS para prevenir inyección de scripts
- Sistema robusto de manejo de errores con códigos estandarizados
- Monitoreo de salud del sistema mediante endpoint `/health`
- Comunicación con el servicio de generación en Rust
- Sistema de logging estructurado con Winston
- Configuración CORS para comunicación segura entre servicios

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
   - Tests para el endpoint de generación de códigos

### Estructura de Tests

- `__tests__/` - Pruebas generales de la aplicación
  - `index.test.ts` - Tests para endpoints principales
  - `integration.test.ts` - Tests de integración
  - `health.test.ts` - Tests para el endpoint de salud
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

## Variables de Entorno

El backend requiere las siguientes variables de entorno en un archivo `.env`:

```
# Configuración del servidor
PORT=3001
HOST=0.0.0.0

# Configuración del servicio Rust
RUST_SERVICE_URL=http://localhost:3002

# Configuración de CORS
ALLOWED_ORIGINS=http://localhost:3000

# Configuración de logging
LOG_LEVEL=info

# Configuración de SSL/TLS (opcional)
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
```

## Endpoints

- **GET /** - Ruta de bienvenida
- **GET /health** - Estado del sistema y dependencias, incluye:
  - Estado del API Gateway
  - Estado del servicio Rust
  - Uptime del sistema
  - Uso de memoria
  - Detalles de la plataforma
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