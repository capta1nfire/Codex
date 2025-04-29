# Rust Barcode Generator Service

Este directorio contiene el servicio de alto rendimiento desarrollado en Rust con Axum, responsable de la generación real de los códigos de barras y QR para la plataforma Codex.

## Funcionalidades

- Generación de múltiples tipos de códigos (QR, Code128, EAN, UPC, PDF417, etc.) utilizando la librería `rxing`.
- Exposición de una API web simple a través de Axum.
- Caché interno en memoria (DashMap) para optimizar solicitudes repetidas.
- Logging estructurado con `tracing`.

## Estructura del Código (`src/`)

- **`main.rs`**: Punto de entrada principal. Configura el servidor Axum, define las rutas (`/generate`, `/status`, `/analytics/performance`), implementa los handlers de las rutas, y maneja el caché en memoria (DashMap). Llama a funciones de `lib.rs` para la generación y validación.
- **`lib.rs`**: Contiene la lógica central de generación. Incluye la función `generate_code` (que interactúa con la librería `rxing` y prepara los hints) y la función `manual_bit_matrix_to_svg` (que convierte la matriz de bits resultante en una cadena SVG personalizada).
- **`validators.rs`**: Contiene funciones específicas para validar los datos de entrada (`data`) según el tipo de código (`barcode_type`) solicitado, asegurando que sean compatibles con la librería `rxing`.

## Endpoints Expuestos

El servicio expone los siguientes endpoints:

- **`POST /generate`**: Endpoint principal para la generación de códigos.
  - **Request Body**: JSON con `barcode_type` (string), `data` (string), y opcionalmente `options` (objeto con `scale`, `margin`, `ecc_level` para QR).
  - **Response**: SVG del código generado (Content-Type: `image/svg+xml`) o un error JSON.
- **`GET /status`**: Devuelve información básica del servicio.
  - **Response**: JSON con `service_name`, `version`, `status` ("OK"), `uptime` (en segundos), y `supported_types` (lista de tipos de códigos soportados).
- **`GET /analytics/performance`**: Proporciona métricas detalladas sobre el rendimiento del caché interno.
  - **Response**: JSON con estadísticas globales y por tipo de código (total requests, cache hits, cache misses, hit rate, average generation time con/sin caché).

## Uso (Desarrollo)

Asegúrate de tener Rust y Cargo instalados.

```bash
# Navegar al directorio
cd rust_generator

# Compilar el proyecto
cargo build

# Ejecutar el servicio (modo desarrollo)
cargo run

# Ejecutar pruebas
cargo test

# Verificar linting (Clippy)
cargo clippy

# Verificar/Aplicar formato (Rustfmt)
cargo fmt --check
cargo fmt
```

## Documentación Adicional

- [API_DOCS.md](API_DOCS.md): Detalles completos de los endpoints de la API.
- [README Raíz](../README.md): Visión general del proyecto Codex. 