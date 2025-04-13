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
- ✅ Dashboard de métricas técnicas
- ✅ Sistema de caché para optimizar rendimiento
- ✅ Soporte CORS para comunicación entre servicios
- ✅ Interfaz intuitiva con Tailwind CSS

## 🛠️ Tecnologías Utilizadas

### Frontend
- Next.js 15.2.4
- Tailwind CSS 3.4.0
- Componentes interactivos con HeadlessUI

### Backend
- Node.js con Express
- Microservicio de generación en Rust
- Arquitectura de API Gateway

## 🏗️ Arquitectura

El sistema utiliza una arquitectura moderna de microservicios:

1. **Frontend (Next.js)**: Interfaz de usuario y lógica de presentación
2. **API Gateway (Node.js)**: Gestiona las peticiones y orquesta los servicios
3. **Servicio de Generación (Rust)**: Núcleo optimizado para la generación de códigos
4. **Dashboard de Métricas**: Monitoreo en tiempo real del rendimiento

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
| Sistema de monitoreo | ✅ Completo | Endpoint `/health` y dashboard de métricas de rendimiento |
| Comunicación entre servicios | ✅ Completo | CORS implementado para comunicación segura |

## 📝 Documentación de API

### API Gateway (Puerto 3001)

- **GET /** - Ruta de bienvenida
- **GET /health** - Estado del sistema y dependencias
- **POST /generate** - Genera un código basado en parámetros

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
4. Optimización para dispositivos móviles

## 📚 Documentación Adicional

- [CODEX.md](CODEX.md): Documento estratégico del proyecto
- [CHANGELOG.md](CHANGELOG.md): Registro detallado de cambios
- API_DOCS.md: Documentación técnica de la API

## 🤝 Contribución

Las contribuciones son bienvenidas. Consulta CONTRIBUTING.md para conocer las pautas.

## 📄 Licencia

[Especificar la licencia que estés utilizando]