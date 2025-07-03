# Rust Generator Service - High-Performance Barcode Engine

## 1. Propósito del Servicio

El Rust Generator es el motor de generación de alto rendimiento de CODEX, construido con Rust y Axum. Es responsable de la generación real de todos los códigos QR y códigos de barras, proporcionando salida SVG optimizada con caché en memoria para máximo rendimiento.

### Responsabilidades Principales
- Generación de códigos QR con el motor v2 de alto rendimiento
- Generación de 14+ tipos de códigos de barras lineales y matriciales
- Validación específica por tipo de código
- Caché en memoria con DashMap para respuestas ultrarrápidas
- Salida SVG optimizada para escalabilidad
- Métricas de rendimiento y analytics

### Lo que NO hace este servicio
- Autenticación o autorización (delegado al backend)
- Almacenamiento persistente de códigos generados
- Gestión de usuarios o sesiones
- Procesamiento de pagos o lógica de negocio

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| Framework | Axum | 0.6 | Framework web async de alto rendimiento |
| Runtime | Tokio | 1.x | Runtime async multihilo |
| QR Engine | qrcodegen | 1.8 | Motor QR v2 optimizado |
| Barcode Lib | rxing | 0.7.1 | Biblioteca de códigos legacy |
| SVG | resvg + tiny-skia | 0.40 / 0.11 | Renderizado SVG y rasterización |
| Caché | DashMap | 5.5.3 | HashMap concurrente en memoria |
| Paralelo | Rayon | 1.8 | Paralelización de tareas |
| Logging | tracing | 0.1.40 | Logging estructurado async |

### Dependencias Críticas
- **Tokio**: Runtime async fundamental
- **qrcodegen**: Motor QR v2 para performance
- **DashMap**: Caché crítico para rendimiento

---

## 3. Cómo Ejecutar y Probar

### Requisitos Previos
```bash
# Versiones requeridas
rustc --version  # >= 1.70.0
cargo --version  # >= 1.70.0
```

### Instalación
```bash
cd rust_generator
cargo build
```

### Configuración
El servicio no requiere configuración externa. Puerto hardcoded: 3002.

### Ejecución
```bash
# Desarrollo
cargo run

# Build optimizado
cargo build --release

# Ejecutar release
./target/release/rust_generator

# Con PM2 (RECOMENDADO)
pm2 start ecosystem.config.js --only codex-rust
```

### Testing
```bash
# Ejecutar tests
cargo test

# Con output verbose
cargo test -- --nocapture

# Verificar código
cargo clippy

# Formatear código
cargo fmt
```

---

## 4. Contrato de API (Endpoints principales)

### Base URL
- Desarrollo: `http://localhost:3002`
- Producción: `[URL_PRODUCCION]:3002`

### Endpoints Públicos

#### POST `/generate`
**Propósito**: Generar cualquier tipo de código de barras

**Request**:
```json
{
  "barcode_type": "qrcode",
  "data": "https://example.com",
  "options": {
    "scale": 4,
    "error_correction_level": "M"
  }
}
```

**Response** (200 OK):
```xml
<svg xmlns="http://www.w3.org/2000/svg" ...>
  <!-- SVG content -->
</svg>
```

**Response** (400 Bad Request):
```json
{
  "error": "Invalid barcode type"
}
```

#### POST `/api/v3/qr/generate` 🆕
**Propósito**: Generar QR con datos estructurados (QR v3)

**Request**:
```json
{
  "data": "https://example.com",
  "options": {
    "error_correction": "H"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "path_data": "M4 4h1v1H4zM5 4h1v1H5z...",
    "total_modules": 33,
    "data_modules": 25,
    "version": 2,
    "error_correction": "H",
    "metadata": {
      "generation_time_ms": 15,
      "quiet_zone": 4,
      "content_hash": "a7b9c3..."
    }
  },
  "metadata": {
    "engine_version": "3.0.0",
    "cached": false,
    "processing_time_ms": 20
  }
}
```

#### GET `/status`
**Propósito**: Información del servicio y capacidades

**Response**:
```json
{
  "service": "rust_generator",
  "version": "0.1.0",
  "supported_types": [
    "qrcode", "code128", "ean13", "datamatrix", ...
  ],
  "uptime": 3600
}
```

#### GET `/analytics/performance`
**Propósito**: Métricas de rendimiento del caché

**Response**:
```json
{
  "cache_stats": {
    "total_requests": 10000,
    "cache_hits": 7000,
    "cache_misses": 3000,
    "hit_rate": 0.7
  },
  "performance_by_type": {
    "qrcode": {
      "avg_generation_time_ms": 15,
      "cache_hit_rate": 0.75
    }
  }
}
```

### Tipos de Códigos Soportados
```rust
// Códigos 2D (Matriciales)
- qrcode (aliases: qr, qr-code, qr_code)
- datamatrix
- aztec
- pdf417

// Códigos 1D (Lineales)
- code128
- ean13, ean8
- upca, upce
- code39, code93
- codabar
- itf14
```

---

## 5. Variables de Entorno

El servicio actualmente no utiliza variables de entorno. Configuración hardcoded:
- **Puerto**: 3002
- **Host**: 0.0.0.0
- **Workers**: Basado en CPUs disponibles

Para modificar configuración, editar `src/main.rs`.

---

## 6. Comunicación con Otros Servicios

### Servicios de los que Depende
- Ninguno (servicio autónomo)

### Servicios que Dependen de Este
- **Backend**: Consume endpoint `/generate` - Puerto `3004`
  - Timeout configurado: 5000ms
  - Retry policy en backend

---

## 7. Troubleshooting Común

### Problema: "Connection refused" desde backend
**Síntoma**: Backend no puede conectar al puerto 3002
**Solución**: 
1. Verificar que el servicio está corriendo: `pm2 status codex-rust`
2. Confirmar puerto: `lsof -i :3002`
3. Revisar logs: `pm2 logs codex-rust`

### Problema: Timeout en códigos QR complejos
**Síntoma**: Timeout para QR con mucho contenido
**Solución**:
1. Verificar longitud de datos (máx recomendado: 4000 chars)
2. Reducir nivel de corrección de errores (usar 'L' en vez de 'H')
3. Considerar comprimir datos antes de codificar

### Problema: SVG inválido o corrupto
**Síntoma**: Frontend no puede renderizar el SVG
**Solución**:
1. Validar tipo de código en request
2. Verificar caracteres especiales en datos
3. Revisar logs para errores de generación

---

## 8. Mantenimiento y Monitoreo

### Logs
- Ubicación: `logs/rust.log` (vía PM2)
- Formato: Estructurado con tracing
- Nivel: INFO en producción

### Métricas Clave
- **Cache Hit Rate**: Meta > 70%
- **Generation Time**: <50ms para QR estándar
- **Memory Usage**: Monitorear DashMap size
- **CPU Usage**: Debe escalar con cores

### Comandos Útiles
```bash
# Ver logs en tiempo real
pm2 logs codex-rust

# Monitorear recursos
pm2 monit codex-rust

# Reiniciar servicio
pm2 restart codex-rust

# Ver métricas de performance
curl http://localhost:3002/analytics/performance
```

### Optimizaciones Implementadas
- **DashMap Cache**: Respuestas instantáneas para códigos repetidos
- **Paralelización**: Usa Rayon para procesamiento paralelo
- **SVG Directo**: Sin conversiones innecesarias
- **Validación Temprana**: Rechaza inputs inválidos rápidamente

### Roadmap QR Engine v2
- ✅ Phase 1-4: Motor base implementado
- ⏳ Phase 5: Integración de gradientes
- 🔮 Futuro: WebAssembly para generación client-side