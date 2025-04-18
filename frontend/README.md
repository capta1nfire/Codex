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
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/               # Componentes UI base (button, card, etc.)
│   │   ├── Navbar.tsx        # Componente de barra de navegación
│   │   ├── SystemStatus.tsx  # Componente de monitoreo de estado del sistema
│   │   └── UserProfile.tsx   # Componente de perfil de usuario
│   └── app/                  # Rutas de la aplicación (App Router de Next.js)
├── app/                      # Estructura de páginas y layouts
│   ├── layout.tsx            # Layout principal de la aplicación
│   ├── page.tsx              # Página principal (generador de códigos)
│   ├── dashboard/            # Sección de dashboard
│   │   ├── layout.tsx        # Layout específico del dashboard
│   │   ├── metrics/          # Páginas de métricas
│   │   │   ├── page.tsx      # Vista principal de métricas
│   │   │   └── components/   # Componentes específicos de métricas
│   ├── profile/              # Sección de perfil de usuario
│   └── generator/            # Páginas del generador de códigos
├── public/                   # Archivos estáticos
├── next.config.js            # Configuración de Next.js
├── tailwind.config.js        # Configuración de Tailwind CSS
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
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3003
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
