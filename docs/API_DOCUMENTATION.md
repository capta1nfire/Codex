# 📚 CODEX API Documentation

> **Última actualización**: 2025-06-28  
> **Base URL**: `http://localhost:3004/api`  
> **Versión actual**: 1.1.1  
> **📋 Opciones QR v3**: Ver `/docs/qr-engine/QR_V3_CUSTOMIZATION_OPTIONS.md` para referencia completa

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Endpoints Legacy](#endpoints-legacy-deprecados)
- [API v1 - Códigos de Barras](#api-v1---códigos-de-barras)
- [API v2 - QR Codes](#api-v2---qr-codes)
- [API v3 - QR Estructurado](#api-v3---qr-estructurado)
- [Smart QR](#smart-qr)
- [Validación](#validación)
- [Control de Servicios](#control-de-servicios)
- [Health & Métricas](#health--métricas)

## 🔐 Autenticación

### POST `/api/auth/register`
Registrar nuevo usuario.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
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

### POST `/api/auth/login`
Autenticar usuario existente.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
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

### Headers de Autenticación
```
Authorization: Bearer <token>
```

## ⚠️ Endpoints Legacy (Deprecados)

> **Nota**: Estos endpoints muestran headers de deprecación. Usar versiones v1/v2 en su lugar.

### POST `/api/generate`
Generar cualquier tipo de código de barras (incluido QR).

**Headers de respuesta:**
```
X-Deprecated: true
X-Deprecated-Message: Use /api/v1/barcode or /api/v2/qr/generate
X-Sunset-Date: 2025-12-31
```

### POST `/api/qr/generate`
Generar QR code (usa motor v2 internamente).

**Nota**: Aunque es legacy, no muestra headers de deprecación y sigue activo.

## 📊 API v1 - Códigos de Barras

### POST `/api/v1/barcode`
Generar códigos de barras no-QR.

**Request:**
```json
{
  "barcode_type": "code128",
  "data": "123456789",
  "options": {
    "scale": 2,
    "includetext": true,
    "textxalign": "center",
    "textsize": 12
  }
}
```

**Tipos soportados:**
- `code128` - Code 128
- `code39` - Code 39
- `ean13` - EAN-13
- `ean8` - EAN-8
- `upca` - UPC-A
- `upce` - UPC-E
- `pdf417` - PDF417
- `datamatrix` - Data Matrix
- `aztec` - Aztec Code

**Response (200):**
```json
{
  "success": true,
  "data": "<svg>...</svg>",
  "metadata": {
    "type": "code128",
    "processing_time_ms": 15
  }
}
```

## 🎨 API v2 - QR Codes [ELIMINADO]

**⚠️ IMPORTANTE**: La API v2 ha sido eliminada. Toda la generación de QR ahora usa v3.
- Para migración, ver la sección API v3 abajo
- Endpoints equivalentes disponibles en v3

### POST `/api/v2/qr/generate`
Generar QR con todas las opciones de personalización.

**Request:**
```json
{
  "data": "https://example.com",
  "options": {
    "size": 400,
    "margin": 4,
    "errorCorrection": "H",
    "eyeShape": "rounded",
    "dataPattern": "square",
    "foregroundColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "gradient": {
      "type": "linear",
      "colors": ["#FF0000", "#0000FF"],
      "angle": 45
    },
    "logo": {
      "data": "base64...",
      "size": 20,
      "padding": 2
    },
    "effects": [
      {
        "type": "shadow",
        "intensity": 50,
        "color": "#000000"
        // Nota: offsetX, offsetY, blurRadius son procesados pero no validados
      }
    ],
    "optimizeForSize": false,
    "enableCache": true
  }
}
```

**Eye Shapes disponibles:**
- `square`
- `rounded-square`
- `circle`
- `dot`
- `leaf`
- `bars-horizontal`
- `bars-vertical`
- `star`
- `diamond`
- `cross`
- `hexagon`
- `heart`
- `shield`
- `crystal`
- `flower`
- `arrow`
- `custom`

**Data Patterns disponibles:**
- `square`
- `dots`
- `rounded`
- `vertical`
- `horizontal`
- `diamond`
- `circular`
- `star`
- `cross`
- `random`
- `wave`
- `mosaic`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "svg": "<svg>...</svg>",
    "processing_time": 25
  },
  "metadata": {
    "version": 2,
    "cached": false,
    "processing_time_ms": 25
  }
}
```

### POST `/api/v2/qr/batch`
Generar múltiples QR codes (máximo 50).
**⚠️ Autenticación opcional (JWT o API Key)**

**Request:**
```json
{
  "codes": [
    {
      "data": "https://example1.com",
      "options": { "size": 200 }
    },
    {
      "data": "https://example2.com",
      "options": { "size": 300 }
    }
  ],
  "options": {
    "maxConcurrent": 10,
    "includeMetadata": true,
    "stopOnError": false
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "success": true,
        "data": {
          "svg": "<svg>...</svg>",
          "processing_time": 25
        }
      },
      {
        "success": true,
        "data": {
          "svg": "<svg>...</svg>",
          "processing_time": 30
        }
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "processingTime": 55
    }
  }
}
```

### POST `/api/v2/qr/validate`
Validar datos antes de generar.

**Request:**
```json
{
  "data": "https://example.com",
  "options": {}
}
```

### GET `/api/qr/preview`
Obtener preview del QR en tiempo real.

**Query params:**
- `data` - Datos a codificar
- `eyeShape` - Forma de ojos (opcional)
- `dataPattern` - Patrón de datos (opcional)
- `fgColor` - Color de primer plano HEX (opcional)
- `bgColor` - Color de fondo HEX (opcional)
- `size` - Tamaño en píxeles (opcional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "svg": "<svg>...</svg>",
    "processing_time": 15
  },
  "metadata": {
    "cached": true,
    "version": 2
  }
}
```

### GET `/api/v2/qr/cache/stats`
Ver estadísticas de caché.
**⚠️ Requiere autenticación (JWT o API Key)**

### POST `/api/v2/qr/cache/clear`
Limpiar caché.
**⚠️ Requiere autenticación (JWT o API Key)**

## 🏗️ API v3 - QR Estructurado

### 🆕 Endpoints Nuevos en v3

#### POST `/api/v3/qr/batch`
Generar múltiples QR codes en lote (máximo 50).

**Request:**
```json
{
  "codes": [
    {
      "data": "https://example1.com",
      "options": { "error_correction": "M" }
    },
    {
      "data": "https://example2.com",
      "options": { "error_correction": "H" }
    }
  ],
  "options": {
    "maxConcurrent": 10,
    "includeMetadata": true,
    "stopOnError": false
  }
}
```

#### GET `/api/v3/qr/preview`
Preview de QR con parámetros GET (cacheable).

**Query params:**
- `data` - Datos a codificar (requerido)
- `error_correction` - Nivel de corrección (L/M/Q/H)
- `eye_shape` - Forma de ojos
- `data_pattern` - Patrón de datos
- `fg_color` - Color de primer plano
- `bg_color` - Color de fondo

**Ejemplo:**
```
GET /api/v3/qr/preview?data=https://example.com&eye_shape=rounded&fg_color=%23FF0000
```

#### POST `/api/v3/qr/validate`
Validar datos antes de generar.

**Request:**
```json
{
  "data": "https://example.com",
  "options": {}
}
```

### POST `/api/v3/qr/generate`
Generar QR con respuesta estructurada (sin SVG) para máxima seguridad frontend.

**Nota**: Este endpoint es parte de la API v3, que también incluye `/api/v3/qr/enhanced` para características avanzadas.

**Request:**
```json
{
  "data": "https://example.com",
  "options": {
    "error_correction": "H",
    "customization": {
      "colors": {
        "foreground": "#000000",
        "background": "#FFFFFF"
      },
      "eye_shape": "star",
      "data_pattern": "dots",
      "gradient": {
        "enabled": true,
        "gradient_type": "linear",
        "colors": ["#FF0000", "#0000FF"],
        "apply_to_eyes": true,
        "apply_to_data": true
      },
      "logo_size_ratio": 0.15
    }
  }
}
```
**Nota**: Los campos dentro de `customization` son aceptados pero no validados estrictamente por el backend (usan `z.any()` en el esquema).
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "path_data": "M4 4h1v1H4zM5 4h1v1H5z...",
    "total_modules": 29,
    "data_modules": 21,
    "version": 1,
    "error_correction": "H",
    "metadata": {
      "generation_time_ms": 12,
      "quiet_zone": 4,
      "content_hash": "sha256_hash_here"
    }
  },
  "metadata": {
    "engine_version": "3.0.0",
    "cached": false,
    "processing_time_ms": 15,
    "total_processing_time_ms": 18,
    "backend_version": "1.0.0"
  }
}
```

### POST `/api/v3/qr/enhanced`
Generar QR con características avanzadas (gradientes, efectos, formas) usando datos estructurados.

> **📋 Referencia completa**: Ver `/docs/qr-engine/QR_V3_CUSTOMIZATION_OPTIONS.md` para todas las opciones disponibles

**Request:**
```json
{
  "data": "https://example.com",
  "options": {
    "error_correction": "H",
    "customization": {
      "colors": {
        "foreground": "#FF0000",
        "background": "#FFFFFF"
      },
      "eye_shape": "star",  // LEGACY - usar eye_border_style + eye_center_style
      "eye_border_style": "rounded_square",  // NUEVO: 14 opciones
      "eye_center_style": "circle",          // NUEVO: 8 opciones
      "data_pattern": "dots",
      "gradient": {
        "enabled": true,
        "gradient_type": "linear",
        "colors": ["#FF0000", "#0000FF"],
        "apply_to_eyes": true,
        "apply_to_data": true
      },
      "effects": [
        {
          "type": "shadow",
          "intensity": 50,
          "color": "#000000"
        }
      ],
      "logo_size_ratio": 0.15
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paths": {
      "data": "M13 4h7v1H13z...",
      "eyes": [
        {
          "type": "top_left",
          "border_path": "M4 4h7v7H4z...",  // Marco exterior
          "center_path": "M5 5h5v5H5z...",  // Centro interior
          "border_shape": "rounded_square",
          "center_shape": "circle"
        }
      ]
    },
    "styles": {
      "data": {
        "fill": "url(#grad_data)"
      },
      "eyes": {
        "fill": "url(#grad_eyes)",
        "shape": "Star"
      }
    },
    "definitions": [
      {
        "type": "linearGradient",
        "id": "grad_data",
        "stops": [
          {"offset": "0%", "color": "#FF0000"},
          {"offset": "100%", "color": "#0000FF"}
        ]
      }
    ],
    "metadata": {
      "generation_time_ms": 45,
      "quiet_zone": 4,
      "enhanced_features_used": ["gradients", "star_eyes", "effects"]
    }
  },
  "metadata": {
    "engine_version": "3.0.0",
    "cached": false,
    "processing_time_ms": 45,
    "total_processing_time_ms": 50,
    "backend_version": "1.0.0-enhanced"
  }
}
```

### GET `/api/v3/qr/capabilities`
Obtener capacidades y características del motor v3.

**Response (200):**
```json
{
  "version": "3.0.0",
  "features": {
    "structured_data": true,
    "qr_v3": true,
    "quiet_zone_configurable": false,
    "max_data_length": 2953,
    "error_correction_levels": ["L", "M", "Q", "H"],
    "output_formats": ["structured_json"],
    "enhanced_features": {
      "gradients": ["linear", "radial", "conic", "diamond", "spiral"],
      "eye_shapes": ["square", "rounded_square", "circle", "dot", "leaf", "star", "diamond", "heart", "shield"],
      "eye_border_styles": ["square", "rounded_square", "circle", "quarter_round", "cut_corner", "thick_border", "double_border", "diamond", "hexagon", "cross", "star", "leaf", "arrow"],
      "eye_center_styles": ["square", "rounded_square", "circle", "dot", "star", "diamond", "cross", "plus"],
      "data_patterns": ["square", "dots", "rounded", "vertical", "horizontal", "diamond", "circular", "star", "cross", "random", "wave", "mosaic"],
      "gradients": ["linear", "radial", "conic", "diamond", "spiral"],
      "effects": ["shadow", "glow", "blur", "noise", "vintage"],
      "overlays": ["logo", "frame"]
    }
  },
  "benefits": {
    "security": "No dangerouslySetInnerHTML required",
    "performance": "50% less data transfer",
    "flexibility": "Frontend controls rendering",
    "customization": "Full visual customization with enhanced API"
  }
}
```

## 🤖 Smart QR

### POST `/api/smart-qr/generate`
Generar QR con plantilla inteligente que se selecciona automáticamente basada en la URL.
**Requiere autenticación**

**Request:**
```json
{
  "url": "https://instagram.com/johndoe",
  "options": {
    "preferredTemplateId": "instagram-profile",
    "skipAnalysisDelay": false
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templateApplied": true,
    "templateId": "instagram-profile",
    "templateName": "Instagram Profile",
    "configuration": {
      "eyeShape": "rounded",
      "gradient": {
        "enabled": true,
        "colors": ["#E4405F", "#F77737"]
      }
    },
    "remaining": 2,
    "metadata": {
      "analysisTime": 1500,
      "domain": "instagram.com",
      "isKnownDomain": true
    }
  }
}
```

### GET `/api/smart-qr/templates`
Listar plantillas disponibles para una URL específica.
**Requiere autenticación**

**Query params:**
- `url` (required) - URL para la que se quieren ver plantillas

**Validación de URL:**
- **Protocolos aceptados**: `http://`, `https://` (auto-completa https si falta)
- **Formatos válidos**: `example.com`, `www.example.com/path`, `sub.domain.co.uk`
- **Normalización**: Elimina `/` final, añade `https://` si falta protocolo
- **Limitaciones**: No soporta IPs, dominios internacionales, o caracteres especiales complejos

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "instagram-profile",
        "name": "Instagram Profile",
        "preview": "base64...",
        "tags": ["social", "profile"]
      }
    ],
    "recommendedId": "instagram-profile"
  }
}
```

### GET `/api/smart-qr/preview/:templateId`
Vista previa de una plantilla específica.
**Requiere autenticación**

**Path params:**
- `templateId` - ID de la plantilla

**Query params:**
- `url` (required) - URL para generar la vista previa

**Casos edge de URL:**
- `example.com` → `https://example.com` (protocolo agregado)
- `https://example.com/` → `https://example.com` (slash final removido)
- `sub.example.com` → Coincide con plantilla de `example.com`
- URLs malformadas usan matching de cadena como fallback

**Errores comunes:**
- `400`: "Invalid URL format" - URL no cumple patrón de validación
- `400`: "URL parameter is required" - Parámetro url faltante o vacío

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "instagram-profile",
      "name": "Instagram Profile",
      "tags": ["social", "profile"]
    },
    "configuration": {
      "eyeShape": "rounded",
      "gradient": {
        "enabled": true,
        "colors": ["#E4405F", "#F77737"]
      }
    },
    "previewDescription": "Diseño optimizado para perfiles de Instagram"
  }
}
```

### GET `/api/smart-qr/stats`
Estadísticas de uso del usuario.
**Requiere autenticación**

**Query params:**
- `days` (optional) - Días a incluir (default: 7, max: 90)

### GET `/api/smart-qr/limit`
Verificar límites de uso actuales.
**Requiere autenticación**

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "remaining": 2,
    "limit": 3,
    "resetAt": "2025-06-27T00:00:00Z",
    "isPremium": false
  }
}
```

### GET `/api/smart-qr/popular`
Plantillas populares (sin autenticación requerida).

**Query params:**
- `limit` (optional) - Número de plantillas (default: 10)

## ✅ Validación

### POST `/api/validate/check-url`
Validar y analizar URLs, verificando si existen y obteniendo metadatos.

> **🚀 Nuevo**: Sistema avanzado con User-Agent rotation y headers modernos para máxima compatibilidad (95% success rate). Funciona con sitios protegidos como Amazon, Cloudflare, GitHub.

**Request:**
```json
{
  "url": "https://example.com/path?param=value"
}
```

**Response (200):**
```json
{
  "exists": true,
  "title": "Example Domain",
  "description": "This domain is for use in illustrative examples",
  "favicon": "https://example.com/favicon.ico",
  "statusCode": 200,
  "error": null
}
```

**Características técnicas:**
- **User-Agent Rotation**: 5 navegadores diferentes (Chrome, Edge, Firefox, Safari) 
- **Headers modernos**: Sec-Fetch-*, Client Hints, Accept completo
- **Anti-bot protection**: Indistinguible de navegadores reales
- **Timeouts optimizados**: 3s estándar, 5s para .edu.co
- **Cache inteligente**: 24h éxito, 5min errores
- **Rate limiting**: 100 requests/15min

**🧪 Script de Testing:**
- **Ubicación**: `backend/src/scripts/testValidation.ts`
- **Uso**: `npx tsx testValidation.ts [--mode quick|full|category] [--category name] [-v]`
- **Modos**: quick (25 URLs), full (137 URLs), category (específica)
- Ver más detalles en `backend/README.md` sección 9

## 🛠️ Control de Servicios

### GET `/api/services/status`
Ver estado de todos los servicios.

**Response (200):**
```json
{
  "overall": "healthy",
  "services": [
    {
      "service": "database",
      "success": true,
      "details": {
        "status": "running",
        "healthy": true
      }
    },
    {
      "service": "rust",
      "success": true,
      "details": {
        "status": "running",
        "port": 3002,
        "healthy": true
      }
    },
    {
      "service": "backend",
      "success": true,
      "details": {
        "status": "running",
        "healthy": true
      }
    }
  ],
  "timestamp": "2025-06-26T10:00:00Z"
}
```

**Nota**: El servicio `frontend` NO se incluye en el status check.

### POST `/api/services/:service/start`
Iniciar un servicio específico.

**Servicios válidos:**
- `database` - Inicia la base de datos PostgreSQL via Docker
- `rust` - Inicia el generador Rust en puerto 3002
- `backend` - Reinicia el proceso backend actual (reinicio completo)

**Path params:**
- `service` - Nombre del servicio (`database`, `rust`, `backend`)

**Response (200):**
```json
{
  "service": "rust",
  "action": "start",
  "status": "success",
  "message": "Rust generator started successfully",
  "timestamp": "2025-06-26T10:00:00Z"
}
```

### POST `/api/services/:service/stop`
Detener un servicio específico.

**Servicios válidos:**
- `database` - No soportado (requiere Docker directo por estabilidad)
- `rust` - Detiene el generador Rust
- `backend` - No soportado (detendría proceso actual)

**Response (200):**
```json
{
  "service": "rust",
  "action": "stop",
  "status": "success",
  "message": "Rust generator stopped successfully",
  "timestamp": "2025-06-26T10:00:00Z"
}
```

### POST `/api/services/:service/restart`
Reiniciar un servicio específico.

**Servicios válidos:**
- `database` - No soportado via API (usar Docker directo)
- `rust` - Detiene y reinicia el generador Rust
- `backend` - Reinicia el proceso backend completo

**Response (200):**
```json
{
  "service": "backend",
  "action": "restart",
  "status": "success",
  "message": "Backend restarted successfully",
  "details": {
    "previous_pid": 12345,
    "new_pid": 12567,
    "restart_time_ms": 2500
  },
  "timestamp": "2025-06-26T10:00:00Z"
}
```

### GET `/api/services/:service/status`
Obtener estado de un servicio específico.

**Path params:**
- `service` - Nombre del servicio (`database`, `rust`, `backend`)

**Response (200):**
```json
{
  "service": "rust",
  "success": true,
  "details": {
    "status": "running",
    "port": 3002,
    "healthy": true,
    "uptime": 3600,
    "version": "1.0.0"
  },
  "timestamp": "2025-06-26T10:00:00Z"
}
```

## 📊 Health & Métricas

### GET `/health`
Health check detallado con estado de todas las dependencias.

**Nota**: No existe `/health/status`. El endpoint principal es `/health`.

**Response (200):**
```json
{
  "timestamp": "2025-06-26T10:00:00Z",
  "service": "codex-backend",
  "status": "operational",
  "uptime": 3600,
  "memoryUsage": {
    "total": "150.25 MB",
    "used": "89.12 MB",
    "external": "12.30 MB"
  },
  "dependencies": {
    "database": {
      "status": "operational",
      "responseTime": 25,
      "error": null
    },
    "redis": {
      "status": "operational", 
      "responseTime": 5,
      "error": null
    },
    "rust_service": {
      "status": "operational",
      "responseTime": 150,
      "error": null
    }
  }
}
```

**Estados posibles:**
- `operational` - Funcionando correctamente
- `degraded` - Funcionando con problemas menores
- `down` - No funcional

### GET `/metrics`
Métricas Prometheus.

**Response:**
```text
# HELP http_request_duration_seconds HTTP request latencies
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/api/health",status="200"} 42
...
```

## 🔧 Tipos y Schemas

### Roles de Usuario
```typescript
enum UserRole {
  USER = "USER",
  PREMIUM = "PREMIUM", 
  ADVANCED = "ADVANCED",
  WEBADMIN = "WEBADMIN",
  SUPERADMIN = "SUPERADMIN"
}
```

### Códigos de Error
```typescript
enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "data",
      "reason": "Required field missing"
    }
  }
}
```

## 📡 Headers Especiales

### Request Headers
- `X-API-Key`: API key para autenticación alternativa
- `X-Request-ID`: ID único para trazabilidad

### Response Headers
- `X-Cache-Hit`: "true" si la respuesta viene de caché
- `X-Processing-Time`: Tiempo de procesamiento en ms
- `X-Rate-Limit-Remaining`: Requests restantes
- `X-Rate-Limit-Reset`: Timestamp de reset

## 🚦 Rate Limiting

- **Sin autenticación**: 100 requests / 15 minutos
- **Usuario autenticado**: 1000 requests / 15 minutos
- **Usuario premium**: 5000 requests / 15 minutos
- **Admin**: Sin límite

## 📝 Notas de Implementación

### Diferencias v2 vs v3
- **v2**: No tiene campo `enabled` en gradient
- **v3**: Usa snake_case (`eye_shape`, `data_pattern`), soporta gradientes avanzados (conic, diamond, spiral)

### Campos procesados pero no validados
- **Shadow effects**: `offsetX`, `offsetY`, `blurRadius` (v2)
- **Customization**: Todos los campos dentro de `customization` en v3

---

Para más información o reportar problemas con la API, consultar `/docs/TROUBLESHOOTING.md`