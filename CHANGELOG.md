# Changelog

Todos los cambios significativos en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [No publicado]

### Añadido
- Sistema de monitoreo de estado con endpoint `/health`
- Modal visual para mostrar el estado del sistema
- Documentación estratégica CODEX.md
- Implementación de CORS en el servicio Rust para comunicación entre servicios
- Middleware Helmet para seguridad de encabezados HTTP
- Rate limiting para prevenir ataques de fuerza bruta (100 peticiones por 15 minutos)
- Manejo estructurado de errores con mensajes detallados
- Validación robusta con express-validator en endpoints de API
- Configuración flexible mediante variables de entorno
- Sanitización XSS para prevenir ataques de cross-site scripting

### Mejorado
- Optimización de la interfaz de usuario para mejor contraste
- Validación de datos de entrada en el backend
- Actualización del README con características actuales
- Limpieza de dependencias innecesarias en el componente Rust (eliminadas base64 y wasm-bindgen)
- Mejora en la estructura del proyecto Rust con enfoque en binario principal
- Seguridad de API mediante CORS restringido a orígenes específicos
- Visualización de errores de validación en la interfaz de usuario
- Manejo de cierre graceful para el servidor
- Limitación de tamaño de solicitudes para prevenir ataques DoS

## [0.2.0] - 2025-04-10

### Añadido
- Dashboard de métricas para analizar el rendimiento del sistema
- Endpoint de estado para el servicio Rust
- Caché de resultados para mejorar rendimiento

### Corregido
- Problema con la visualización en Safari
- Error de validación en códigos EAN-13

## [0.1.0] - 2025-03-28

### Añadido
- Estructura inicial del proyecto
- Interfaz básica de generación de códigos
- Soporte para QR, Code128 y otros formatos básicos
- Exportación en formato SVG