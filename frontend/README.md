# Frontend Service - CODEX Web Application

## 1. Propósito del Servicio

El frontend de CODEX es una aplicación web moderna construida con Next.js 14 que proporciona una interfaz intuitiva y profesional para la generación de códigos QR y códigos de barras. Implementa una experiencia de usuario fluida con generación en tiempo real, validación inteligente y un sistema de diseño corporativo sofisticado.

### Responsabilidades Principales
- Interfaz de usuario para generación de códigos QR/barras
- Autenticación y gestión de sesiones de usuario
- Validación y preprocesamiento de datos antes de enviar al backend
- Visualización en tiempo real con preview siempre visible
- Sistema de auto-generación inteligente con debouncing
- Dashboard de monitoreo y analytics
- Gestión de perfiles y planes de usuario

### Lo que NO hace este servicio
- Generación directa de códigos (delegado al backend/Rust)
- Almacenamiento de datos (solo caché temporal)
- Procesamiento de pagos
- Envío de emails o notificaciones

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| Framework | Next.js | 14.2.18 | Framework React con SSR/SSG |
| UI Library | React | 18.3.1 | Biblioteca de componentes |
| Lenguaje | TypeScript | 5.x | Tipado estático |
| Estilos | Tailwind CSS | 3.4.17 | Framework CSS utility-first |
| Componentes | Radix UI | Última | Componentes accesibles |
| Formularios | React Hook Form | 7.56.3 | Gestión de formularios |
| Validación | Zod | 3.24.4 | Esquemas de validación |
| HTTP | Axios | 1.7.9 | Cliente HTTP |
| Iconos | Lucide React | 0.487.0 | Biblioteca de iconos |
| Testing | Vitest + Playwright | 3.1.4 / 1.52.0 | Testing unitario y E2E |

### Dependencias Críticas
- **Backend API**: Sin él no hay funcionalidad (puerto 3004)
- **Next.js**: Framework core de la aplicación
- **AuthContext**: Sistema de autenticación global

---

## 3. Cómo Ejecutar y Probar

### Requisitos Previos
```bash
# Versiones requeridas
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
```

### Instalación
```bash
cd frontend
npm install
```

### Configuración
1. Copiar `.env.example` a `.env.local`
2. Configurar las variables requeridas (ver sección 5)
3. Asegurar que el backend está corriendo en puerto 3004

### Ejecución
```bash
# Desarrollo con hot-reload (Puerto 3000)
npm run dev

# Build para producción
npm run build

# Producción (Puerto 3000)
npm start

# Con PM2 (RECOMENDADO) - Puerto 3000
pm2 start ecosystem.config.js --only codex-frontend
```

**Puerto por defecto:** `3000`  
**URL de acceso:** `http://localhost:3000`

### Testing
```bash
# Tests unitarios
npm test
npm run test:coverage
npm run test:ui

# Tests E2E
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:report

# Linting y formato
npm run lint
npm run format
```

---

## 4. Contrato de API (Interfaces principales)

### Rutas Públicas
- `/` - Generador principal
- `/login` - Página de login
- `/register` - Registro de usuarios
- `/about` - Información del proyecto

### Rutas Protegidas
- `/dashboard` - Dashboard de usuario
- `/profile` - Perfil y configuración
- `/monitoring` - Dashboard de monitoreo (admin)

### Tipos Compartidos con Backend
```typescript
// Tipos de códigos soportados
type BarcodeType = 'qrcode' | 'code128' | 'pdf417' | 'ean13' | 'upca' | 'code39' | 'datamatrix';

// Opciones de generación
interface GenerateOptions {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
  };
}

// Tipos de QR
type QRType = 'link' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard' | 'whatsapp';
```

### Hooks Principales
```typescript
// Generación de códigos
useBarcodeGenerationV2() - Motor v2 de generación
useSmartAutoGeneration() - Auto-generación inteligente
useUrlValidation() - Validación de URLs con metadata

// UI/UX
useTypingTracker() - Tracking de escritura con debounce
useClipboard() - Copiar al portapapeles
useTheme() - Gestión de tema claro/oscuro
```

---

## 5. Variables de Entorno

### Requeridas
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | URL del backend API | `http://localhost:3004` |
| `NEXT_PUBLIC_RUST_SERVICE_URL` | URL del servicio Rust | `http://localhost:3002` |

### Opcionales
| Variable | Descripción | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN de Sentry para monitoreo | `""` |
| `NODE_OPTIONS` | Opciones de Node.js | `--max-old-space-size=4096` |
| `SENTRY_AUTH_TOKEN` | Token de autenticación Sentry | `""` |

---

## 6. Comunicación con Otros Servicios

### Servicios de los que Depende
- **Backend API**: Toda la lógica de negocio - Puerto `3004`
  - Autenticación: `/api/auth/*`
  - Generación: `/api/v2/qr/*`, `/api/v1/barcode`
  - Usuarios: `/api/users/*`

### Servicios que Dependen de Este
- Ninguno (es el punto final de la arquitectura)

---

## 7. Troubleshooting Común

### Problema: "Failed to fetch" o errores de red
**Síntoma**: Errores al intentar generar códigos o autenticarse
**Solución**: 
1. Verificar que el backend está corriendo: `pm2 status codex-backend`
2. Confirmar `NEXT_PUBLIC_BACKEND_URL` en `.env.local`
3. Revisar CORS en el backend

### Problema: Página en blanco o error de hidratación
**Síntoma**: Console muestra "Hydration failed"
**Solución**: 
1. Limpiar caché: `rm -rf .next`
2. Reinstalar dependencias: `rm -rf node_modules && npm install`
3. Verificar que no hay diferencias entre SSR y cliente

### Problema: Auto-generación no funciona
**Síntoma**: No se genera código automáticamente al escribir
**Solución**:
1. Verificar que el tipo de código soporta auto-generación
2. Revisar console para errores de validación
3. Confirmar debounce time (200-500ms según tipo)

---

## 8. Mantenimiento y Monitoreo

### Sistema de Diseño
- **Filosofía**: "Sofisticación Corporativa Global"
- **Colores primarios**: Blue-600 a Blue-700
- **Espaciado**: Sistema base 4px
- **Animaciones**: transition-all duration-200
- **Layout generador**: 2/3 config + 1/3 preview sticky

### Métricas Clave
- **Performance Score**: Meta > 90 (Lighthouse)
- **Cache Hit Rate**: Meta > 70% (validaciones)
- **API Call Reduction**: ~90% con debouncing
- **Bundle Size**: Monitorear con `npm run analyze`

### Comandos Útiles
```bash
# Ver logs en tiempo real
pm2 logs codex-frontend

# Analizar bundle
npm run analyze

# Limpiar caché de desarrollo
rm -rf .next

# Ver métricas de Sentry
# Acceder a dashboard.sentry.io
```

### Estructura de Archivos
```
frontend/src/
├── app/              # Páginas y layouts (App Router)
├── components/       # Componentes reutilizables
│   ├── ui/          # Componentes base (buttons, cards, etc)
│   └── generator/   # Componentes del generador
├── hooks/           # Custom React hooks
├── lib/             # Utilidades y helpers
├── schemas/         # Esquemas de validación Zod
└── context/         # Contextos globales (Auth, Theme)
```

### Features en Desarrollo
- **QR Engine v2**: 100% activo pero gradientes pendientes
- **Smart Auto-Generation**: Sistema completo y optimizado
- **URL Validation**: Con extracción de metadata (favicon, title)