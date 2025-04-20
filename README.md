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

## 🚦 Cómo Iniciar

### Requisitos previos
- Node.js 20.x o superior
- Rust y Cargo (si se modifica/compila el servicio de generación)
- npm o yarn
- Docker y Docker Compose

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/capta1nfire/Codex.git # Reemplaza con tu URL si es diferente
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

1.  **Base de Datos, Prometheus, Grafana:**
    *   Asegúrate de tener Docker corriendo.
    *   En la carpeta raíz (`Codex/`), ejecuta `docker-compose up -d`. Esto iniciará los contenedores necesarios.
2.  **Variables de Entorno Backend:**
    *   En la carpeta `backend/`, crea un archivo `.env` (puedes copiar `.env.example` si existiera, o crearlo manualmente).
    *   Asegúrate de que `DATABASE_URL` apunte a la base de datos Docker:
        ```env
        DATABASE_URL="postgresql://codex_user:codex_password@localhost:5432/codex_db?schema=public"
        ```
    *   Asegúrate de que `REDIS_URL` apunte a Redis (si el compose lo incluye, usualmente `redis://localhost:6379`).
    *   **IMPORTANTE:** Configura un `JWT_SECRET` y `SESSION_SECRET` seguros en el archivo `.env`.
    *   Verifica que `PORT` esté configurado (ej: `PORT=3004`) y `RUST_SERVICE_URL` apunte al puerto correcto (ej: `http://localhost:3002/generate`).
    *   Define `ALLOWED_ORIGINS` incluyendo las URLs de tu frontend (ej: `http://localhost:3000,http://192.168.1.XX:3000`).
3.  **Variables de Entorno Frontend:**
    *   En `frontend/`, asegúrate de que `.env.local` tenga las URLs correctas para `NEXT_PUBLIC_BACKEND_URL` (ej: `http://localhost:3004`) y `NEXT_PUBLIC_RUST_SERVICE_URL` (ej: `http://localhost:3002`).
4.  **Migración y Seeding de Base de Datos:**
    *   Navega a la carpeta `backend/` en tu terminal.
    *   Ejecuta la migración inicial: `npx prisma migrate dev --name init` (o `npm run prisma:migrate`)
    *   (Opcional) Puebla la base de datos: `npm run seed`

### Ejecución (Desarrollo)

Necesitarás iniciar los componentes en terminales separadas (después de `docker-compose up -d`):

```bash
# Terminal 1: Backend (API Gateway)
# (Navega a la carpeta `backend/`)
npm run dev  # Ejecuta en http://localhost:3004 (o el puerto de tu .env)

# Terminal 2: Servicio Rust (Generador)
# (Navega a la carpeta `rust_generator/`)
cargo run # O --release si prefieres. Ejecuta en http://localhost:3002

# Terminal 3: Frontend
# (Navega a la carpeta `frontend/`)
npm run dev  # Ejecuta en http://localhost:3000 (o el siguiente puerto libre, ej: 3001)
```

Accede al frontend en la URL que indique la Terminal 3. Accede a Grafana en `http://localhost:3030` y a Prometheus en `http://localhost:9090` (según `docker-compose.yml`).

## 📈 Estado de Implementación

El proyecto ha superado la fase MVP y se encuentra en desarrollo activo de características Beta/Producción. Se han implementado:

- Generación de códigos vía servicio Rust.
- Autenticación/Autorización básica con JWT/API Keys y persistencia en PostgreSQL (Prisma).
- Dashboard frontend con estado del sistema y analíticas básicas del servicio Rust.
- Monitoreo operacional básico del backend vía Prometheus/Grafana.

**Para detalles sobre funcionalidades específicas y el roadmap futuro, consultar [CODEX.md](CODEX.md).**

## 🗺️ Próximos Pasos (Plan de Mejoras)

Consultar las secciones **Roadmap de Desarrollo (13)** y **Mantenimiento y Calidad de Código (17)** en [CODEX.md](CODEX.md) para la planificación detallada.

## 📚 Documentación Adicional

- [CODEX.md](CODEX.md): Documento estratégico y hoja de ruta del proyecto.
- [backend/README.md](backend/README.md): Documentación específica del backend.
- [frontend/README.md](frontend/README.md): Documentación específica del frontend.
- [rust_generator/API_DOCS.md](rust_generator/API_DOCS.md): Documentación de la API del servicio Rust.

## 🤝 Contribución

(A definir)

## 📄 Licencia

(A definir)