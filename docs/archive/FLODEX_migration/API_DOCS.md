# Documentación de la API del Generador de Códigos de Barras (Rust)

API para generar diferentes tipos de códigos de barras y QR en formato SVG.

## Endpoints disponibles

### GET /

Verificación básica de que el servicio está funcionando.

**Respuesta**: Texto plano confirmando que el servicio está activo.

### GET /health

Endpoint para health checks, útil para balanceadores de carga y monitoreo.

**Respuesta**:
```json
{
  "status": "ok"
}
```

### GET /status

Información detallada sobre el estado del servicio.

**Respuesta**:
```json
{
  "status": "operational",
  "version": "0.1.0",
  "supported_types": ["qr", "qrcode", "code128", "pdf417", "datamatrix", "ean13", "ean8", "upca", "upce", "code39", "code93", "aztec", "codabar"],
  "memory_usage_mb": null,
  "uptime_seconds": 3600,
  "timestamp": "2025-04-07T21:22:34.243332-07:00"
}
```

### POST /generate

Genera un código de barras según los parámetros especificados.

**Solicitud**:
```json
{
  "barcode_type": "qrcode",
  "data": "https://ejemplo.com",
  "options": {
    "scale": 3,
    "error_correction_level": "M"
  }
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "svgString": "<svg viewBox=\"0 0 33 33\"...></svg>"
}
```

**Respuesta de error**:
```json
{
  "success": false,
  "error": "Mensaje de error",
  "suggestion": "Sugerencia para solucionar el problema",
  "code": "CÓDIGO_ERROR"
}
```

## Tipos de códigos soportados

| Tipo | Variantes aceptadas |
|------|---------------------|
| QR Code | `qr`, `qrcode`, `qr-code`, `qr_code` |
| Code 128 | `code128`, `code-128`, `code_128`, `code 128` |
| PDF417 | `pdf417`, `pdf-417`, `pdf_417`, `pdf 417` |
| DataMatrix | `datamatrix`, `data-matrix`, `data_matrix`, `data matrix` |
| EAN-13 | `ean13`, `ean-13`, `ean_13`, `ean 13` |
| EAN-8 | `ean8`, `ean-8`, `ean_8`, `ean 8` |
| UPC-A | `upca`, `upc-a`, `upc_a`, `upc a` |
| UPC-E | `upce`, `upc-e`, `upc_e`, `upc e` |
| Code 39 | `code39`, `code-39`, `code_39`, `code 39` |
| Code 93 | `code93`, `code-93`, `code_93`, `code 93` |
| Aztec | `aztec` |
| Codabar | `codabar` |

## Opciones disponibles

| Opción | Descripción | Valores aceptados | Default |
|--------|-------------|-------------------|---------|
| `scale` | Factor de escala del código generado | Entero positivo (1-10) | 3 |
| `error_correction_level` | Nivel de corrección de errores para QR Code | L (bajo), M (medio), Q (cuartil), H (alto) | M |

## Consideraciones especiales

### URLs en Códigos QR

Para URLs en códigos QR:
- La URL debe tener un formato válido (debe contener al menos un punto)
- Se recomienda que las URLs no excedan de 300 caracteres para mantener la escaneabilidad óptima
- Considere usar servicios de acortamiento de URLs para URLs largas
  
### Validaciones de datos

El servicio realiza validaciones específicas según el tipo de código:
- Los datos deben tener el formato adecuado para cada tipo de código
- Para códigos numéricos (EAN, UPC), solo se permiten dígitos
- El tamaño de los datos está limitado según el tipo de código

## Ejemplos de uso

### Generar un código QR simple

```bash
curl -X POST http://localhost:3002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "qrcode",
    "data": "https://example.com",
    "options": {"scale": 3}
  }'
```

### Generar un código 128 con escala personalizada

```bash
curl -X POST http://localhost:3002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "code128",
    "data": "ABC123456",
    "options": {"scale": 5}
  }'
```

### Generar un código QR con alta corrección de errores

```bash
curl -X POST http://localhost:3002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "qr",
    "data": "https://example.com/product/12345",
    "options": {
      "scale": 4,
      "error_correction_level": "H"
    }
  }'
```

## Códigos de error comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| `INVALID_TYPE` | Tipo de código no soportado | Utilice uno de los tipos listados en la documentación |
| `INVALID_DATA` | Datos no válidos para el tipo seleccionado | Revise el formato de datos requerido para el tipo de código |
| `INVALID_SCALE` | Factor de escala fuera de rango | Utilice un valor entre 1 y 10 |
| `QR_URL_TOO_LONG` | URL demasiado larga para QR óptimo | Acorte la URL o reduzca parámetros |
| `QR_INVALID_ECL` | Nivel de corrección de errores inválido | Use uno de los siguientes: L, M, Q, H |

## Limitaciones técnicas

- El servicio genera códigos en formato SVG exclusivamente
- Se recomienda un máximo de 4000 caracteres para códigos QR
- La escala máxima recomendada es 10 (valores mayores pueden causar problemas de rendimiento)