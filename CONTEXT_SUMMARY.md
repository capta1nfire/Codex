# Documento de Contexto del Proyecto "Codex"

**Fecha de Actualización:** 2024-07-27

**Propósito:** Este documento sirve para re-contextualizar rápidamente al asistente IA sobre el estado actual y la historia reciente del proyecto Codex, una plataforma web para la generación de códigos de barras y QR.

## 1. Resumen del Proyecto

*   **Objetivo Principal:** Crear una plataforma web completa, moderna y eficiente para generar diversos tipos de códigos de barras y QR, ofreciendo personalización y opciones avanzadas. (Ver `CODEX.md` para visión completa).
*   **Arquitectura General:** Multi-componente:
    *   **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI. Interfaz de usuario principal.
    *   **Backend (API Gateway):** Node.js, Express, TypeScript. Gestiona lógica de negocio, autenticación (Passport.js - JWT/API Keys), interacción con BD (Prisma), orquestación de llamadas al servicio Rust, exposición de métricas (Prometheus).
    *   **Servicio de Generación:** Rust, Axum. Servicio de alto rendimiento dedicado exclusivamente a generar los códigos SVG usando `rxing`, con caché interno (DashMap) y endpoints de estado/analíticas.
    *   **Base de Datos:** PostgreSQL (gestionada con Prisma ORM) para persistencia de usuarios, API Keys, etc.
    *   **Caché Externo:** Redis configurado en el backend y disponible vía Docker Compose, pero **aún no integrado activamente** en la lógica de `barcodeService.ts`.
    *   **Monitoreo:** Stack Prometheus + Grafana configurado vía Docker Compose para recolectar y visualizar métricas operacionales del backend Node.js.
*   **Documentación Clave:**
    *   `CODEX.md`: Visión estratégica, arquitectura detallada, roadmap.
    *   `README.md` (Raíz, `backend/`, `frontend/`, `rust_generator/`): Instrucciones de setup, ejecución y detalles específicos de cada componente.
    *   `CHANGELOG.md`: Historial de cambios versionado.
    *   `CONTEXT_SUMMARY.md`: Este mismo documento, resumen para re-contextualización rápida.

## 2. Estado Actual del Entorno de Desarrollo

*   **Ejecución:**
    1.  `docker-compose up -d`: Inicia PostgreSQL, Redis, Prometheus, Grafana.
    2.  `cd backend && npm run dev`: Inicia el backend Node.js (API Gateway). **Puerto por defecto: 3004**.
    3.  `cd rust_generator && cargo run`: Inicia el servicio Rust (Generador). **Puerto por defecto: 3002**.
    4.  `cd frontend && npm run dev`: Inicia el frontend Next.js. **Puerto por defecto: 3000** (puede cambiar a 3001 si 3000 está ocupado).
*   **Acceso a Servicios:**
    *   Frontend App: `http://localhost:3000` (o `3001`)
    *   Backend API: `http://localhost:3004`
    *   Servicio Rust API: `http://localhost:3002`
    *   Grafana: `http://localhost:3030`
    *   Prometheus: `http://localhost:9090`
    *   PostgreSQL: `localhost:5432`
    *   Redis: `localhost:6379`
*   **Configuración Clave:**
    *   `backend/.env`: Define `DATABASE_URL`, `REDIS_URL`, `PORT`, `RUST_SERVICE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, etc.
    *   `frontend/.env.local`: Define `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_RUST_SERVICE_URL`.
    *   `docker-compose.yml`: Define los servicios de infraestructura.
    *   `prometheus.yml`: Define los targets de scrapeo para Prometheus (actualmente `host.docker.internal:3004/metrics`).

## 3. Hitos Recientes y Estado Funcional

*   **Base de Datos:** Migración completada de almacenamiento en memoria a PostgreSQL con Prisma. Seed script disponible.
*   **Autenticación:** Implementado registro, login (JWT), gestión de API Keys (hasheadas), endpoint `/me`.
*   **Generación de Códigos:** Funcionalidad principal delegada al servicio Rust, orquestada por el backend.
*   **Monitoreo:** Stack Prometheus/Grafana funcional para métricas del backend.
*   **Dashboard Frontend (`/dashboard`):** Muestra:
    *   Estado básico del sistema (obtenido de `backend:/health`).
    *   Panel de "Análisis de Rendimiento (Servicio Rust)" (obtenido de `rust_generator:/analytics/performance`) mostrando métricas de caché y rendimiento por tipo.
*   **Limpieza Reciente:** Se realizó una revisión sistemática y limpieza profunda:
    *   Eliminados `package.json`/`node_modules` innecesarios de la raíz.
    *   Dependencias movidas (`prom-client`, `redis` al backend).
    *   Eliminadas dependencias no usadas (`image` en Rust; `chart.js`, `tw-animate-css`, `@types/qrcode` en Node.js).
    *   Eliminado código comentado obsoleto y artefactos menores (imports no usados, middleware `static` inoperante, archivos `.pem` vacíos).
    *   Corregidos errores de build y runtime (CORS entre componentes, `_document.js`, módulos no encontrados, errores de compilación Rust).
*   **Documentación:** Actualizados `README.md` (raíz, backend), `CHANGELOG.md`. Añadida Sección 17 (Mantenimiento y Calidad) a `CODEX.md`. Creado `CONTEXT_SUMMARY.md`.
*   **Estado General Actual:** El proyecto compila y se ejecuta correctamente en todas sus partes. La funcionalidad principal de generación y los dashboards de monitoreo/analíticas están operativos. La documentación está sincronizada con el estado actual.

## 4. Próximos Pasos y Planificación

*   **Integración de Caché Redis:** Modificar `backend/src/services/barcodeService.ts` para que utilice activamente el cliente Redis configurado como capa de caché antes de llamar al servicio Rust.
*   **Optimización de API Keys:** Revisar la lógica de búsqueda `findByApiKey` en `backend/` para mejorar su eficiencia (mencionado en READMEs).
*   **Mantenimiento y Calidad:** Empezar a implementar las herramientas y prácticas definidas en `CODEX.md` Sección 17 (ej: configurar `depcheck`, `ts-prune`, reforzar linters).
*   **Roadmap General:** Consultar `CODEX.md` Sección 13 para las funcionalidades de las fases Beta/Producción (ej: registro completo, planes de pago, API externa, seguimiento de escaneos).

## 5. Puntos Específicos a Recordar

*   El caché Redis está *configurado* pero *no se usa* activamente en el flujo de generación del backend (`backend/src/services/barcodeService.ts`).
*   La dependencia `console-subscriber` en Rust está en `dev-dependencies`.
*   Las métricas en Grafana provienen del backend Node.js; las analíticas detalladas de Rust se ven en el dashboard frontend (`/dashboard`).

---

**Instrucción:** Al iniciar una nueva sesión, proporciona este documento completo al asistente IA para establecer el contexto.

--- 