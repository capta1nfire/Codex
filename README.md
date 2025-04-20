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

### Backend
- Node.js con Express
- **PostgreSQL** (Base de Datos)
- **Prisma ORM** (Acceso a Datos)
- **Passport.js** (Autenticación JWT, Local)
- **bcrypt** (Hasheo de contraseñas y API Keys)
- Microservicio de generación en Rust (Axum)
- Arquitectura de API Gateway
- Seguridad: Helmet, express-rate-limit, xss-clean, CORS
- Validación: express-validator
- Logging: Winston
- Compresión HTTP: compression

### Infraestructura (Desarrollo)
- **Docker** / **Docker Compose** (para PostgreSQL)

## 🏗️ Arquitectura

El sistema utiliza una arquitectura moderna:

1.  **Frontend (Next.js)**: Interfaz de usuario (React, Tailwind).
2.  **API Gateway (Node.js/Express)**: Gestiona peticiones, autenticación (Passport), orquesta servicios, interactúa con BBDD (Prisma).
3.  **Base de Datos (PostgreSQL)**: Almacenamiento persistente de usuarios (gestionado con Prisma).
4.  **Servicio de Generación (Rust/Axum)**: Núcleo optimizado para la generación de códigos.
5.  **(Futuro)** Caché Externo (Redis), Monitoreo Avanzado (Prometheus/Grafana).

## 🚦 Cómo Iniciar

### Requisitos previos
- Node.js 20.x o superior
- Rust y Cargo (si se modifica/compila el servicio de generación)
- npm o yarn
- **Docker y Docker Compose** (para ejecutar la base de datos PostgreSQL)

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

1.  **Base de Datos:**
    *   Asegúrate de tener Docker corriendo.
    *   En la carpeta raíz (`Codex/`), ejecuta `docker-compose up -d`. Esto iniciará un contenedor PostgreSQL.
2.  **Variables de Entorno Backend:**
    *   En la carpeta `backend/`, renombra `.env.example` a `.env` (o crea `.env`).
    *   Asegúrate de que `DATABASE_URL` apunte a la base de datos Docker:
        ```env
        DATABASE_URL="postgresql://codex_user:codex_password@localhost:5432/codex_db?schema=public"
        ```
    *   **IMPORTANTE:** Configura un `JWT_SECRET` seguro en el archivo `.env`.
    *   Ajusta otras variables si es necesario (puertos, URL de Rust, etc.).
3.  **Migración y Seeding de Base de Datos:**
    *   Navega a la carpeta `backend/` en tu terminal.
    *   Ejecuta la migración inicial: `npx prisma migrate dev --name init` (o `npm run prisma:migrate` si prefieres)
    *   Puebla la base de datos con usuarios iniciales: `npm run seed`

### Ejecución (Desarrollo)

Necesitarás iniciar los tres componentes en terminales separadas:

```bash
# Terminal 1: Base de Datos (si no la iniciaste antes)
# (Asegúrate de estar en la carpeta raíz `Codex/`)
# docker-compose up

# Terminal 2: Backend (API Gateway)
# (Navega a la carpeta `backend/`)
npm run dev  # Ejecuta en http://localhost:3001 (o el puerto de tu .env)

# Terminal 3: Servicio Rust (Generador)
# (Navega a la carpeta `rust_generator/`)
cargo run --release # Asumiendo que se ejecuta aquí
# O inicia tu binario precompilado si lo tienes

# Terminal 4: Frontend
# (Navega a la carpeta `frontend/`)
npm run dev  # Ejecuta en http://localhost:3000
```

## 📈 Estado de Implementación

| Característica             | Estado      | Notas                                                              |
|----------------------------|-------------|--------------------------------------------------------------------|
| Generación básica        | ✅ Completo | Múltiples tipos soportados vía servicio Rust.                      |
| Personalización          | ⚠️ Parcial  | Escala y ECL (QR) implementados. Colores, etc. pendientes.       |
| Exportación              | ⚠️ Parcial  | SVG implementado.                                                  |
| Autenticación/Registro   | ✅ Completo | Registro, Login (JWT), `/me`, API Keys (con hasheo).             |
| Autorización (Roles)     | ✅ Básico   | Roles User/Admin/Premium definidos, middleware `checkRole` básico.   |
| Base de Datos (Usuarios) | ✅ Completo | PostgreSQL con Prisma ORM implementado.                            |
| Monitoreo (`/health`)    | ✅ Básico   | Verifica estado propio y de Rust.                                  |
| Métricas (`/metrics`)    | ⚠️ Parcial  | Solo estadísticas de caché en memoria, tiempos estimados.          |
| Caché (Backend)          | ✅ MVP      | Caché en memoria implementado, necesita migración a Redis.         |
| UI Responsiva            | ✅ Completo | Mejoras aplicadas a Navbar, Forms, Generador, Perfil (4K focus). |
| UI Consistente           | ✅ Parcial  | Generador y Perfil usan componentes UI/tarjetas. Falta Login/Reg/Dash. |
| Seguridad Base           | ✅ Completo | Helmet, Rate Limit, CORS, Validación, XSS, HTTPS opcional.       |
| Manejo Errores Backend   | ✅ Completo | Sistema estructurado y centralizado.                              |
| Logging Backend          | ✅ Completo | Winston configurado (archivos JSON, consola).                      |
| Testing Backend          | ⚠️ Básico   | Estructura Jest lista, necesita más cobertura.                     |

## 🗺️ Próximos Pasos (Plan de Mejoras)

Prioridades basadas en la revisión reciente:

1.  **Base de Datos:** Usar UUIDs para IDs de usuario (`models/user.ts` y `schema.prisma`).
2.  **API Keys:** Optimizar búsqueda `findByApiKey` (actualmente ineficiente).
3.  **Caché:** Migrar caché en memoria a Redis.
4.  **Métricas:** Implementar medición real de tiempos o eliminar estimados.
5.  **Seguridad Logs:** Filtrar/enmascarar datos sensibles (`req.body`) en `errorHandler`.
6.  **UI Consistente:** Aplicar patrón visual (tarjetas, componentes UI) a Login/Registro y Dashboard.
7.  **Testing:** Aumentar cobertura de tests (Backend y Frontend).
8.  **Documentación API:** Generar documentación OpenAPI/Swagger para el backend.
9.  **Organización Rutas Backend:** Mover endpoints de `index.ts` a `src/routes/`.
10. **Personalización Frontend:** Implementar opciones pendientes (colores, etc.).

## 📚 Documentación Adicional

- [Codex.md](Codex.md): Documento estratégico del proyecto (Pilar Code).
- [backend/README.md](backend/README.md): Documentación específica del backend.
- [frontend/README.md](frontend/README.md): Documentación específica del frontend.

## 🤝 Contribución

(A definir)

## 📄 Licencia

(A definir)