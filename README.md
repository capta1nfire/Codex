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
    *   En la carpeta raíz (`Codex/`), ejecuta:
        ```bash
        docker-compose up -d
        ```
