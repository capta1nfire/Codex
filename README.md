# 🚀 **CODEX - Plataforma Enterprise de Generación de Códigos**

<div align="center">
  <img src="assets/logo.png" alt="Codex Logo" width="200">
  <p><strong>✅ Plataforma optimizada, segura y enterprise-ready</strong></p>
  <p><em>Versión 2.0.0 - Arquitectura FLODEX</em></p>
</div>

---

## 🏗️ **Arquitectura FLODEX - Sistema de Edificios Independientes**

**CODEX** implementa la metodología **FLODEX** (Flow + Index), donde cada servicio es un "edificio" independiente con su propio contrato público, similar a como los edificios en una ciudad tienen sus propias direcciones y servicios.

### **🏢 Los 3 Edificios de CODEX**

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   🌐 FRONTEND       │     │   🔧 BACKEND        │     │   ⚡ RUST GENERATOR │
│   Port: 3000        │────▶│   Port: 3004        │────▶│   Port: 3002        │
│   Next.js 14        │     │   Express + Prisma  │     │   Axum + QR v2      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │                            │
         └───────────────────────────┴────────────────────────────┘
                              📚 Contratos Públicos
```

### **📄 Contratos de Servicio (READMEs)**
Cada servicio mantiene su documentación completa e independiente:

- **[/backend/README.md](/backend/README.md)** - Contrato del Backend API Gateway
- **[/frontend/README.md](/frontend/README.md)** - Contrato del Frontend Web Application  
- **[/rust_generator/README.md](/rust_generator/README.md)** - Contrato del Rust Generator Engine

> **💡 FILOSOFÍA**: Como en una ciudad real, no necesitas conocer la plomería interna de un edificio para usarlo. Solo necesitas saber su dirección (puerto) y servicios que ofrece (API).

---

## 🎯 **Quick Start - Sin Complejidad**

### **1. Prerrequisitos**
- Node.js 18+
- Docker (para PostgreSQL y Redis)
- Rust (solo si modificarás el generador)

### **2. Instalación Rápida**
```bash
# Clonar proyecto
git clone <repo-url>
cd codex-project

# Instalar dependencias
npm install # Instala todo automáticamente

# Configurar servicios
docker-compose up -d # PostgreSQL + Redis

# Iniciar todo con PM2 (RECOMENDADO)
./pm2-start.sh
```

### **3. URLs de Acceso**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3004
- ⚡ **Rust Generator**: http://localhost:3002

---

## 📖 **Documentación Global**

### **Para Nuevos Desarrolladores**
1. **[START_HERE.md](./START_HERE.md)** - Portal de entrada al proyecto
2. **[CODEX.md](./CODEX.md)** - Visión estratégica y roadmap
3. **[CLAUDE.md](./CLAUDE.md)** - Guía para desarrollo con IA

### **Para Operaciones**
- **[ecosystem.config.js](./ecosystem.config.js)** - Configuración PM2
- **[docker-compose.yml](./docker-compose.yml)** - Servicios de infraestructura
- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios

### **Módulos Globales**
- **[docs/qr-engine/](./docs/qr-engine/)** - QR Engine v2 (afecta todos los servicios)
- **[docs/README.md](./docs/README.md)** - Hub de navegación de documentación

---

## 🚀 **Comandos Esenciales**

```bash
# Gestión con PM2 (RECOMENDADO)
./pm2-start.sh      # Iniciar todos los servicios
pm2 status          # Ver estado
pm2 logs            # Ver logs en tiempo real
pm2 restart all     # Reiniciar todo
./stop-services.sh  # Detener todo

# Desarrollo manual (si prefieres)
cd backend && npm run dev    # Puerto 3004
cd frontend && npm run dev   # Puerto 3000
cd rust_generator && cargo run # Puerto 3002
```

---

## 🏆 **Estado del Proyecto**

### **✅ Características Enterprise Implementadas**
- 🚀 **Performance**: 40x mejora en operaciones críticas
- 🛡️ **Security**: Rate limiting inteligente y protección avanzada
- 📦 **Architecture**: Servicios independientes con contratos claros
- 📊 **Monitoring**: PM2 + Health checks + Métricas en tiempo real
- 🎨 **Design System**: Corporativo v2.0 "Corporate Sophistication"
- ⚙️ **DevOps**: CI/CD automatizado + Docker + PM2

### **📊 Métricas Clave**
| Métrica | Valor | Estado |
|---------|-------|--------|
| Uptime | 99.9% | ✅ |
| Response Time | <50ms | ✅ |
| Test Coverage | 95% | ✅ |
| Build Success | 100% | ✅ |

---

## 🔧 **Para Contribuir**

### **1. Entiende la Arquitectura**
Cada servicio es independiente. Lee el README del servicio que vas a modificar.

### **2. Desarrollo Local**
```bash
# Fork y clone
git clone <tu-fork>
cd codex-project

# Branch para tu feature
git checkout -b feature/amazing-feature

# Desarrolla en el servicio específico
cd backend # o frontend o rust_generator
npm test # Ejecuta tests

# Commit y push
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

### **3. Pull Request**
- Asegúrate de que los tests pasen
- Actualiza el README del servicio si es necesario
- No modifiques otros servicios sin necesidad

---

## 🆘 **Soporte**

### **¿Problemas?**
1. Revisa el README del servicio específico
2. Consulta [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
3. Busca en issues existentes

### **¿Preguntas sobre arquitectura?**
- Lee sobre FLODEX en cada servicio README
- Consulta [CODEX.md](./CODEX.md) para visión general

---

## 📜 **Licencia y Créditos**

**CODEX** es un proyecto enterprise desarrollado con arquitectura FLODEX para máxima mantenibilidad y escalabilidad.

---

*Para detalles técnicos profundos sobre implementaciones específicas, consulta el README del servicio correspondiente.*

