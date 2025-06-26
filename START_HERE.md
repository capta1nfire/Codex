# 🚀 **Bienvenido al Proyecto CODEX**

**Misión:** Construir la mejor plataforma enterprise de generación de códigos del mundo.  
**Arquitectura:** FLODEX - Servicios autónomos como "edificios" independientes.

---

## 🏛️ **Nuestros 3 Edificios**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 🌐 FRONTEND     │     │ 🔧 BACKEND      │     │ ⚡ RUST GEN     │
│ Puerto: 3000    │────▶│ Puerto: 3004    │────▶│ Puerto: 3002    │
│ Next.js 14      │     │ Express/Prisma  │     │ Axum/QR v2      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### **📦 [Backend](./backend/README.md)**
*API principal, lógica de negocio y gestión de base de datos.*

### **🖥️ [Frontend](./frontend/README.md)**  
*Interfaz de usuario, componentes y experiencia del cliente.*

### **⚡ [Rust Generator](./rust_generator/README.md)**
*Motor de alto rendimiento para la generación de códigos.*

---

## 🚀 **Inicio Rápido**

```bash
# Arrancar todo
./pm2-start.sh

# Ver estado
pm2 status

# Acceder
http://localhost:3000  # Frontend
http://localhost:3004  # Backend API
http://localhost:3002  # Rust Engine
```

---

## 🤖 **Guía para Agentes IA**

### **Documentación Esencial**
- **Si eres Claude, lee [CLAUDE.md](./CLAUDE.md). Si eres Gemini, lee [GEMINI.md](./GEMINI.md).**
- **[README.md](./README.md)** - Arquitectura general del proyecto
- **[.nav.md](./.nav.md)** - GPS para navegación rápida
- **[MULTI_AGENT_COLLABORATION_PROTOCOL.md](./MULTI_AGENT_COLLABORATION_PROTOCOL.md)** - Protocolo de colaboración entre agentes IA

### **Reglas FLODEX**
✅ **HACER:** Trabajar en el README del servicio específico  
✅ **HACER:** Mantener servicios independientes  
❌ **NO HACER:** Crear docs fuera de servicios  
❌ **NO HACER:** Mezclar código entre servicios  

---

## 🛠️ **Herramientas FLODEX**

### **Validación de Arquitectura**
```bash
# Verificar cumplimiento FLODEX
./scripts/validate-flodex.sh

# Ver métricas y tendencias
./scripts/flodex-metrics
```

### **Documentación Avanzada**
- **[Cross-Service Guide](./docs/flodex/CROSS_SERVICE_FEATURES_GUIDE.md)** - Para features que afectan múltiples servicios
- **[PR Template](./.github/pull_request_template.md)** - Checklist automático en cada PR

---

## 🆘 **¿Bloqueado?**

```bash
# Ver logs de error
pm2 logs [servicio]

# Reiniciar servicio
pm2 restart [servicio]

# Base de datos
docker-compose up -d

# Validar arquitectura
./scripts/validate-flodex.sh
```

Para más ayuda: consulta el README del servicio específico.

---

*Este es tu punto de partida. Cada servicio tiene su documentación completa.*