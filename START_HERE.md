# 🚀 **Bienvenido al Proyecto QReable**

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

## ⭐ **Características Destacadas**

### **🎯 URL Validation Enterprise-Grade** *(Nuevo 2025-06-29)*
Sistema avanzado de validación que garantiza 95% de éxito:
- 🔄 **User-Agent Rotation**: 5 navegadores diferentes
- 🛡️ **Anti-Bot Bypass**: Funciona con sitios protegidos (Amazon, Cloudflare)
- ⚡ **Ultra-rápido**: Validación en <3 segundos
- 📋 **Metadata completa**: Título, descripción, favicon

> **Resultado**: Usuarios obtienen validaciones más precisas y menos errores falsos.

### **🚀 Motor QR v3 - Production Ready**
- Generación ultra-rápida (<100ms)
- Gradientes completos (linear, radial, conic, diamond, spiral)
- Sistema de templates profesionales
- Scoring de legibilidad en tiempo real

---

## 🤖 **Guía para Agentes IA**

### **Documentación Esencial**
- **🤖 [IA_MANIFESTO.md](./IA_MANIFESTO.md)** - ⚠️ **CRÍTICO**: Pilares fundamentales obligatorios para desarrollo con IA
- **Si eres Claude, lee [CLAUDE.md](./CLAUDE.md). Si eres Gemini, lee [GEMINI.md](./GEMINI.md).**
- **[README.md](./README.md)** - Arquitectura general del proyecto
- **[.nav.md](./.nav.md)** - GPS para navegación rápida
- **[MULTI_AGENT_COLLABORATION_PROTOCOL.md](./MULTI_AGENT_COLLABORATION_PROTOCOL.md)** - Protocolo de colaboración entre agentes IA

### **Reglas FLODEX**
✅ **HACER:** Trabajar en el README del servicio específico  
✅ **HACER:** Mantener servicios independientes  
❌ **NO HACER:** Crear docs fuera de servicios  
❌ **NO HACER:** Mezclar código entre servicios  

### **⚠️ Archivo Protegido - page.tsx**
🛡️ **CRÍTICO:** El archivo `/frontend/src/app/page.tsx` está **PROTEGIDO**
- Ver política completa: `/docs/policies/MAIN_PAGE_PROTECTION_POLICY.md`
- ❌ **NUNCA** agregues lógica a page.tsx (máx 30 líneas)
- ✅ **SIEMPRE** agrega features en `useQRGeneratorOrchestrator`
- 🧪 Guardian tests activos - fallarán si violas las reglas  

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