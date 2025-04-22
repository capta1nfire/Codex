# Documento de Contexto del Proyecto "Codex"

**Fecha de Actualización:** 2024-07-29

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
    *   `README.md` (Raíz, `backend/`, `frontend/`, `rust_generator/`): Instrucciones de setup, ejecución y detalles específicos de cada componente. **Actualizados en sesión 2024-07-27**.
    *   `CHANGELOG.md`: Historial de cambios versionado.
    *   `CONTEXT_SUMMARY.md`: Este mismo documento, resumen para re-contextualización rápida.
*   **Calidad de Código:**
    *   Configuradas y verificadas herramientas de linting/formato:
        *   Rust (`rust_generator`): `cargo clippy`, `cargo fmt`.
        *   Node.js (`frontend`/`backend`): ESLint, Prettier.
    *   El código actual pasa las verificaciones de estas herramientas.

## 2. Estado Actual del Entorno de Desarrollo

*   **Ejecución:**
    1.  `docker-compose up -d`: Inicia PostgreSQL, Redis, Prometheus, Grafana.
    2.  `cd backend && npm run dev`: Inicia el backend Node.js (API Gateway) usando **tsx**. Puerto por defecto: 3004.
    3.  `cd rust_generator && cargo run`: Inicia el servicio Rust (Generador). Puerto por defecto: 3002.
    4.  `cd frontend && npm run dev`: Inicia el frontend Next.js. Puerto por defecto: 3000.
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
    *   `frontend/.env.local`: Define `NEXT_PUBLIC_BACKEND_URL` (usar 3004), `NEXT_PUBLIC_RUST_SERVICE_URL`.
    *   `docker-compose.yml`: Define los servicios de infraestructura.
    *   `prometheus.yml`: Define los targets de scrapeo para Prometheus (actualmente `host.docker.internal:3004/metrics`).

## 3. Hitos Recientes y Estado Funcional (Sesión: 2024-07-29)

*   **Servicio Rust (Generador):**
    *   **Integrada la estructura `EncodeHints`** de `rxing` (v0.7.0+).
    *   La función `generate_code` ahora utiliza `encode_with_hints`, permitiendo pasar opciones como nivel de corrección de errores (ECL) y margen (inferido de `scale`).
*   **Frontend:**
    *   Implementada la **carga inicial de un código QR por defecto** al visitar la página.
    *   El campo de datos ahora se **actualiza dinámicamente con ejemplos válidos** y relevantes al cambiar el tipo de código seleccionado en el desplegable.
    *   Añadidos los tipos de código restantes al selector de tipos.
*   **Documentación:**
    *   Actualizados `CHANGELOG.md`, `CODEX.md` (Changelog interno) y este documento (`CONTEXT_SUMMARY.md`) para reflejar los avances de la sesión.
*   **Estado General Actual:** El proyecto compila y se ejecuta. La generación de códigos ahora soporta hints básicos. El frontend ofrece una mejor experiencia inicial y guía al usuario con ejemplos dinámicos.

## 4. Próximos Pasos y Planificación (Según Plan Revisado)

1.  **Refactorizar Estado de Autenticación Frontend** (Context API, etc.).
2.  **Definir Contrato de API Externa** (OpenAPI/Swagger).
3.  **Implementar Exportación a PNG**.
4.  **Mejorar Dashboards Iniciales en Grafana**.
5.  **Abordar Dependencias Deprecadas (Backend)**.

## 5. Puntos Específicos a Recordar

*   El backend ahora se ejecuta en desarrollo con `tsx watch src/index.ts`.
*   El caché Redis está implementado en el backend.
*   La lógica actual de autenticación frontend usa `window.location.href` para forzar refresco tras login.
*   La dependencia `console-subscriber` en Rust está en `dev-dependencies`.
*   Las métricas en Grafana provienen del backend Node.js; las analíticas detalladas de Rust se ven en el dashboard frontend (`/dashboard`).

---

**Instrucción:** Al iniciar una nueva sesión, proporciona este documento completo al asistente IA para establecer el contexto. 