# Codex Frontend

Frontend moderno para la plataforma Codex de generación de códigos de barras y QR, desarrollado con Next.js y Tailwind CSS.

## Características

- **Generación de Códigos**: Interfaz intuitiva para la generación de múltiples tipos de códigos:
  - QR Code
  - Code 128
  - PDF417
  - EAN-13
  - UPC-A
  - Code 39
  - DataMatrix
- **Personalización**: Opciones para personalizar la generación de códigos:
  - Escala (tamaño)
  - Nivel de corrección de errores para QR
  - **Sistema de Gradientes SVG**: Gradientes continuos para códigos QR con bordes opcionales
- **Visualización en Tiempo Real**: Previsualización inmediata de los códigos generados
- **Exportación**: Descarga de códigos en formato SVG
- **Diseño Responsivo**: Interfaz adaptable a dispositivos móviles y de escritorio
- **Dashboard de Métricas**: Visualización detallada del rendimiento del sistema:
  - Estadísticas de caché
  - Métricas por tipo de código
  - Tiempos de respuesta
- **Sistema de Monitoreo**: Componente para visualizar el estado de los servicios
- **Interfaz Moderna**: Diseño atractivo con Tailwind CSS y componentes UI personalizados
- **Navegación Mejorada**: Barra de navegación con alto contraste y disposición optimizada
- **Corrección de Errores:** Solucionado problema crítico de visualización al cambiar tipos de código.
- **Mejoras UI:** Añadidos botones de descarga/impresión, mejorada alineación visual.
- **UI Adaptativa por Perfil:** Implementada interfaz del generador que muestra diferentes opciones según el perfil de usuario (Gratuito/Pro/Enterprise).
- **Monitoreo de Errores**: Integrado con Sentry para la detección y diagnóstico de errores en tiempo real.

## Estructura del Proyecto

```
frontend/
├── src/                      # Código fuente principal
│   ├── app/                  # Rutas y layouts (App Router de Next.js)
│   │   ├── layout.tsx        # Layout principal de la aplicación
│   │   ├── page.tsx          # Página principal (Generador de Códigos)
│   │   ├── dashboard/        # Sección de Dashboard (métricas, etc.)
│   │   ├── login/            # Página de Inicio de Sesión
│   │   ├── profile/          # Página de Perfil de Usuario
│   │   ├── register/         # Página de Registro
│   │   ├── status/           # Página de Estado del Sistema
│   │   ├── global-error.tsx  # Manejador global de errores (instrumentado con Sentry)
│   │   └── globals.css       # Estilos globales (importados en layout.tsx)
│   ├── components/           # Componentes React reutilizables
│   │   ├── ui/               # Componentes base de Shadcn UI (Button, Input, etc.)
│   │   ├── Navbar.tsx
│   │   ├── ProfilePicture.tsx
│   │   └── SystemStatus.tsx
│   │   └── ... (otros componentes específicos)
│   ├── context/              # Contextos React para gestión de estado global
│   │   └── AuthContext.tsx   # Contexto para manejar autenticación y datos del usuario
│   ├── lib/                  # Utilidades, hooks personalizados, etc.
│   │   └── utils.ts          # Funciones de utilidad generales
│   ├── instrumentation.ts    # Configuración de Sentry para Server/Edge (Next.js Instrumentation Hook, exporta 'register' y 'onRequestError')
│   └── instrumentation-client.ts # Configuración de Sentry para Client (Next.js Client Instrumentation, exporta 'onRouterTransitionStart')
├── public/                   # Archivos estáticos (imágenes, fuentes, etc.)
├── .env.local.example        # Archivo de ejemplo para variables de entorno
├── components.json           # Configuración de Shadcn UI
├── next.config.ts            # Configuración de Next.js
├── tailwind.config.js        # Configuración de Tailwind CSS
├── postcss.config.js         # Configuración de PostCSS
├── tsconfig.json             # Configuración de TypeScript
├── package.json              # Dependencias y scripts
└── README.md                 # Este archivo
```

## Tecnologías Utilizadas

- **Next.js 15**: Framework React con App Router
- **React 18**: Biblioteca UI con hooks y componentes funcionales
- **Tailwind CSS**: Framework CSS utility-first
- **Headless UI**: Componentes accesibles y sin estilos predefinidos
- **Lucide Icons**: Iconos SVG modernos y personalizables
- **TypeScript**: Tipado estático para mayor robustez
- **Sentry**: Plataforma de monitoreo de errores y rendimiento.

## Componentes Principales

### `AuthContext` (`src/context/AuthContext.tsx`)

- Gestiona el estado global de autenticación, los datos del usuario logueado y el token JWT.
- Proporciona funciones para login, logout, registro y actualización de datos del usuario.
- Envuelve la aplicación en `src/app/layout.tsx` para dar acceso al estado de autenticación en toda la app.

### Generador de Códigos (`src/app/page.tsx`)

- Interfaz principal para seleccionar tipo de código, ingresar datos y configurar opciones.
- Muestra previsualización en tiempo real y permite descargar el SVG.

### Dashboard de Métricas (`src/app/dashboard/...`)

- Visualiza métricas de rendimiento obtenidas del backend y del servicio Rust.
- Incluye estadísticas de caché, tasa de aciertos, tiempos de respuesta, etc.

### Perfil de Usuario (`src/components/UserProfile.tsx`)

- Permite al usuario ver y editar su información de perfil (nombre, apellido, username).
- Gestiona la subida y selección de imágenes de perfil (avatares).
- Permite generar y visualizar la API Key.

### Estado del Sistema (`src/app/status/page.tsx` y `src/components/SystemStatus.tsx`)

- Muestra el estado de conectividad y salud del API Gateway y el servicio Rust.

### `Navbar` (`src/components/Navbar.tsx`)

- Barra de navegación principal.
- Muestra enlaces diferentes según el estado de autenticación del usuario.
- Incluye el menú desplegable del perfil de usuario.

### `ProfilePicture` (`src/components/ui/ProfilePicture.tsx`)

- Componente reutilizable para mostrar la imagen de perfil del usuario (avatar personalizado, predeterminado o iniciales).

### Detalles de Componentes del Generador (`src/components/generator/`)

Esta sección detalla los componentes React responsables de la interfaz de generación de códigos de barras y QR.

#### 1. `BarcodeTypeSelector.tsx`
   - **Propósito:** Renderiza el selector desplegable para que el usuario elija el tipo de código de barras a generar (ej. QR Code, Code 128, etc.).
   - **Lógica de Roles:** Actualmente, este componente muestra **todos** los tipos de códigos de barras disponibles (`ALL_BARCODE_TYPES`) a todos los usuarios, independientemente de su rol. La constante `BASIC_BARCODE_TYPES` existe en el código pero no se utiliza activamente para restringir la lista por rol.
   - **Props Clave:** `control` (de react-hook-form), `isLoading`, `handleTypeChange`, `errors`.

#### 2. `GenerationOptions.tsx`
   - **Propósito:** Es el **componente contenedor principal** para todas las opciones de personalización del código de barras. Organiza las opciones en una estructura de pestañas.
   - **Estructura de Pestañas:**
      - **Pestaña "Apariencia":** Contiene opciones comunes como Escala (`scale`), Color de Frente (`fgcolor`), y Color de Fondo (`bgcolor`). Estas opciones están definidas directamente dentro de `GenerationOptions.tsx` en la constante `appearanceOptions`.
      - **Pestaña "Visualización":** Contiene opciones como Altura (`height` para códigos 1D), Mostrar Texto (`includetext` para códigos 1D), y Nivel de Corrección de Errores (`ecl` para QR Code). Estas opciones están definidas directamente dentro de `GenerationOptions.tsx` en la constante `displayOptions`. La visibilidad de algunas de estas opciones (ej. Altura) depende del `selectedType` de código.
      - **Pestaña "Avanzado":** Renderiza dinámicamente el componente `AdvancedBarcodeOptions.tsx`.
   - **Lógica de Roles:** Actualmente, este componente muestra la estructura completa de pestañas ("Apariencia", "Visualización", "Avanzado") y todas las opciones contenidas en ellas a **todos los usuarios**, independientemente de su `userRole`. La prop `userRole` se recibe (para compatibilidad con `page.tsx`) pero no se utiliza para condicionar la visibilidad de las opciones o pestañas.
   - **Props Clave:** `control`, `errors`, `watch`, `isLoading`, `userRole` (recibida pero no usada para lógica de UI), `selectedType`, `reset`.

#### 3. `AdvancedBarcodeOptions.tsx`
   - **Propósito:** Renderiza las opciones de personalización **específicas y avanzadas** para cada tipo de código de barras (ej. Versión QR, Code Set para Code128, etc.). Se carga dinámicamente y se muestra dentro de la pestaña "Avanzado" de `GenerationOptions.tsx`.
   - **Lógica de Roles:** Este componente **no contiene lógica de roles** interna. Muestra diferentes conjuntos de opciones únicamente basándose en la prop `selectedType`.
   - **Props Clave:** `control`, `errors`, `watch`, `isLoading`, `selectedType`, `reset`.

#### Flujo de Datos y Lógica de Roles (Actual) en el Generador

1.  `frontend/src/app/page.tsx` (la página principal del generador) obtiene el `userRole`.
2.  `page.tsx` renderiza `BarcodeTypeSelector` (que muestra todos los tipos a todos los roles).
3.  `page.tsx` renderiza `GenerationOptions`, pasándole el `userRole`.
4.  `GenerationOptions` (actualmente):
    *   **No usa `userRole`** para restringir la visibilidad de las pestañas "Apariencia", "Visualización" o "Avanzado". Todas son visibles para todos.
    *   Muestra directamente las opciones de "Apariencia" y "Visualización".
    *   En la pestaña "Avanzado", renderiza `AdvancedBarcodeOptions`.
5.  `AdvancedBarcodeOptions` muestra las opciones detalladas según el `selectedType`, sin depender del `userRole`.

**Conclusión sobre Roles y Opciones Visibles (Actual) en el Generador:**
A fecha de esta documentación, **todos los tipos de códigos de barras y todas sus opciones de personalización (básicas y avanzadas) son visibles y accesibles para todos los roles de usuario** a través de la estructura de pestañas en `GenerationOptions.tsx`. La diferenciación por roles para estas características ha sido neutralizada.

## Configuración

El frontend utiliza variables de entorno para la configuración:

```bash
# .env.local (Crear este archivo en la raíz de /frontend si no existe)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3004 # Puerto actualizado
NEXT_PUBLIC_RUST_SERVICE_URL=http://localhost:3002

# Nota sobre Sentry:
# La integración con Sentry (incluyendo el DSN) se configura a través de los archivos
# `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, 
# y `src/instrumentation-client.ts`, gestionados inicialmente por el Sentry Wizard.
# No se requiere la variable NEXT_PUBLIC_SENTRY_DSN en .env.local con la configuración actual.
```

## Instalación y Desarrollo

Consulta el [README principal](../README.md) para instrucciones detalladas sobre cómo instalar dependencias, configurar variables de entorno y ejecutar el frontend junto con el resto de componentes del sistema.

Los comandos básicos para el desarrollo del frontend (una vez instaladas las dependencias) son:

```bash
# Iniciar servidor de desarrollo (normalmente en http://localhost:3000)
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción (después de compilar)
npm start
```

## Próximas Mejoras

- Implementación de selección de colores para los códigos
- Exportación a formato PNG
- Modo oscuro para la interfaz
- Mejoras de accesibilidad
- Integración con sistemas de autenticación
- Generación de códigos por lotes

## Documentación Relacionada

- [README principal](../README.md): Documentación general del proyecto
- [CHANGELOG.md](../CHANGELOG.md): Historial de cambios
- [Sistema de Gradientes SVG](../docs/SVG_GRADIENT_SYSTEM.md): Documentación técnica completa del sistema de gradientes
