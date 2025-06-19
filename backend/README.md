# Backend Service - CODEX API Gateway

## 1. Propósito del Servicio

El backend de CODEX es un API Gateway construido con Node.js y Express que actúa como el orquestador principal del sistema. Gestiona todas las solicitudes HTTP, implementa la seguridad y autenticación, y coordina la comunicación entre el frontend y el microservicio Rust de generación de códigos.

### Responsabilidades Principales
- Exponer y gestionar todos los endpoints de la API REST
- Autenticación y autorización (JWT, API Keys)
- Orquestar la generación de códigos QR/barras con el servicio Rust
- Implementar caché inteligente con Redis para optimizar rendimiento
- Gestionar datos de usuarios y perfiles con PostgreSQL
- Proveer seguridad (rate limiting, CORS, validación)
- Monitoreo y métricas del sistema

### Lo que NO hace este servicio
- Generación directa de códigos QR/barras (delegado a Rust)
- Renderizado de UI (responsabilidad del frontend)
- Procesamiento de imágenes pesado
- Almacenamiento de archivos estáticos

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| Runtime | Node.js + TypeScript | TS 5.8.2 | Runtime con tipado estático |
| Framework | Express | 4.21.2 | Framework HTTP minimalista |
| Base de Datos | PostgreSQL + Prisma | PG 15 / Prisma 6.6.0 | Persistencia y ORM |
| Caché | Redis | 4.7.0 | Caché de alta velocidad |
| Autenticación | Passport + JWT | 0.7.0 / 9.0.2 | Sistema de auth flexible |
| Seguridad | Helmet + bcrypt | 8.1.0 / 5.1.1 | Headers seguros y hashing |
| Monitoreo | Prometheus + Winston | 15.1.3 / 3.17.0 | Métricas y logging |
| Testing | Jest + Supertest | 29.7.0 / 7.1.0 | Testing unitario e integración |

### Dependencias Críticas
- **PostgreSQL**: Almacena todos los datos de usuarios y configuraciones
- **Redis**: Crítico para el rendimiento, cachea resultados de generación
- **Servicio Rust**: Sin él no hay generación de códigos (puerto 3002)

---

## 3. Cómo Ejecutar y Probar

### Requisitos Previos
```bash
# Versiones requeridas
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version # Para PostgreSQL y Redis
```

### Instalación
```bash
cd backend
npm install
```

### Configuración
1. Copiar `.env.example` a `.env`
2. Configurar las variables requeridas (ver sección 5)
3. Asegurar que PostgreSQL y Redis están corriendo:
```bash
# Con Docker Compose (recomendado)
docker-compose up -d postgres redis
```

### Ejecución
```bash
# Desarrollo con hot-reload
npm run dev

# Build para producción
npm run build

# Producción
npm start

# Con PM2 (RECOMENDADO)
pm2 start ecosystem.config.js --only codex-backend
```

### Testing
```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch

# Solo unitarias
npm run test:unit

# Solo integración
npm run test:integration
```

---

## 4. Contrato de API (Endpoints principales)

### Base URL
- Desarrollo: `http://localhost:3004`
- Producción: `[URL_PRODUCCION]`

### Endpoints Públicos

#### POST `/api/v2/qr/generate`
**Propósito**: Generar códigos QR con el motor v2 de alto rendimiento

**Request**:
```json
{
  "data": "https://example.com",
  "options": {
    "size": 400,
    "errorCorrection": "M",
    "margin": 4,
    "darkColor": "#000000",
    "lightColor": "#FFFFFF",
    "gradient": {
      "type": "linear",
      "colors": ["#000000", "#666666"]
    }
  }
}
```

**Response** (200 OK):
```json
{
  "svg": "<svg>...</svg>",
  "generatedAt": "2025-06-19T10:00:00Z"
}
```

#### POST `/api/v1/barcode`
**Propósito**: Generar cualquier tipo de código de barras

**Request**:
```json
{
  "barcode_type": "code128",
  "data": "123456789",
  "options": {
    "scale": 2,
    "includetext": true
  }
}
```

#### POST `/api/auth/register`
**Propósito**: Registrar nuevo usuario

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/api/auth/login`
**Propósito**: Autenticar usuario

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Tipos Compartidos
```typescript
// Tipos que otros servicios necesitan conocer
interface User {
  id: string;
  email: string;
  role: 'USER' | 'PREMIUM' | 'WEBADMIN' | 'SUPERADMIN';
}

interface GenerateOptions {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  gradient?: GradientOptions;
}
```

---

## 5. Variables de Entorno

### Requeridas
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `3004` |
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://codex:pass@localhost:5432/codexdb` |
| `REDIS_URL` | URL de conexión Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Secreto para firmar JWT | `your-secret-key` |
| `RUST_SERVICE_URL` | URL del servicio Rust | `http://localhost:3002/generate` |

### Opcionales
| Variable | Descripción | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Nivel de logs | `info` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `ALLOWED_ORIGINS` | CORS origins permitidos | `http://localhost:3000` |
| `RATE_LIMIT_MAX` | Requests por ventana | `100` |
| `CACHE_MAX_AGE` | TTL del caché en segundos | `300` |

---

## 6. Comunicación con Otros Servicios

### Servicios de los que Depende
- **PostgreSQL**: Base de datos principal - Puerto `5432`
- **Redis**: Sistema de caché - Puerto `6379`
- **Rust Generator**: Motor de generación - Puerto `3002`

### Servicios que Dependen de Este
- **Frontend**: Consume toda la API - Endpoints `/api/*`

---

## 7. Troubleshooting Común

### Problema: "Connection refused" al iniciar
**Síntoma**: Error de conexión a PostgreSQL o Redis
**Solución**: 
1. Verificar que Docker esté corriendo: `docker ps`
2. Iniciar servicios: `docker-compose up -d postgres redis`
3. Verificar puertos: `lsof -i :5432` y `lsof -i :6379`

### Problema: "Invalid token" en requests autenticados
**Síntoma**: 401 Unauthorized en endpoints protegidos
**Solución**: 
1. Verificar que JWT_SECRET coincide en todas las instancias
2. Revisar expiración del token (1h por defecto)
3. Asegurar header: `Authorization: Bearer <token>`

### Problema: Timeout en generación de códigos
**Síntoma**: 504 Gateway Timeout
**Solución**:
1. Verificar que Rust service está corriendo: `pm2 status codex-rust`
2. Revisar logs: `pm2 logs codex-rust --err`
3. Aumentar `RUST_SERVICE_TIMEOUT_MS` si necesario

---

## 8. Mantenimiento y Monitoreo

### Logs
- Ubicación: `logs/backend.log` y `logs/backend-error.log`
- Rotación: Diaria, máximo 14 días
- Formato: JSON estructurado con Winston

### Métricas Clave
- `http_request_duration_seconds`: Latencia de endpoints
- `cache_hit_ratio`: Efectividad del caché
- `api_requests_total`: Volumen de requests
- `generation_errors_total`: Errores en generación

### Comandos Útiles
```bash
# Ver logs en tiempo real
pm2 logs codex-backend

# Ver estado y recursos
pm2 monit codex-backend

# Reiniciar con zero-downtime
pm2 reload codex-backend

# Ver métricas Prometheus
curl http://localhost:3004/metrics
```

### Endpoints de Salud
- `/health` - Health check simple
- `/health/detailed` - Health con estado de dependencias
- `/metrics` - Métricas Prometheus