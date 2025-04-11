# Actualización del README.md con las Mejoras Implementadas

Aquí tienes una versión actualizada del README.md que incluye las mejoras que hemos implementado:

```markdown
# Codex - Generador de Códigos Avanzado

Plataforma web moderna y potente para la generación online de códigos de barras y QR. Enfocada en rendimiento, experiencia de usuario superior, flexibilidad y escalabilidad.

*(Desarrollado en colaboración con asistentes de IA bajo supervisión humana).*

## Tecnologías Principales

* **Frontend:** Next.js (v15+ con App Router), React, Tailwind CSS, TypeScript
* **Backend (API Gateway):** Node.js (v22+), Express, TypeScript
* **Backend (Núcleo Generador):** Rust, Axum, Tokio, `rxing`, DashMap (caché)
* **Base de Datos (Planificada):** PostgreSQL, Redis
* **Infraestructura (Planificada):** Docker, Kubernetes, Cloud (Proveedor TBD)

## Estructura del Proyecto

Este repositorio utiliza un enfoque "monorepo" simple que contiene los diferentes servicios/aplicaciones:

* `frontend/`: Contiene la aplicación web Next.js que representa la interfaz de usuario con la que interactúan los usuarios finales.
* `backend/`: Contiene la API principal (API Gateway) construida con Node.js y Express. Maneja las peticiones del frontend, la lógica de negocio general (futuros usuarios/planes) y se comunica con el núcleo de generación en Rust.
* `rust_generator/`: Contiene el microservicio de alto rendimiento construido con Rust y Axum. Es el responsable exclusivo de generar los códigos de barras/QR usando la librería `rxing`. [Ver documentación de la API](rust_generator/API_DOCS.md).

## Estado Actual del Proyecto

- ✅ **Núcleo generador (Rust)**: Implementación completa con soporte para múltiples tipos de códigos
- ✅ **Validaciones**: Sistema de validación específica según tipo de código
- ✅ **API REST**: Endpoints funcionales con manejo de errores robusto
- ✅ **Monitoreo**: Endpoints de estado y health check con métricas en tiempo real
- ✅ **Sistema de Caché**: Implementado caché LRU para optimizar generaciones repetidas
- ✅ **Documentación de API**: Documentación completa de endpoints y formatos
- 🔄 **API Gateway (Node.js)**: En desarrollo
- 🔄 **Frontend (Next.js)**: En desarrollo
- 📅 **Sistema de usuarios**: Planificado
- 📅 **Despliegue en contenedores**: Planificado

## Características del Núcleo Generador (Rust)

- **Rendimiento Optimizado**: Generación rápida de SVGs con código nativo Rust
- **Sistema de Caché**: Implementación LRU para generaciones repetidas, reduciendo tiempos de respuesta
- **Sistema de Caché TTL**: Optimización con caché que soporta tiempo de vida configurable por solicitud
- **Métricas Avanzadas**: Análisis detallado de rendimiento por tipo de código
- **Métricas en Tiempo Real**: Monitoreo de solicitudes, errores y estadísticas de caché
- **Normalización de Tipos**: Procesamiento inteligente de tipos de códigos (qrcode, qr-code, qr_code → qr)
- **Validación Robusta**: Validación específica según el tipo de código
- **Gestión de Memoria**: Optimización para evitar consumo excesivo en métricas y caché
- **Gestión de Errores**: Respuestas de error claras con sugerencias y códigos
- **Endpoints de Administración**: Interfaz completa para gestión y monitoreo

## Ejecución en Entorno de Desarrollo

Sigue estos pasos para poner en marcha el proyecto en tu máquina local.

**1. Prerrequisitos:**

* **Git:** Instalado ([https://git-scm.com/downloads](https://git-scm.com/downloads))
* **Node.js:** Versión 22+ recomendada (Instalar desde [https://nodejs.org/](https://nodejs.org/) o usando NVM / nvm-windows).
* **Rust:** Instalado a través de `rustup` ([https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)).

**2. Clonar Repositorio:**

```bash
# Reemplaza con la URL HTTPS de tu repositorio en GitHub
git clone https://github.com/capta1nfire/Codex.git
cd Codex
```

**3. Configurar el Núcleo Generador (Rust):**

```bash
cd rust_generator
cargo build
cargo run
```

El servicio de generación de códigos estará disponible en http://localhost:3002.

**4. Configurar API Gateway (Backend Node.js):**

```bash
cd ../backend
npm install
npm run dev
```

**5. Configurar Frontend (Next.js):**

```bash
cd ../frontend
npm install
npm run dev
```

## Desarrollo

### Configuración del Entorno

1. Clonar el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd Codex/frontend
```

## Endpoints del Servicio Rust (puerto 3002)

| Endpoint | Método | Descripción |
|---------|--------|-------------|
| `/generate` | POST | Genera un código de barras/QR en formato SVG |
| `/status` | GET | Devuelve estadísticas generales del servicio |
| `/health` | GET | Endpoint simple para health checks |
| `/cache/clear` | POST | Limpia la caché del sistema |
| `/cache/config` | POST | Configura parámetros de la caché (TTL) |
| `/analytics/performance` | GET | Obtiene métricas detalladas de rendimiento |

## Personalización del TTL
Ahora es posible especificar un TTL personalizado por solicitud:

```json
{
  "barcode_type": "qrcode",
  "data": "Ejemplo con TTL personalizado",
  "options": {
    "scale": 3,
    "ttlSeconds": 3600  // TTL personalizado en segundos
  }
}
```

## Registro de Progreso

### 10 de Abril, 2025 - Mejoras en la Interfaz de Usuario

#### Cambios Realizados:
- ✅ Solucionados problemas de configuración con Tailwind CSS
- ✅ Optimizada la estructura del archivo globals.css para mejorar la compatibilidad
- ✅ Recuperada la funcionalidad completa del generador de códigos
- ✅ Establecida base para la integración con la API backend

#### Próximos Pasos:
- Completar la integración con el servidor backend para la generación de códigos
- Implementar funcionalidades adicionales en la interfaz (personalización avanzada)
- Añadir soporte para usuarios móviles y mejorar la responsividad
- Optimizar el rendimiento de la aplicación

#### Tecnologías Utilizadas:
- Next.js 15.2.4
- Tailwind CSS 3.4.0
- Headless UI para componentes interactivos

## Documentación

* **[API del Generador de Códigos (Rust)](rust_generator/API_DOCS.md)**: Documentación completa de endpoints, parámetros y respuestas
* **API Gateway (Próximamente)**: Documentación en desarrollo
* **Guía de Contribución (Próximamente)**: Pautas para colaborar en el proyecto

## Licencia

[Especificar la licencia que estés utilizando]