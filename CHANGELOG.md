# Changelog

Todos los cambios significativos en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [No publicado]

### Añadido
- Sistema de monitoreo de estado con endpoint `/health`
- Modal visual para mostrar el estado del sistema
- Documentación estratégica CODEX.md
- Implementación de CORS en el servicio Rust para comunicación entre servicios

### Mejorado
- Optimización de la interfaz de usuario para mejor contraste
- Validación de datos de entrada en el backend
- Actualización del README con características actuales
- Limpieza de dependencias innecesarias en el componente Rust (eliminadas base64 y wasm-bindgen)
- Mejora en la estructura del proyecto Rust con enfoque en binario principal

## [0.2.0] - 2025-04-10

### Añadido
- Dashboard de métricas para analizar el rendimiento del sistema
- Endpoint de estado para el servicio Rust
- Caché de resultados para mejorar rendimiento

### Corregido
- Problema con la visualización en Safari
- Error de validación en códigos EAN-13

## [0.1.0] - 2025-03-28

### Añadido
- Estructura inicial del proyecto
- Interfaz básica de generación de códigos
- Soporte para QR, Code128 y otros formatos básicos
- Exportación en formato SVG

## [Frontend Restructuring - Current Date]

This changelog documents the changes made to the frontend during the restructuring process.

**Summary**

The frontend has undergone a significant restructuring to enhance its maintainability, scalability, and user experience. The core objectives were to create a clean, modern, intuitive, customizable, responsive, multilingual, and accessible application, using modern technologies.

**Phases**

The restructuring process was divided into four main phases:

**Phase 1: Structure and Base Components**

*   **Tasks:**
    *   Created the new folder structure to organize the code.
    *   Created the base components:
        *   `Navbar`
        *   `Footer`
        *   `SelectorDeTipoDeCodigo`
        *   `Formulario`
        *   `VistaPrevia`
        *   `BotonesDeAccion`
        *   `Ayuda`
        * `LanguageSelector`
    *   Implemented the basic logic for the `SelectorDeTipoDeCodigo`.
    * Created the multilanguage logic.
    * Created the zustand logic.
    *   Modified `layout.tsx` to use the new components.
    *   Modified `page.tsx` to use the new components.
    * Created the `utils.ts` file.
    * Remove unused folders and files.
* **Objective**: Established the base of the project, with a clear organization and the main components in place.

**Phase 2: Main Logic of the Generator**

*   **Tasks:**
    *   Implemented the logic of `Formulario` to dynamically generate the necessary fields based on the selected code type.
    *   Implemented the logic of `VistaPrevia` to update in real-time.
    *   Implemented the `BotonesDeAccion` logic (generate, download, share, clean).\n    *   Implemented the logic of the help button.\n*   **Objective:** Implemented the core functionality of the code generator.\n\n**Phase 3: Dashboard**\n\n*   **Tasks:**\n    *   Created the new `Dashboard` structure:\n        * `layout.tsx`\n        * `page.tsx`\n        * `metrics/page.tsx`\n        * `user/page.tsx`\n    * Created the user components:\n        * `generated-codes.tsx`\n        * `profile.tsx`\n        * `plans.tsx`\n        * `api-tokens.tsx`\n    * Created the metrics components:\n        * `performance-chart.tsx`\n        * `barcode-type-metrics.tsx`\n        * `cache-metrics-table.tsx`\n    *   Modified `Navbar` to add the necessary links.\n* **Objective**: Implemented the new dashboard with its structure and options.\n\n**Phase 4: Personalization and Validation**\n\n*   **Tasks:**\n    *   Implemented real-time field validation in `Formulario`.\\\n    *   Implemented the code personalization system:\n        *   Colors\n        *   Size\n        *   Logo\n        *   Format\n        * Error correction\n    *   Implemented the bulk upload system (CSV).\n    *   Implemented the share system.\n    *   Implemented a simulated scan tracking system.\n    *   Implemented a basic caching system.\n*   **Objective:** Implemented the advanced personalization and validation features.\n\n**Technologies**\n\n*   Next.js\n*   Tailwind CSS\n*   lucide-react\n*   Shadcn UI\n*   Zustand\n* React\n\n**Authors**\n\n* \\[Your User]\n* AI assistant