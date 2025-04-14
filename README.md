# PILAR-CODE

## Descripción del Proyecto

PILAR-CODE es una aplicación web completa que permite a los usuarios generar diversos tipos de códigos de barras y códigos QR de forma rápida y sencilla. Ofrece un amplio abanico de opciones de personalización y cuenta con un completo panel de control para el usuario. El objetivo del proyecto es ofrecer una herramienta robusta, eficiente y accesible para la generación y gestión de códigos.

## Backend

El proyecto está dividido en diferentes backends, cada uno con un objetivo especifico:
* **API Gateway** : Se encarga de gestionar las diferentes peticiones de los diferentes frontends y redirigirlas a los diferentes backends.
* **Generator Backend**: Este se encarga de gestionar la generacion de los diferentes tipos de codigos.
* **Metrics Backend**: Este se encarga de gestionar las metricas de la aplicacion.

## Frontend

### Descripción General del Frontend

El frontend de PILAR-CODE es una aplicación web moderna e interactiva construida con Next.js. Se ha diseñado para ser intuitiva, fácil de usar y completamente personalizable. El objetivo es proporcionar a los usuarios una experiencia fluida al generar y gestionar códigos.

### Objetivos Alcanzados en la Reestructuración

En esta fase de reestructuración del frontend, se han logrado los siguientes objetivos, basados en el prompt inicial:

*   **Interfaz Limpia y Moderna:** Se ha rediseñado la interfaz para que sea más limpia, organizada y visualmente atractiva.
*   **Intuitiva y Fácil de Usar:** Se ha mejorado la usabilidad y la navegación para que la aplicación sea más intuitiva.
*   **Personalizable:** Se ha implementado un sistema de personalización que permite modificar colores, tamaño, agregar logos y elegir formatos de descarga.
*   **Vista Previa en Tiempo Real:** Se ha añadido una vista previa que se actualiza en tiempo real a medida que se realizan cambios en el formulario.
*   **Responsive:** La aplicación es ahora completamente responsive y se adapta a dispositivos móviles y de escritorio.
*   **Multilingüe:** Se ha implementado un sistema multilingüe para soportar inglés y español.
*   **Accesible:** Se han tenido en cuenta las directrices de accesibilidad WCAG en el diseño y desarrollo.
* **Dashboard**: Se agrego un completo Dashboard, con diferentes secciones.
* **Manejo de errores**: Se agrego un correcto manejo de errores.
* **Cache**: Se implemento un sencillo sistema de cache.
* **Seguimiento de escaneos**: se agrego un sistema ficticio de seguimiento de escaneos.
* **Bulk Upload**: Se agrego la opcion de bulk upload.

### Tecnologías Utilizadas

*   **Framework:** Next.js.
*   **Estilos:** Tailwind CSS.
*   **Iconos:** `lucide-react`.
*   **Componentes:** `Shadcn UI`.
*   **Manejo de Estado:** `Zustand`.
* **Comunicaciones**: `Fetch`.

### Estructura del Proyecto (Frontend)

La nueva estructura de carpetas del frontend es la siguiente:
```
frontend/src
    ├── app/               # Rutas principales (páginas)
    │   ├── (generator)/   # Rutas del generador (ahora en un grupo de ruta)
    │   │   ├── page.tsx    # Página principal del generador
    │   ├── (dashboard)/  # Rutas del dashboard
    │   │   ├── layout.tsx # layout del dashboard
    │   │   ├── page.tsx # pagina principal del dashboard
    │   │   ├── metrics/ # ruta de las metricas
    │   │   │   ├── components/
    │   │   │   │   ├── performance-chart.tsx
    │   │   │   │   ├── barcode-type-metrics.tsx
    │   │   │   │   ├── cache-metrics-table.tsx
    │   │   │   ├── page.tsx
    │   │   ├── user/ # ruta para el usuario
    │   │   │   ├── components/
    │   │   │   │   ├── generated-codes.tsx
    │   │   │   │   ├── profile.tsx
    │   │   │   │   ├── plans.tsx
    │   │   │   │   ├── api-tokens.tsx
    │   │   │   ├── page.tsx
    │   ├── layout.tsx      # Layout principal de la aplicación
    │   └── globals.css    # Estilos globales
    ├── components/         # Componentes UI genéricos
    │   ├── ui/             # Componentes de Shadcn UI
    │   │   └── button.tsx  # Componente Button (ejemplo)
    │   └── common/        # Componentes comunes para la aplicación
    │       ├── Navbar.tsx
    │       ├── Footer.tsx
    │       ├── SelectorDeTipoDeCodigo.tsx
    │       ├── Formulario.tsx
    │       ├── VistaPrevia.tsx
    │       ├── BotonesDeAccion.tsx
    │       ├── Ayuda.tsx
    │       └── LanguageSelector.tsx # selector para el idioma
    ├── lib/                # Librerías y utilidades
    │   └── utils.ts        # Funciones de utilidad (cn, etc.)
    ├── locales/            # Archivos de traducción
    │   ├── es.json
    │   └── en.json
    ├── hooks/              # Hooks personalizados
    │   └── use-translations.tsx # Hook para la gestion de traducciones
    ├── types/             # Tipos
    │   └── translations.ts # Tipos para la gestion de traducciones
    ├── zustand/             # Zustand
    │   └── use-store.ts
    └── ...
```
### Fases Implementadas

La reestructuración del frontend se ha llevado a cabo en las siguientes fases:

*   **Fase 1: Estructura y Componentes Base:** Se creó la estructura de carpetas y los componentes principales (`Navbar`, `Footer`, `SelectorDeTipoDeCodigo`, `Formulario`, `VistaPrevia`, `BotonesDeAccion`, `Ayuda`, `LanguageSelector`). También se configuró la lógica básica para multilenguaje y `zustand`.
*   **Fase 2: Lógica Principal del Generador:** Se implementó la lógica central del generador, incluyendo el formulario dinámico, la vista previa en tiempo real, los botones de acción y el modal de ayuda.
*   **Fase 3: Dashboard:** Se crearon todos los archivos necesarios para la estructura del dashboard, agregando las diferentes rutas y layouts.
*   **Fase 4: Personalización y Validación:** Se implementaron las características avanzadas de:
    *   Validación de campos.
    *   Personalización del código (colores, tamaño, logo, formato y corrección de errores).
    *   Carga masiva de datos (CSV).
    *   Sistema para compartir el código generado.
    *   Simulación del seguimiento de escaneos.
    *   Sistema básico de caché.

### Cómo Ejecutar la Aplicación (Localmente)

1.  **Navegar al Directorio:** En tu terminal, ve al directorio `frontend/`.
2.  **Instalar Dependencias:** Ejecuta `npm install` para instalar las dependencias.
3.  **Iniciar el Servidor:** Ejecuta `npm run dev` para iniciar el servidor de desarrollo.
4.  **Acceder en el Navegador:** Abre tu navegador y ve a `http://localhost:3000`.

### Posibles Mejoras Futuras

*   **Autenticación de Usuario:** Implementar un sistema completo de autenticación.
* **Tests**: Agregar tests para los diferentes componentes.
*   **Mejoras en el Dashboard:** Agregar más datos y gráficos al dashboard.
*   **Implementación de PDF:** Implementar la descarga en PDF.
* **Generar link unicos**: Generar links unicos para cada codigo.
*   **Mejoras en la Vista Previa:** Implementar una vista previa del logo en el qr.

### Autores

*   **AI Assistant**
* **Tu Nombre**