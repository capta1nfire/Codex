# Documento de Contexto del Proyecto "Codex"

**Fecha de Actualización:** 2024-08-02

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
    *   `README.md` (Raíz, `backend/`, `frontend/`, `rust_generator/`): Instrucciones de setup, ejecución y detalles específicos de cada componente. **Actualizados sistemáticamente en sesión 2024-08-02**.
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
    *   Frontend App: `http://localhost:3000`
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

## 3. Hitos Recientes y Estado Funcional (Sesión: 2024-08-02)

*   **Investigación Persistencia Imagen Perfil:**
    *   **Problema:** Imagen de perfil subida en `UserProfile` no persistía después de reiniciar el servidor backend (`npm run dev`).
    *   **Diagnóstico Parcial:** Se identificó que el frontend llamaba a una ruta incorrecta (`/api/users/profile-picture`). Se corrigió para usar la ruta correcta `/api/avatars/upload`.
    *   Se confirmó que el backend guarda las imágenes localmente en `backend/uploads/` (lo cual es persistente al correr con `npm run dev`) y que la lógica de `userStore.updateUser` parece correcta para actualizar `avatarUrl` y `avatarType` en la base de datos.
    *   **Estado:** Investigación pausada. Pendiente verificar directamente en la BD PostgreSQL si la URL del avatar se actualiza correctamente *antes* de reiniciar el backend.
*   **Mejora Documentación:**
    *   Se realizó una revisión y actualización exhaustiva de los archivos `README.md` de la raíz, `backend/`, `frontend/` y `rust_generator/` para reflejar con precisión la estructura actual del proyecto, las funcionalidades, la configuración, la ejecución y los comandos útiles. El objetivo es mantenerlos como "documentos vivos".
*   **Ajustes UI:**
    *   Se igualó el efecto hover del avatar en `Navbar` al de los otros botones de navegación (`hover:bg-white/10`).
    *   Se ajustó el borde de la imagen de perfil en `UserProfile` para usar `border-border`, coincidiendo con el estilo del botón "Editar" (`outline`).
*   **Estado General Actual:** La funcionalidad principal (generación, auth, métricas) sigue operativa. La investigación del problema de persistencia de la imagen está pendiente de la verificación en la base de datos. La documentación ha sido significativamente mejorada.

## 4. Próximos Pasos y Planificación (Según Informe de Auditoría)

(Prioridades generales - podrían reordenarse según necesidad)
1.  **Resolver problema persistencia imagen de perfil** (Verificar BD).
2.  **Integrar validación Zod/Joi** en backend y frontend (Validación de inputs).
3.  **Implementar caché Redis** en `barcodeService`.
4.  **Definir índices compuestos** en Prisma/PostgreSQL.
5.  **Configurar alertas** en Prometheus Alertmanager (Slack/Email).
6.  **Integrar Sentry** (o Datadog) para captura de errores en producción.
7.  **Generar documentación** OpenAPI/Swagger de la API.

## 5. Puntos Específicos a Recordar

*   **Próxima Acción (Debug):** Verificar directamente en la BD PostgreSQL (usando `psql` u otra herramienta) si la columna `avatarUrl` del usuario se actualiza correctamente tras subir una imagen en `UserProfile`, *antes* de reiniciar el backend.
*   **Documentación:** Los archivos `README.md` (raíz, backend, frontend, rust_generator) han sido actualizados y deben usarse como referencia principal para estructura y setup.
*   El backend se ejecuta en desarrollo con `npm run dev` (usando `tsx`).
*   La lógica actual de autenticación frontend usa `window.location.href` para forzar refresco tras login (podría mejorarse).
*   Las métricas en Grafana provienen del backend Node.js; las analíticas detalladas de Rust se ven en el dashboard frontend (`/dashboard`) o en `rust_generator/analytics/performance`.

---

**Instrucción:** Al iniciar una nueva sesión, proporciona este documento completo al asistente IA para establecer el contexto. 