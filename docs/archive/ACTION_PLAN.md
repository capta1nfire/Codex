# Plan de Acción - Mejoras Post-Auditoría Codex

**Última Actualización General del Plan:** 2024-08-03

Este documento detalla las tareas identificadas para mejorar el proyecto Codex, basadas en la revisión de la auditoría inicial y el estado actual del código.

---

## Área: Seguridad de Inputs

**Tarea Específica:** Continuar con la revisión y refinamiento de las validaciones Zod/Joi en frontend y backend.
**Descripción/Objetivo:** Asegurar que todas las entradas de usuario y datos entre servicios estén validadas de forma exhaustiva para prevenir vulnerabilidades y asegurar la integridad de los datos.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - La implementación base con Zod ya existe. Esta tarea se enfoca en la completitud y robustez de los esquemas.
  - Considerar casos borde y diferentes tipos de input malicioso.
**Fecha de Actualización de Estado:** 2024-08-03

---

## Área: Calidad de Código

**Tarea Específica:** Investigar e integrar `ts-prune` y `depcheck` en el flujo de trabajo.
**Descripción/Objetivo:** Detectar y permitir la eliminación de código no utilizado (exports no importados) y dependencias de `package.json` no usadas para reducir el tamaño del código base, los tiempos de build y mejorar la mantenibilidad.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - Evaluar si integrar en CI para fallar/advertir, o como scripts locales para desarrolladores.
**Fecha de Actualización de Estado:** 2024-08-03

**Tarea Específica:** Mantener un esfuerzo continuo en la refactorización.
**Descripción/Objetivo:** Buscar activamente oportunidades para aplicar el principio DRY, mejorar la modularidad, reducir la complejidad ciclomática y eliminar deuda técnica.
**Prioridad:** Media
**Responsable(s):** Equipo de Desarrollo
**Estado:** En Progreso (Continuo)
**Notas/Comentarios:**
  - Esto es una práctica continua, no una tarea con un fin definido.
  - Fomentar revisiones de código enfocadas en estos aspectos.
**Fecha de Actualización de Estado:** 2024-08-03

---

## Área: Flujo Dev/CD (CI/CD y Testing)

**Tarea Específica:** Implementar la generación de reportes de cobertura para el frontend en el pipeline de CI.
**Descripción/Objetivo:** Tener visibilidad sobre la cobertura de pruebas del código frontend y poder tomar decisiones informadas sobre dónde enfocar los esfuerzos de testing.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Completado
**Notas/Comentarios:**
  - Modificado el script `test` en `frontend/package.json` a `jest --coverage`.
  - Añadido paso `Upload Frontend Coverage Report` al job `frontend` en `.github/workflows/ci.yml` usando `actions/upload-artifact@v4`.
  - Sube `frontend/coverage/lcov-report/` y `frontend/coverage/clover.xml`.
  - Esto permite que los reportes de cobertura del frontend sean accesibles como artefactos de CI.
**Fecha de Actualización de Estado:** 2024-08-03

**Tarea Específica:** Configurar umbrales de cobertura (`coverageThreshold` en Jest) para el backend y frontend.
**Descripción/Objetivo:** Asegurar que la cobertura de pruebas no disminuya por debajo de un umbral definido (ej. 80%), haciendo fallar el pipeline de CI si esto ocurre, para mantener un estándar de calidad.
**Prioridad:** Alta
**Responsable(s):** Por definir
**Estado:** Completado
**Notas/Comentarios:**
  - Backend: Añadido `coverageThreshold` (80% global) a `backend/jest.config.cjs`.
  - Frontend: Añadido `coverageThreshold` (70% global) a la sección `jest` de `frontend/package.json`. Reportes de cobertura también configurados para subirse como artefactos en CI.
**Fecha de Actualización de Estado:** 2024-08-03

**Tarea Específica:** Investigar e implementar "code-scanning" en el pipeline de CI.
**Descripción/Objetivo:** Integrar herramientas de Análisis Estático de Seguridad de Aplicaciones (SAST) para detectar vulnerabilidades comunes y malas prácticas de seguridad en el código de forma temprana.
**Prioridad:** Alta
**Responsable(s):** Por definir
**Estado:** Completado
**Notas/Comentarios:**
  - Integrado GitHub CodeQL en los jobs de backend, frontend y rust del workflow `.github/workflows/ci.yml`.
  - CodeQL analizará TypeScript (para backend y frontend) y Rust.
  - Se añadieron los permisos necesarios (`security-events: write`) a los jobs.
**Fecha de Actualización de Estado:** 2024-08-03

**Tarea Específica:** Planificar e implementar pruebas End-to-End (E2E).
**Descripción/Objetivo:** Validar los flujos críticos de usuario a través de la interfaz completa de la aplicación para asegurar que los componentes integrados funcionan correctamente.
**Prioridad:** Baja/Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - Considerar Cypress o Playwright.
  - Enfocarse primero en los flujos más críticos y estables.
  - Puede ser más relevante al acercarse a fases de pre-producción.
**Fecha de Actualización de Estado:** 2024-08-03

---

## Área: Rendimiento (Frontend)

**Tarea Específica:** Ejecutar `next build --profile` para analizar el bundle del frontend.
**Descripción/Objetivo:** Obtener un informe detallado del tamaño del bundle de JavaScript del frontend, identificando los componentes/librerías que más contribuyen a su tamaño.
**Prioridad:** Alta
**Responsable(s):** Por definir
**Estado:** Completado (Análisis realizado)
**Notas/Comentarios:**
  - Se ejecutó `npm run analyze` y se revisaron los reportes de `client.html`.
  - Hallazgos principales del bundle del cliente (total ~1.36MB):
    - `906-...js` (362KB): Principalmente router de Next.js y SDK de Sentry.
    - `framework-...js` (179KB): Framework (React, Next.js).
    - `4bd1-...js` (165KB): Principalmente React DOM.
    - `pages/_app-...js` (118KB): `instrumentation-client.ts` con gran parte del SDK de Sentry y sus módulos.
    - `564-...js` (85KB): Zod y React Hook Form.
    - `791-...js` (73KB): Radix UI (Select, Popper, Collection, etc.) y Floating UI.
  - Conclusión: Los chunks más grandes están dominados por el framework, React DOM y Sentry. Las oportunidades de optimización con `next/dynamic` radican en componentes de aplicación que usan Zod, React Hook Form, Radix UI y Floating UI.
**Fecha de Actualización de Estado:** 2024-08-04

**Tarea Específica:** Aplicar optimizaciones como `next/dynamic` (code splitting) basado en el análisis del bundle.
**Descripción/Objetivo:** Reducir el tamaño inicial del bundle cargando dinámicamente componentes que no son necesarios para el renderizado inicial, mejorando el Time To Interactive (TTI).
**Prioridad:** Media/Alta
**Responsable(s):** Por definir
**Estado:** En Progreso (Implementada carga dinámica para Opciones Avanzadas del Generador)
**Notas/Comentarios:**
  - Se ejecutó `npm run analyze` y se revisaron los reportes de `client.html`.
  - Hallazgos principales del bundle del cliente (total ~1.36MB) identificaron oportunidades en componentes que usan Zod, React Hook Form, Radix UI, Sentry, etc.
  - Se refactorizó el componente `GenerationOptions.tsx`:
    - Las opciones avanzadas (específicas por tipo de código de barras para usuarios Enterprise) se movieron al nuevo componente `AdvancedBarcodeOptions.tsx`.
    - `AdvancedBarcodeOptions.tsx` ahora se carga dinámicamente en `GenerationOptions.tsx` usando `next/dynamic`.
  - **Siguiente Paso Crítico:** Identificar otros componentes candidatos para carga dinámica (ej. secciones completas de `page.tsx` que no sean críticas para el LCP, o modales pesados).
  - Considerar la carga dinámica de `proOptionsContent` (`appearanceOptions` y `displayOptions`) en `GenerationOptions.tsx` si el usuario es "Free".
**Fecha de Actualización de Estado:** 2024-08-04

---

## Área: Rendimiento (Backend)

**Tarea Específica:** Continuar con la optimización de la integración de caché Redis.
**Descripción/Objetivo:** Mejorar la efectividad del caché Redis, revisando estrategias de cacheo, granularidad de claves, políticas de invalidación (si es necesario más allá de TTL) y monitoreando su rendimiento.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - La integración base con expiración TTL ya existe.
  - Considerar métricas específicas para el rendimiento del caché (hit rate, latency).
**Fecha de Actualización de Estado:** 2024-08-03

---

## Área: Monitorización

**Tarea Específica:** Configurar Prometheus Alertmanager con reglas de alerta para métricas críticas.
**Descripción/Objetivo:** Establecer un sistema de alertas automáticas para notificar al equipo sobre problemas de rendimiento, disponibilidad o errores basados en las métricas recolectadas por Prometheus.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - Definir qué métricas son críticas y cuáles son sus umbrales.
  - Configurar canales de notificación (ej. email, Slack).
**Fecha de Actualización de Estado:** 2024-08-03

**Tarea Específica:** Integrar Sentry (o similar) para la monitorización de errores en runtime.
**Descripción/Objetivo:** Capturar y reportar errores no controlados y excepciones en tiempo real tanto en el frontend como en el backend para facilitar la depuración y mejorar la estabilidad.
**Prioridad:** Alta
**Responsable(s):** Por definir
**Estado:** Completado
**Notas/Comentarios:**
  - **Backend:**
    - Añadido `@sentry/node` a `package.json`.
    - Inicializado Sentry en `src/index.ts` (usa `config.SENTRY_DSN` y `config.APP_VERSION`).
    - `config.SENTRY_DSN` y `config.APP_VERSION` añadidos a `src/config.ts`.
  - **Frontend:**
    - Añadido `@sentry/nextjs` a `package.json`.
    - Creados `frontend/src/instrumentation.ts` (para server/edge), `frontend/instrumentation-client.ts` (para cliente), y `frontend/src/app/global-error.tsx`.
    - `instrumentation.ts` exporta `register` y `onRequestError`.
    - `instrumentation-client.ts` exporta `onRouterTransitionStart`.
    - Modificado `next.config.ts` (existente) y envuelto con `withSentryConfig`.
    - Utiliza `process.env.NEXT_PUBLIC_SENTRY_DSN`.
  - **Pendiente Crítico:** Configurar los DSN reales de Sentry como variables de entorno en los entornos de despliegue y desarrollo/pruebas.
  - **Pendiente:** Configurar y verificar la subida de source maps (especialmente para producción) para una depuración efectiva.
**Fecha de Actualización de Estado:** 2024-08-04

---

## Área: Costes BD (Índices) / Rendimiento BD

**Tarea Específica:** Continuar la revisión y definición de índices compuestos en Prisma/PostgreSQL.
**Descripción/Objetivo:** Asegurar que las consultas a la base de datos sean eficientes mediante la creación de índices apropiados, especialmente para consultas frecuentes o complejas.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - Ya se han añadido algunos índices compuestos.
  - Analizar patrones de consulta para identificar necesidades adicionales.
**Fecha de Actualización de Estado:** 2024-08-03

---

## Área: UX/Accesibilidad

**Tarea Específica:** Ejecutar herramientas de auditoría de accesibilidad (Lighthouse, axe-core) de forma regular.
**Descripción/Objetivo:** Identificar proactivamente problemas de accesibilidad en el frontend (contraste, ARIA, navegación por teclado, etc.).
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - Integrar en el proceso de desarrollo o como parte de revisiones periódicas.
**Fecha de Actualización de Estado:** 2024-08-03

**Tarea Específica:** Corregir los "gaps de ARIA" identificados y asegurar el cumplimiento de WCAG.
**Descripción/Objetivo:** Hacer la aplicación usable por personas con diversas discapacidades, cumpliendo con los estándares de accesibilidad web.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - Esta tarea dependerá de los hallazgos de las auditorías de accesibilidad.
  - Enfocarse en componentes interactivos y flujos de usuario.
**Fecha de Actualización de Estado:** 2024-08-03

---

## Área: Documentación API

**Tarea Específica:** Completar y verificar las anotaciones JSDoc `@openapi` para todas las rutas y schemas del backend.
**Descripción/Objetivo:** Asegurar que la documentación OpenAPI (Swagger) sea exhaustiva, precisa y útil para los desarrolladores que consuman la API.
**Prioridad:** Media
**Responsable(s):** Por definir
**Estado:** Pendiente
**Notas/Comentarios:**
  - La estructura base y la UI de Swagger ya están implementadas.
  - Revisar cada endpoint y schema para asegurar que la documentación JSDoc esté completa y correcta.
**Fecha de Actualización de Estado:** 2024-08-03

--- 