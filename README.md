# Codex (Nombre Clave Provisional)

Plataforma web moderna y potente para la generación online de códigos de barras y QR. Enfocada en rendimiento, experiencia de usuario superior, flexibilidad y escalabilidad.

*(Desarrollado en colaboración con asistentes de IA bajo supervisión humana).*

## Tecnologías Principales

* **Frontend:** Next.js (v15+ con App Router), React, Tailwind CSS, TypeScript
* **Backend (API Gateway):** Node.js (v22+), Express, TypeScript
* **Backend (Núcleo Generador):** Rust, Axum, Tokio, `rxing`
* **Base de Datos (Planificada):** PostgreSQL, Redis
* **Infraestructura (Planificada):** Docker, Kubernetes, Cloud (Proveedor TBD)

## Estructura del Proyecto

Este repositorio utiliza un enfoque "monorepo" simple que contiene los diferentes servicios/aplicaciones:

* `frontend/`: Contiene la aplicación web Next.js que representa la interfaz de usuario con la que interactúan los usuarios finales.
* `backend/`: Contiene la API principal (API Gateway) construida con Node.js y Express. Maneja las peticiones del frontend, la lógica de negocio general (futuros usuarios/planes) y se comunica con el núcleo de generación en Rust.
* `rust_generator/`: Contiene el microservicio de alto rendimiento construido con Rust y Axum. Es el responsable exclusivo de generar los códigos de barras/QR usando la librería `rxing`.

## Ejecución en Entorno de Desarrollo

Sigue estos pasos para poner en marcha el proyecto en tu máquina local.

**1. Prerrequisitos:**

* **Git:** Instalado ([https://git-scm.com/downloads](https://git-scm.com/downloads))
* **Node.js:** Versión 22+ recomendada (Instalar desde [https://nodejs.org/](https://nodejs.org/) o usando NVM / nvm-windows).
* **Rust:** Instalado a través de `rustup` ([https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)).

**2. Clonar Repositorio:**

```bash
# Reemplaza con la URL HTTPS de tu repositorio en GitHub
git clone [https://github.com/capta1nfire/Codex.git](https://github.com/capta1nfire/Codex.git)
cd Codex