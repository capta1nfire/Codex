# 🚪 **CODEX - Portal de Entrada para Agentes IA**

**Última Actualización**: 19 de Junio, 2025  
**Arquitectura**: FLODEX v1.0  
**Estado**: ✅ **DESARROLLO ACTIVO**

---

## 🎯 **TU MISIÓN COMO AGENTE IA**

Bienvenido al proyecto CODEX. Este es tu portal de entrada. La arquitectura FLODEX divide el proyecto en 3 "edificios" independientes:

```
🌐 FRONTEND (Puerto 3000) → Interfaz de usuario
🔧 BACKEND (Puerto 3004)  → Lógica de negocio y API
⚡ RUST (Puerto 3002)     → Motor de generación de códigos
```

---

## 📚 **ORDEN DE LECTURA ESENCIAL**

### **1. Para Entender el Proyecto** (10 min)
- **[README.md](./README.md)** - Arquitectura general FLODEX
- **[CODEX.md](./CODEX.md)** - Visión estratégica y roadmap

### **2. Para Trabajar en un Servicio** (5 min por servicio)
- **[/backend/README.md](/backend/README.md)** - Si trabajarás en API/Backend
- **[/frontend/README.md](/frontend/README.md)** - Si trabajarás en UI/Frontend
- **[/rust_generator/README.md](/rust_generator/README.md)** - Si trabajarás en generador

### **3. Para Desarrollo con IA** (15 min)
- **[CLAUDE.md](./CLAUDE.md)** - Guía completa para agentes IA
- **[.nav.md](./.nav.md)** - Navegación rápida (tu GPS del proyecto)

---

## 🚀 **INICIO RÁPIDO**

```bash
# 1. Iniciar todos los servicios
./pm2-start.sh

# 2. Ver estado
pm2 status

# 3. Ver logs
pm2 logs

# 4. Acceder a servicios
Frontend: http://localhost:3000
Backend:  http://localhost:3004
Rust:     http://localhost:3002
```

---

## 🎨 **REGLAS CRÍTICAS FLODEX**

### **✅ SIEMPRE**
- Trabajar en el README del servicio específico
- Mantener servicios independientes
- Usar PM2 para gestión de procesos
- Consultar CLAUDE.md para mejores prácticas

### **❌ NUNCA**
- Crear documentación fuera de los servicios
- Mezclar lógica entre servicios
- Modificar puertos sin actualizar contratos
- Ignorar los READMEs de cada servicio

---

## 📊 **ESTADO ACTUAL**

### **Arquitectura**
- ✅ 3 servicios independientes con contratos claros
- ✅ PM2 para gestión robusta con auto-restart
- ✅ Documentación migrada a cada servicio

### **Características Activas**
- ✅ QR Engine v2 con performance 10x
- ✅ Sistema de roles y permisos
- ✅ Design System v2.0 "Corporate Sophistication"
- ✅ Dashboard con métricas en tiempo real

### **Stack Tecnológico**
```
Frontend:  Next.js 14 + TypeScript + Tailwind
Backend:   Express + Prisma + PostgreSQL + Redis
Rust:      Axum + qrcodegen + DashMap
```

---

## 🔧 **TROUBLESHOOTING RÁPIDO**

### **Servicio no inicia**
```bash
pm2 logs [servicio]  # Ver error específico
pm2 restart [servicio]  # Reiniciar
```

### **Puerto ocupado**
```bash
lsof -i :[puerto]  # Ver qué lo usa
kill -9 [PID]      # Terminar proceso
```

### **Base de datos**
```bash
docker-compose up -d  # Iniciar PostgreSQL/Redis
cd backend && npx prisma migrate dev  # Migrar
```

---

## 📝 **NOTAS PARA AGENTES IA**

1. **Contexto**: Cada servicio es autónomo. No necesitas entender todo para trabajar.
2. **Documentación**: Está en el README de cada servicio, no busques en otros lugares.
3. **Cambios**: Actualiza solo el README del servicio que modificaste.
4. **Comunicación**: Los servicios se comunican por HTTP REST, no compartes código.

---

## 🚨 **URGENTE O BLOQUEADO?**

1. **Revisa**: README del servicio específico
2. **Consulta**: [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
3. **Navega**: Usa [.nav.md](./.nav.md) para encontrar archivos rápido
4. **Pregunta**: Si tienes dudas, pregunta antes de asumir

---

*Este documento es tu punto de partida. La complejidad está en cada servicio, no aquí.*