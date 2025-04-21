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

## Estructura del Proyecto

```
frontend/
├── src/                      # Código fuente principal
│   ├── components/           # Componentes reutilizables (Navbar, SystemStatus, UserProfile, etc.)
│   │   └── ui/               # Componentes UI base (generados por Shadcn/CLI)
│   ├── lib/                  # Utilidades (ej: utils.ts)
│   └── app/                  # Rutas y layouts (App Router de Next.js)
│       ├── layout.tsx        # Layout principal de la aplicación
│       ├── page.tsx          # Página principal (generador de códigos)
│       ├── dashboard/        # Sección de dashboard (métricas, etc.)
│       │   └── ...
│       ├── profile/          # Página de perfil de usuario
│       │   └── ...
│       ├── login/            # Página de inicio de sesión
│       │   └── ...
│       ├── register/         # Página de registro
│       │   └── ...
│       └── globals.css       # Estilos globales (importados en layout.tsx)
├── public/                   # Archivos estáticos (imágenes, fuentes, etc.)
├── next.config.mjs           # Configuración de Next.js (ahora .mjs)
├── tailwind.config.ts        # Configuración de Tailwind CSS (ahora .ts)
├── postcss.config.mjs        # Configuración de PostCSS (ahora .mjs)
├── tsconfig.json             # Configuración de TypeScript
└── package.json              # Dependencias y scripts
```

## Tecnologías Utilizadas

- **Next.js 15**: Framework React con App Router
- **React 18**: Biblioteca UI con hooks y componentes funcionales
- **Tailwind CSS**: Framework CSS utility-first
- **Headless UI**: Componentes accesibles y sin estilos predefinidos
- **Lucide Icons**: Iconos SVG modernos y personalizables
- **TypeScript**: Tipado estático para mayor robustez

## Componentes Principales

### Generador de Códigos

El componente principal para la generación de códigos de barras ubicado en `app/page.tsx`:

- Formulario interactivo para ingresar datos y seleccionar tipo de código
- Panel de opciones avanzadas (escala, corrección de errores)
- Previsualización en tiempo real
- Funcionalidad de descarga e impresión

### Dashboard de Métricas

Visualización de métricas del sistema ubicado en `app/dashboard/metrics/page.tsx`:

- Estadísticas generales del sistema
- Detalles de rendimiento del caché
- Visualización por tipo de código
- Actualización automática cada 30 segundos

### SystemStatus

Componente para monitorear el estado de los servicios:

- Estado de servicios frontend, backend y Rust
- Información detallada de cada servicio
- Actualización automática

### Navbar

Barra de navegación mejorada con diseño optimizado:

- Enlaces principales horizontales junto al logo
- Menú responsivo para dispositivos móviles
- Alto contraste visual para mejor experiencia de usuario
- Soporte para autenticación de usuarios

## Configuración

El frontend utiliza variables de entorno para la configuración:

```bash
# .env.local (Crear este archivo en la raíz de /frontend si no existe)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3004 # Puerto actualizado
NEXT_PUBLIC_RUST_SERVICE_URL=http://localhost:3002
```

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
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
