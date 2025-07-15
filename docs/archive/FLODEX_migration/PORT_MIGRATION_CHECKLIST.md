# 🔄 **PORT MIGRATION CHECKLIST**

**Fecha**: 24 de Mayo, 2025  
**Propósito**: Documentar TODOS los archivos que necesitan actualización cuando cambien puertos

---

## 🚨 **PROBLEMA IDENTIFICADO**

Múltiples agentes IA han tenido conflictos con puertos porque la configuración estaba **fragmentada** en múltiples archivos. 

**Conflicto histórico**: Backend puerto 3001 vs 3004

---

## ✅ **SOLUCIÓN IMPLEMENTADA**

1. **Fuente única de verdad**: `QReable.md` sección "PORT CONFIGURATION"
2. **Scripts arreglados**: `dev.sh`, `dev-start.sh`, `package.json`
3. **Documentación actualizada**: `CONTEXT_SUMMARY.md`

---

## 📋 **ARCHIVOS QUE REQUIEREN ACTUALIZACIÓN**

### **🔴 PENDIENTES - Puerto 3001 → 3004**

| Archivo | Línea(s) | Status | Acción Requerida |
|---------|----------|--------|------------------|
| `backend/README.md` | 106, 363 | ❌ Pendiente | PORT=3001 → PORT=3004 |
| `docs/BATCH_PROCESSING_GUIDE.md` | 39 | ❌ Pendiente | Puerto 3001 → Puerto 3004 |
| `docs/IMPLEMENTATION_SUMMARY_BATCH.md` | 128 | ❌ Pendiente | Port 3001 → Port 3004 |
| `IMPLEMENTATION_REPORT.md` | 214 | ❌ Pendiente | localhost:3001 → localhost:3004 |

### **🟡 CASOS ESPECIALES**

| Archivo | Línea | Descripción | Acción |
|---------|-------|-------------|--------|
| `README.md` | 171 | Grafana puerto 3001 | ✅ CORRECTO (Grafana != Backend) |

### **✅ ACTUALIZADOS CORRECTAMENTE**

| Archivo | Status | Puertos Correctos |
|---------|--------|-------------------|
| `QReable.md` | ✅ Maestro | 3000, 3004, 3002 |
| `CONTEXT_SUMMARY.md` | ✅ Actualizado | 3000, 3004, 3002 |
| `dev.sh` | ✅ Arreglado | 3000, 3004, 3002 |
| `dev-start.sh` | ✅ Arreglado | 3000, 3004, 3002 |
| `package.json` | ✅ Arreglado | Scripts correctos |

---

## 🎯 **CONFIGURACIÓN DEFINITIVA**

```bash
# ESTOS SON LOS PUERTOS OFICIALES (desde QReable.md)
Frontend (Next.js):       3000
Backend (Express):        3004  
Rust Generator (Axum):    3002
PostgreSQL:               5432
Redis:                    6379
```

---

## 🔧 **PARA FUTUROS AGENTES**

### **✅ PROCESO CORRECTO**
1. **SIEMPRE consultar** `QReable.md` sección "PORT CONFIGURATION"
2. **NUNCA cambiar puertos** sin actualizar la fuente única primero
3. **SI necesitas cambiar puertos**: Actualizar este checklist

### **❌ ERRORES HISTÓRICOS A EVITAR**
- ❌ Usar puerto 3001 para backend
- ❌ Cambiar puertos en archivos individuales
- ❌ No consultar la documentación maestra
- ❌ Crear configuraciones fragmentadas

---

## 📝 **LOG DE CAMBIOS**

| Fecha | Agente | Acción | Status |
|-------|--------|--------|--------|
| 2025-05-24 | Apex | Creada fuente única en QReable.md | ✅ Completo |
| 2025-05-24 | Apex | Arreglados scripts de desarrollo | ✅ Completo |
| 2025-05-24 | Apex | Identificados archivos pendientes | 🔄 En progreso |

---

*Este archivo será actualizado conforme se resuelvan los conflictos pendientes.* 