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
- Alias para la ruta `/generator` que redirecciona a `/generate` para compatibilidad con el frontend
- Compresión de respuestas HTTP mediante middleware compression
- Sistema de caché en memoria para respuestas del servicio Rust
- Configuración de headers HTTP Cache-Control para optimizar caché en navegadores
- Tests de rendimiento para verificar compresión y caché
- Limpieza automática del caché para evitar fugas de memoria
- Sistema avanzado de monitoreo de caché con estadísticas detalladas por tipo de código
- Endpoint `/metrics` para acceso en tiempo real a estadísticas del sistema
- Soporte completo para conexiones seguras SSL/HTTPS configurables
- Tests automatizados para SSL/HTTPS
- Nueva barra de navegación con mejor contraste visual y disposición optimizada
- Corrección de problemas de duplicación de componentes en layouts anidados
- Panel de estadísticas de caché detallado en el dashboard de métricas

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
- Estandarización de códigos de error para consistencia en el sistema de manejo de errores
- Rendimiento general del backend con compresión y sistema de caché
- Tiempos de respuesta para solicitudes repetidas mediante caché en memoria
- Consumo de ancho de banda al comprimir respuestas grandes como SVGs
- Documentación en el README del backend con sección de optimizaciones
- Sistema de seguimiento de caché con métricas detalladas y estadísticas por tipo
- Estructura de componentes de la UI con mejor organización y reusabilidad
- Implementación de layouts anidados para mejor estructura de la aplicación

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