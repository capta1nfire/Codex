# Rust Barcode Generator Service

Este directorio contiene el servicio de alto rendimiento desarrollado en Rust con Axum, responsable de la generación real de los códigos de barras y QR para la plataforma Codex.

## Funcionalidades

- Generación de múltiples tipos de códigos (QR, Code128, EAN, UPC, PDF417, etc.) utilizando la librería `rxing`.
- Exposición de una API web simple a través de Axum.
- Caché interno en memoria (DashMap) para optimizar solicitudes repetidas.
- Endpoint `/generate` para la generación de códigos.
- Endpoint `/status` para obtener información del servicio (versión, tipos soportados, uptime).
- Endpoint `/analytics/performance` para métricas detalladas de rendimiento y caché.
- Logging estructurado con `tracing`.

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