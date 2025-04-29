# Codex - Plataforma de Generación de Códigos de Barras y QR

<div align="center">
  <img src="assets/logo.png" alt="Codex Logo" width="200">
  <p><strong>Generación moderna y eficiente de códigos de barras y QR</strong></p>
</div>

## Estado del Proyecto

📊 **Fase actual: Beta Temprana (Fase 1.5)** 

Este proyecto implementa una plataforma moderna para la generación de códigos de barras y QR, utilizando tecnologías avanzadas para garantizar rendimiento, escalabilidad y flexibilidad. Se ha completado la migración a base de datos persistente y se han implementado mecanismos de autenticación.

## 🚀 Características Implementadas

- ✅ Generación de múltiples tipos de códigos de barras y QR
- ✅ Personalización básica de escala y nivel de corrección
- ✅ Exportación en formato SVG
- ✅ Previsualización en tiempo real
- ✅ **Autenticación de Usuarios:** Registro, Login (JWT), API Keys (hasheadas).
- ✅ **Autorización Básica:** Roles (User, Admin, Premium) y protección de rutas.
- ✅ **Base de Datos:** Persistencia de usuarios en **PostgreSQL** con **Prisma ORM**.
- ✅ Monitoreo de estado del sistema (`/health`)
- ✅ Dashboard de métricas (caché en memoria, `/metrics`)
- ✅ UI de estado del sistema en frontend (páginas `/status` y `/dashboard`)
- ✅ Sistema de caché en memoria (MVP)
- ✅ Soporte CORS para comunicación entre servicios
- ✅ Interfaz intuitiva con Tailwind CSS y diseño responsivo (mejorado para 4K)
- ✅ Seguridad: Helmet, rate limiting, validación, XSS clean, HTTPS opcional.
- ✅ Manejo estructurado de errores
- ✅ Configuración flexible mediante variables de entorno (`.env`)
- ✅ Compresión HTTP para respuestas optimizadas
- ✅ Pruebas automatizadas básicas (Jest)

## 🛠️ Tecnologías Utilizadas

### Frontend
- Next.js
- React
- Tailwind CSS
- HeadlessUI
- Shadcn UI
- Axios

### Backend
- Node.js con Express
- PostgreSQL (Base de Datos)
- Prisma ORM (Acceso a Datos)
- Passport.js (Autenticación JWT, Local, API Key)
- bcrypt (Hasheo de contraseñas y API Keys)
- **Microservicio de generación en Rust (Axum)**
- Arquitectura de API Gateway
- Seguridad: Helmet, express-rate-limit, xss-clean, CORS
- Validación: express-validator
- Logging: Winston
- Compresión HTTP: compression
- Métricas: prom-client (para Prometheus)
- Conexión a Redis (configurada)

### Servicio Rust (Generador)
- Axum (Framework Web)
- rxing (Generación de Códigos)
- DashMap (Caché Interno Concurrente)
- Tracing + Tracing Subscriber (Logging)
- Tokio (Runtime Asíncrono)

### Infraestructura (Desarrollo)
- Docker / Docker Compose (para PostgreSQL, **Prometheus, Grafana**)
- **Prometheus** (Recolección de Métricas Backend)
- **Grafana** (Visualización de Métricas)

## 🏗️ Arquitectura

El sistema utiliza una arquitectura moderna:

1.  **Frontend (Next.js)**: Interfaz de usuario (React, Tailwind, Shadcn UI).
2.  **API Gateway (Node.js/Express)**: Gestiona peticiones, autenticación (Passport), orquesta servicios, interactúa con BBDD (Prisma), expone métricas a Prometheus.
3.  **Base de Datos (PostgreSQL)**: Almacenamiento persistente (usuarios, etc.).
4.  **Servicio de Generación (Rust/Axum)**: Núcleo optimizado para la generación de códigos, con caché interno y endpoint de analíticas.
5.  **Caché Externo (Redis)**: Configurado en backend, pendiente de integración activa en lógica de servicio.
6.  **Monitoreo (Prometheus/Grafana)**: Stack básico para recolección y visualización de métricas operacionales del backend.

## 📁 Estructura del Proyecto

La estructura de directorios principal es la siguiente:

-   **`.github/`**: Contiene workflows de GitHub Actions (ej. CI/CD).
-   **`backend/`**: Código fuente del servidor API Gateway (Node.js/Express).
    -   `src/`: Código fuente principal (rutas, controladores, servicios, modelos, middleware, etc.).
    -   `prisma/`: Esquema de la base de datos y migraciones.
    -   `uploads/`: Directorio donde se guardan archivos subidos (ej. avatares). ***Nota:** No versionado por defecto.*
    -   `README.md`: Documentación específica del backend.
    -   `.env.example`: Archivo de ejemplo para variables de entorno del backend.
-   **`frontend/`**: Código fuente de la aplicación web (Next.js/React).
    -   `src/`: Código fuente principal (páginas, componentes, contexto, etc.).
    -   `public/`: Archivos estáticos servidos directamente.
    -   `README.md`: Documentación específica del frontend.
    -   `.env.local.example`: Archivo de ejemplo para variables de entorno del frontend.
-   **`rust_generator/`**: Código fuente del microservicio de generación de códigos (Rust/Axum).
    -   `src/`: Código fuente principal.
    -   `README.md`: Documentación específica del servicio Rust.
-   **`scripts/`**: Scripts útiles para desarrollo o automatización (ej. seeding de base de datos).
-   **`assets/`**: Imágenes u otros recursos utilizados en la documentación (como el logo).
-   **`docker-compose.yml`**: Define los servicios de soporte (PostgreSQL, Redis, Prometheus, Grafana).
-   **`prometheus.yml`**: Configuración para Prometheus.
-   **`README.md`**: Este archivo. Documentación general del proyecto.
-   **`CODEX.md`**: Documentación adicional sobre la filosofía y diseño de Codex.
-   **`CHANGELOG.md`**: Historial de cambios del proyecto.
-   Archivos de configuración (`.gitignore`, etc.).

## 🚦 Cómo Iniciar

### Requisitos previos
- Node.js 20.x o superior
- Rust y Cargo (si se modifica/compila el servicio de generación)
- npm o yarn
- Docker y Docker Compose

### Instalación

```bash
# 1. Clonar el repositorio
# git clone <URL_DEL_REPOSITORIO>
cd Codex

# 2. Instalar dependencias del frontend
cd frontend
npm install
cd ..

# 3. Instalar dependencias del backend
cd backend
npm install
cd ..

# 4. (Opcional) Compilar el servicio Rust si no usas una versión precompilada
# cd rust_generator
# cargo build --release
# cd ..
```

### Configuración

1.  **Servicios Docker (Base de Datos, Cache, Monitoreo):**
    *   Asegúrate de tener Docker Desktop corriendo.
    *   En la carpeta raíz (`Codex/`), ejecuta:
        ```bash
        docker-compose up -d
        ```
    *   Esto iniciará PostgreSQL, Redis, Prometheus y Grafana en segundo plano.

2.  **Variables de Entorno:**
    *   **Backend:** Ve a la carpeta `backend/`, copia `.env.example` a un nuevo archivo llamado `.env` y configura las variables necesarias, especialmente `DATABASE_URL` (que debe apuntar a la base de datos Docker recién iniciada) y `JWT_SECRET`.
        ```bash
        cd backend
        cp .env.example .env
        # Abre .env y edita las variables
        cd ..
        ```
    *   **Frontend:** Ve a la carpeta `frontend/`, copia `.env.local.example` a `.env.local` y asegúrate de que `NEXT_PUBLIC_BACKEND_URL` apunte a la URL donde correrá tu backend (por defecto `http://localhost:3004`).
        ```bash
        cd frontend
        cp .env.local.example .env.local
        # Abre .env.local y edita las variables si es necesario
        cd ..
        ```

3.  **Migración de Base de Datos:**
    *   Una vez configurado el `.env` del backend y con los servicios Docker corriendo, aplica las migraciones de la base de datos usando Prisma:
        ```bash
        cd backend
        npx prisma migrate dev
        cd ..
        ```
    *   Esto creará las tablas necesarias en la base de datos `codex_db`.

### Ejecución (Desarrollo)

Abre terminales separadas para cada servicio:

1.  **Backend (API Gateway):**
    ```bash
    cd backend
    npm run dev
    ```
    *   El servidor backend escuchará por defecto en `http://localhost:3004`.

2.  **Frontend (Aplicación Web):**
    ```bash
    cd frontend
    npm run dev
    ```
    *   La aplicación web estará disponible en `http://localhost:3000`.

3.  **Servicio de Generación (Rust):**
    *   El backend Node.js intentará conectarse a este servicio (configurado por defecto en `http://localhost:3001`). Puedes ejecutarlo si necesitas la generación real de códigos o si modificas su código:
    ```bash
    cd rust_generator
    cargo run
    ```

Ahora deberías tener todos los componentes necesarios corriendo para el desarrollo.
