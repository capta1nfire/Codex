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
- **[CLAUDE.md](./CLAUDE.md)** - Tu manual de operación completo
- **[README.md](./README.md)** - Arquitectura general del proyecto
- **[.nav.md](./.nav.md)** - GPS para navegación rápida

### **Reglas FLODEX**
✅ **HACER:** Trabajar en el README del servicio específico  
✅ **HACER:** Mantener servicios independientes  
❌ **NO HACER:** Crear docs fuera de servicios  
❌ **NO HACER:** Mezclar código entre servicios  

---

## 🆘 **¿Bloqueado?**

```bash
# Ver logs de error
pm2 logs [servicio]

# Reiniciar servicio
pm2 restart [servicio]

# Base de datos
docker-compose up -d
```

Para más ayuda: consulta el README del servicio específico.

---

*Este es tu punto de partida. Cada servicio tiene su documentación completa.*