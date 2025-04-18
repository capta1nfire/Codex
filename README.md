# Codex - Plataforma de Generación de Códigos de Barras y QR

<div align="center">
  <img src="assets/logo.png" alt="Codex Logo" width="200">
  <p><strong>Generación moderna y eficiente de códigos de barras y QR</strong></p>
</div>

## Estado del Proyecto

📊 **Fase actual: MVP (Fase 1)** 

Este proyecto implementa una plataforma moderna para la generación de códigos de barras y QR, utilizando tecnologías avanzadas para garantizar rendimiento, escalabilidad y flexibilidad.

## 🚀 Características Implementadas

- ✅ Generación de múltiples tipos de códigos de barras y QR
- ✅ Personalización básica de escala y nivel de corrección
- ✅ Exportación en formato SVG
- ✅ Previsualización en tiempo real
- ✅ Monitoreo de estado del sistema
- ✅ Dashboard de métricas técnicas con estadísticas de caché
- ✅ Sistema de caché optimizado con seguimiento de hits/misses
- ✅ Soporte CORS para comunicación entre servicios
- ✅ Interfaz intuitiva con Tailwind CSS y diseño responsivo
- ✅ Barra de navegación mejorada con mejor contraste visual
- ✅ Seguridad mejorada con Helmet y rate limiting
- ✅ Validación robusta de entradas con express-validator
- ✅ Sanitización XSS para prevenir inyección de scripts maliciosos
- ✅ Manejo estructurado de errores y mensajes detallados
- ✅ Configuración flexible mediante variables de entorno
- ✅ Estandarización de códigos de error para consistencia
- ✅ Compatibilidad entre servicios mediante alias de rutas
- ✅ Compresión HTTP para respuestas optimizadas
- ✅ Caché en memoria para respuestas frecuentes
- ✅ Headers de caché HTTP para optimización en navegadores
- ✅ Pruebas automatizadas para rendimiento y compresión
- ✅ Soporte para HTTPS/SSL

## 🛠️ Tecnologías Utilizadas

### Frontend
- Next.js 15.2.4
- Tailwind CSS 3.4.0
- Componentes interactivos con HeadlessUI
- Layouts anidados para estructuras de página flexibles

### Backend
- Node.js con Express
- Microservicio de generación en Rust
- Arquitectura de API Gateway
- Seguridad mediante Helmet, express-rate-limit y xss-clean
- Validación con express-validator
- Compresión HTTP con compression
- Sistema de caché en memoria con seguimiento detallado
- Soporte SSL/HTTPS para conexiones seguras

## 🏗️ Arquitectura

El sistema utiliza una arquitectura moderna de microservicios:

1. **Frontend (Next.js)**: Interfaz de usuario y lógica de presentación
2. **API Gateway (Node.js)**: Gestiona las peticiones y orquesta los servicios
3. **Servicio de Generación (Rust)**: Núcleo optimizado para la generación de códigos
4. **Dashboard de Métricas**: Monitoreo en tiempo real del rendimiento

### Optimización de Rendimiento

El sistema incorpora múltiples capas de optimización:

1. **Capa de Compresión**: Reduce el tamaño de las respuestas HTTP para mejorar tiempos de carga
2. **Capa de Caché**: Almacena resultados de solicitudes frecuentes para reducir carga en el servidor
   - Tracking detallado de hits/misses por tipo de código
   - Métricas en tiempo real de la eficiencia del caché
3. **Configuración de Cache-Control**: Aprovecha el almacenamiento en caché del navegador
4. **Limpieza Automática**: Gestión eficiente de memoria mediante limpieza programada del caché

## 🚦 Cómo Iniciar

### Requisitos previos
- Node.js 20.x o superior
- Rust y Cargo (para el servicio de generación)
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/usuario/codex.git
cd codex

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Compilar el servicio Rust
cd ../rust_generator
cargo build --release
```

### Configuración

El sistema utiliza variables de entorno para configuración flexible:

1. En la carpeta `backend`, crea un archivo `.env` con las siguientes variables (o usa el existente):
```
PORT=3001
HOST=0.0.0.0
RUST_SERVICE_URL=http://localhost:3002/generate
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_REQUEST_SIZE=1mb
CACHE_MAX_AGE=300
SSL_ENABLED=false
```

### Ejecución

Necesitarás iniciar los tres componentes:

```bash
# Terminal 1: Iniciar el backend
cd backend
npm run dev  # Ejecuta en http://localhost:3001

# Terminal 2: Iniciar el servicio Rust
cd rust_generator
cargo run --release  # Ejecuta en http://localhost:3002

# Terminal 3: Iniciar el frontend
cd frontend
npm run dev  # Ejecuta en http://localhost:3000
```

## 📈 Estado de Implementación (Fase 1 MVP)

| Característica | Estado | Notas |
|----------------|--------|-------|
| Generación básica | ✅ Completo | Soporta QR, Code128, PDF417, EAN13, Code39, DataMatrix y más |
| Personalización | ⚠️ Parcial | Falta implementar colores y tamaños |
| Exportación | ⚠️ Parcial | SVG implementado, PNG pendiente |
| Sistema de monitoreo | ✅ Completo | Endpoint `/health`, `/metrics` y dashboard de estadísticas de caché |
| Comunicación entre servicios | ✅ Completo | CORS implementado para comunicación segura |
| Seguridad | ✅ Completo | Helmet, rate limiting, CORS restringido, validación y sanitización XSS implementados |
| Manejo de errores | ✅ Completo | Sistema estructurado de errores con mensajes detallados y códigos estandarizados |
| Configuración | ✅ Completo | Sistema flexible de configuración mediante variables de entorno |
| Compatibilidad entre servicios | ✅ Completo | Alias de rutas implementados para consistencia entre frontend y backend |
| Optimización de rendimiento | ✅ Completo | Compresión HTTP, caché en memoria, tracking de métricas y headers de caché implementados |
| SSL/HTTPS | ✅ Completo | Soporte para conexiones seguras implementado |
| Interfaz de usuario | ✅ Completo | UI mejorada con mayor contraste visual y estructura de navegación optimizada |

## 📝 Documentación de API

### API Gateway (Puerto 3001)

- **GET /** - Ruta de bienvenida
- **GET /health** - Estado del sistema y dependencias
- **GET /metrics** - Métricas detalladas del sistema incluyendo estadísticas de caché
- **POST /generate** - Genera un código basado en parámetros
- **POST /generator** - Alias para /generate, mantiene compatibilidad con clientes existentes

### Servicio Rust (Puerto 3002)

- **POST /generate** - Generación directa de códigos
- **GET /status** - Métricas del servicio y estado operacional
- **GET /health** - Estado del servicio
- **POST /cache/clear** - Limpia la caché del servicio
- **POST /cache/config** - Configura parámetros de caché

## 🗺️ Próximos Pasos

Características planificadas para las próximas iteraciones:

1. Implementación de selección de colores
2. Exportación a formato PNG
3. Validación avanzada de parámetros
4. Autenticación y autorización
5. Logging centralizado y monitoreo avanzado
6. Sistema de distribución de contenido (CDN)
7. Escalado horizontal de servicios 
8. Histórico de métricas y visualización de tendencias

## 📚 Documentación Adicional

- [CODEX.md](CODEX.md): Documento estratégico del proyecto
- [CHANGELOG.md](CHANGELOG.md): Registro detallado de cambios
- [backend/README.md](backend/README.md): Documentación específica del backend y API Gateway
- [frontend/README.md](frontend/README.md): Documentación específica del frontend

## 🤝 Contribución

Las contribuciones son bienvenidas. Consulta CONTRIBUTING.md para conocer las pautas.

## 📄 Licencia

[Especificar la licencia que estés utilizando]