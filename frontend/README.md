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

## Configuración

El frontend utiliza variables de entorno para la configuración:

```bash
# .env.local (Crear este archivo en la raíz de /frontend si no existe)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3004 # Puerto actualizado
NEXT_PUBLIC_RUST_SERVICE_URL=http://localhost:3002
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
