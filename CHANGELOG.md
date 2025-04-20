# Changelog

Todos los cambios significativos en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [No publicado]

### Añadido

### Mejorado

### Corregido

### Eliminado

## [1.3.0] - 2024-07-27

### Añadido
- **Infraestructura:** Añadido **Prometheus & Grafana** vía Docker Compose para recolección y visualización de métricas del backend.
- **Frontend:** Implementado nuevo panel en `/dashboard` para mostrar **analíticas de rendimiento del servicio Rust** (caché, duración por tipo) obtenidas de `/analytics/performance`.
- **Backend:** Migración de almacenamiento de usuarios en memoria a **PostgreSQL con Prisma ORM**.
- **Backend:** Generación segura (`crypto`) y almacenamiento hasheado (`bcrypt`) de **API Keys**.
- **Backend:** Script de **seeding** de base de datos (`npm run seed`) con Prisma.
- **Infraestructura:** Configuración de **Docker Compose** para base de datos PostgreSQL en desarrollo.
- **Docs:** Añadida sección "17. Mantenimiento y Calidad de Código" a `CODEX.md` como plan de mejora continua.
- Sistema de monitoreo de estado con endpoint `/health` (previamente en No publicado)
- Middleware Helmet para seguridad de encabezados HTTP (previamente en No publicado)
- Rate limiting para prevenir ataques de fuerza bruta (previamente en No publicado)
- Manejo estructurado de errores con mensajes detallados (previamente en No publicado)
- Validación robusta con express-validator en endpoints de API (previamente en No publicado)
- Configuración flexible mediante variables de entorno (previamente en No publicado)
- Sanitización XSS para prevenir ataques de cross-site scripting (previamente en No publicado)
- Compresión de respuestas HTTP mediante middleware compression (previamente en No publicado)
- Configuración de headers HTTP Cache-Control para optimizar caché en navegadores (previamente en No publicado)

### Mejorado
- **Backend:** Refactorización de lógica de generación a `barcodeService.ts` (previamente en No publicado).
- **Backend:** Corrección de configuración de logger (evita duplicados en consola dev) (previamente en No publicado).
- **Frontend:** **Responsividad** significativamente mejorada en Navbar, Formularios y Generador para pantallas grandes (4K) (previamente en No publicado).
- **Frontend:** Refactorización de Página Principal (Generador) para usar componentes UI y estructura de tarjetas/disclosure (previamente en No publicado).
- **Frontend:** Aplicación de **estilo visual consistente** a Página de Perfil (previamente en No publicado).
- Seguridad de API mediante CORS restringido a orígenes específicos (previamente en No publicado).
- Manejo de cierre graceful para el servidor (previamente en No publicado).
- Limitación de tamaño de solicitudes para prevenir ataques DoS (previamente en No publicado).
- Estandarización de códigos de error para consistencia en el sistema de manejo de errores (previamente en No publicado).

### Corregido
- **Fix:** Resuelto error `Module not found: Can't resolve 'tw-animate-css'` eliminando import en `globals.css`.
- **Fix:** Resueltos múltiples errores **CORS** entre frontend, backend y servicio Rust ajustando configuración en backend (`.env`) y Rust (`main.rs`).
- **Fix:** Resuelto error `ENOENT: ... pages/_document.js` en frontend mediante reinstalación limpia de dependencias.
- **Fix:** Resuelto error `Cannot find module 'prom-client'` en backend instalando la dependencia faltante.
- **Fix:** Corregidos errores de compilación en servicio Rust después de modificar configuración CORS.

### Eliminado
- **Chore:** Eliminados `package.json`, `package-lock.json` y dependencias (`prom-client`, `redis`) innecesarios de la **raíz** del proyecto.
- **Chore:** Eliminada dependencia `image` (Rust) no utilizada.
- **Chore:** Eliminadas dependencias `@types/qrcode` (Backend), `chart.js` y `tw-animate-css` (Frontend) no utilizadas.
- **Chore:** Eliminado código comentado obsoleto e importaciones no usadas en backend y frontend.
- **Chore:** Eliminado middleware `express.static('public')` inoperante del backend.
- **Chore:** Eliminados archivos `.pem` vacíos de `backend/certs/`.
- **Chore:** Movida dependencia `console-subscriber` (Rust) a `[dev-dependencies]`.

## [0.2.0] - 2025-04-10

### Añadido
- Dashboard de métricas para analizar el rendimiento del sistema (Versión inicial, ahora reemplazado/mejorado)
- Endpoint de estado para el servicio Rust
- Caché de resultados para mejorar rendimiento (Caché en memoria obsoleto)

### Corregido
- Problema con la visualización en Safari
- Error de validación en códigos EAN-13

## [0.1.0] - 2025-03-28

### Añadido
- Estructura inicial del proyecto
- Interfaz básica de generación de códigos
- Soporte para QR, Code128 y otros formatos básicos
- Exportación en formato SVG