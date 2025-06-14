# 📋 **CODEX - Documento de Transferencia para Agentes IA**

**Última Actualización**: 14 de Junio, 2025  
**Versión del Proyecto**: 1.3.0  
**Estado**: ✅ **DESARROLLO ACTIVO - FASE 2.0** | 🚀 **API v1/v2 REESTRUCTURADA** | 🛡️ **SISTEMA ESTABILIZADO CON PM2**

---

## 🚪 **ORDEN DE LECTURA PARA AGENTES IA** (EMPEZAR AQUÍ)

> **🎯 ESTE ES TU PRIMER DOCUMENTO** - Si eres un nuevo agente IA, estás en el lugar correcto.

### **📚 Secuencia de Lectura Obligatoria:**
1. **🔥 PRIMERO**: `CONTEXT_SUMMARY.md` ← **ESTÁS AQUÍ** (orientación técnica inmediata)
2. **🧭 SEGUNDO**: `.nav.md` ← **NAVEGACIÓN RÁPIDA** (🚨 **CRÍTICO** - Evita perder tiempo buscando archivos. Tu GPS del proyecto)
3. **👑 TERCERO**: `CODEX.md` (roadmap estratégico y fases de desarrollo) 
4. **📖 CUARTO**: `README.md` (setup técnico detallado)
5. **🛠️ QUINTO**: `CLAUDE.md` ← **GUÍA PRÁCTICA IA** (comandos y workflows para desarrollo)
6. **📚 SEXTO**: `docs/README.md` ← **ÍNDICE MAESTRO DE DOCUMENTACIÓN** (mapa completo de docs)
7. **🎨 SÉPTIMO**: `docs/CODEX_DESIGN_SYSTEM.md` ← **LECTURA OBLIGATORIA** (filosofía visual y patrones UI)
8. **🚀 OCTAVO**: `docs/technical/barcode-research.md` ← **INVESTIGACIÓN ESTRATÉGICA** (análisis técnico de códigos)
9. **🔧 ESPECÍFICO**: Consultar `docs/` para documentación organizada por tema

### **📂 Estructura de Documentación (IMPORTANTE)**
- **🧭 `.nav.md`** - **[HERRAMIENTA ESENCIAL]** Navegación rápida del proyecto - Encuentra archivos en segundos, no minutos
- **`CLAUDE.md`** - Guía práctica para agentes IA (comandos, workflows, tips)
- **`docs/README.md`** - Hub central con índice completo y navegación
- **`docs/qr-engine/`** - QR Engine v2 (technical guide, changelog, status)
- **`docs/implementation/`** - Auditorías e implementaciones mayores
- **`docs/api/`** - Documentación API completa
- **`docs/database/`** - Esquema y optimizaciones BD
- **`docs/technical/`** - Especificaciones técnicas y research
- **`docs/archive/`** - Documentos históricos (solo referencia)

**⚠️ REGLAS CRÍTICAS**:
1. **SIEMPRE** verificar en `docs/` antes de crear nueva documentación
2. **NUNCA** crear documentos duplicados - actualizar existentes
3. **CONSULTAR** `docs/DOCUMENTATION_AUDIT_20250608.md` para entender la consolidación

> **⏰ Tiempo estimado**: 25 minutos para entender completamente el proyecto (incluyendo navegación rápida, design system e investigación estratégica)

---

## 🚨 **REGLAS DE JUEGO CRÍTICAS** (LEER PRIMERO)

> **⚠️ ATENCIÓN AGENTE IA**: Este documento es tu **brújula absoluta**. Léelo completamente antes de hacer cualquier acción.

### **🔴 PROHIBICIONES ABSOLUTAS**
- ❌ **NUNCA archivar, mover o eliminar** `CODEX.md` (documento maestro)
- ❌ **NUNCA crear documentación fragmentada** sin consultar primero
- ❌ **NUNCA duplicar información** que ya existe en documentación establecida
- ❌ **NUNCA reestructurar** jerarquía de archivos sin aprobación explícita
- ❌ **NUNCA ignorar** las fases del roadmap definidas en `CODEX.md`
- ❌ **NUNCA cambiar puertos** sin actualizar CODEX.md primero (fuente única)
- ❌ **NUNCA crear elementos visuales** sin consultar `docs/CODEX_DESIGN_SYSTEM.md`

### **✅ ACCIONES AUTORIZADAS**
- ✅ **Actualizar documentación existente** con nueva información
- ✅ **Corregir bugs** y errores técnicos
- ✅ **Mejorar código** siguiendo patrones establecidos
- ✅ **Agregar tests** para validar funcionalidad
- ✅ **Optimizar performance** sin cambiar arquitectura core
- ✅ **Usar puertos definidos** en CODEX.md (3000, 3004, 3002)
- ✅ **Aplicar design system v2.0** siguiendo tokens y patrones establecidos

### **🤔 REQUIERE CONSULTA PREVIA**
- 🔄 Crear nuevos archivos de documentación
- 🔄 Cambiar estructura de carpetas o archivos críticos
- 🔄 Modificar arquitectura o tecnologías core
- 🔄 Agregar nuevas dependencias importantes
- 🔄 Cambiar procesos de desarrollo establecidos
- 🔄 **Cambiar configuración de puertos** (requiere actualizar múltiples archivos)
- 🔄 **Crear nuevos componentes UI** sin seguir patrones del design system

---

## 📁 **JERARQUÍA DE DOCUMENTACIÓN** (SAGRADA)

### **🔴 CRÍTICOS - NUNCA TOCAR SIN PERMISO**
```
├── CODEX.md                     # 👑 DOCUMENTO MAESTRO - Roadmap/Estrategia
├── README.md                    # Overview técnico principal
├── CLAUDE.md                    # 🤖 Guía para AI agents (actualizada)
└── CHANGELOG.md                 # Referencias a documentación organizada
```

### **🟡 IMPORTANTES - CONSULTAR ANTES DE MODIFICAR**
```
├── CONTEXT_SUMMARY.md           # 📋 ESTE DOCUMENTO (transferencia IA)
├── docs/CODEX_DESIGN_SYSTEM.md  # 🎨 DESIGN SYSTEM v2.0 "Corporate Sophistication" (LECTURA OBLIGATORIA)
├── docs/technical/stability-improvements.md  # 🛡️ Solución PM2 para estabilidad
└── validate_implementation.js   # Script de validación crítico
```

### **🟢 TÉCNICOS - MODIFICABLES CON CUIDADO**
```
├── docs/                        # 📚 TODA LA DOCUMENTACIÓN ORGANIZADA
│   ├── qr-engine/              # QR Engine v2 completo
│   ├── implementation/         # Implementaciones y auditorías
│   ├── api/                    # Documentación API
│   ├── database/               # Documentación BD
│   └── technical/              # Especificaciones técnicas
├── backend/README.md            # Documentación específica backend
├── frontend/README.md           # Documentación específica frontend
└── rust_generator/README.md     # Documentación específica Rust
```

### **⚪ ARCHIVADOS - NO TOCAR**
```
└── docs/archive/                # Documentos obsoletos o históricos
```

---

## 🎯 **ESTADO ACTUAL DEL PROYECTO**

### **📊 Fase Actual: 1.5 → 2.0** (según CODEX.md línea 158)
- ✅ **Fase 1 (MVP)**: Completada - Interfaz básica
- ✅ **Fase 1.5 (Pre-Beta)**: 90% completada
- 🔄 **Fase 2 (Beta)**: En progreso activo

### **🏗️ Arquitectura Establecida**
```
Frontend (Next.js 14 + TypeScript)
    ↕️ HTTP/REST
Backend (Node.js + Express + Prisma)
    ↕️ Direct Calls
Rust Generator (Axum + rxing)
    ↕️ SQL
PostgreSQL Database + Redis Cache
```

### **🚀 Implementaciones Críticas Completadas**
- ✅ **Build System**: TypeScript completamente estable
- ✅ **Testing**: Vitest configurado, 8/8 tests passing
- ✅ **Linting**: ESLint estabilizado en v8.57.0
- ✅ **Error Handling**: Error boundaries con Sentry
- ✅ **Clipboard**: useClipboard hook con fallback universal
- ✅ **Dashboard**: Responsive con métricas tiempo real
- ✅ **QR Engine v2**: 100% activo en producción, performance 10x mejor (Jun 2025)
  - ⚠️ **IMPORTANTE**: Ver `docs/qr-engine/QR_ENGINE_V2_REFERENCE.md` para estado real
  - ❌ **Gradientes NO funcionan** - Procesador existe pero no integrado en SVG
- ✅ **PM2 Process Manager**: Sistema robusto con auto-restart y monitoreo (Jun 2025)

### **🛡️ Sistema de Gestión de Servicios PM2 (NUEVO)**
```bash
# MÉTODO RECOMENDADO - Estable con auto-restart
./pm2-start.sh    # Inicia todos los servicios con PM2

# Comandos PM2 útiles:
pm2 status        # Estado de todos los servicios
pm2 logs          # Logs en tiempo real
pm2 restart all   # Reiniciar todos
pm2 stop all      # Detener todos
pm2 monit         # Monitor interactivo

# Detener servicios:
./stop-services.sh # Limpia todos los procesos
```

**Características PM2:**
- Auto-restart si falla un servicio
- Límites de memoria configurados
- Backend sin modo watch para estabilidad
- Logs organizados por servicio

---

## 🎯 **INVESTIGACIÓN ESTRATÉGICA**

**CRÍTICO**: Lee `docs/technical/barcode-research.md` para entender la estrategia de especialización.

**Resumen**: CODEX se enfoca en dominar 5 códigos clave (QR, Data Matrix, EAN/UPC, Code 128, ITF-14) que representan el 85% del mercado, en lugar de cubrir superficialmente 30-50 tipos como la competencia.

---

## 🔧 **STACK TECNOLÓGICO ACTUAL**

### **✅ DEPENDENCIAS ESTABILIZADAS**
```json
// Frontend - Versiones FIJAS (no cambiar)
{
  "next": "14.2.29",           // ⚠️ ESTABLE 
  "react": "18.3.1",          // ⚠️ ESTABLE
  "eslint": "8.57.0",         // ⚠️ DOWNGRADE NECESARIO
  "vitest": "3.1.4"           // ✅ TESTING CONFIGURADO
}

// Backend - En desarrollo activo
{
  "express": "latest",         // 🔄 DESARROLLO
  "prisma": "latest",         // 🔄 ORM PRINCIPAL
  "typescript": "latest"      // 🔄 DESARROLLO
}
```

### **🏗️ COMANDOS DE DESARROLLO**
```bash
# ⭐ SHORTCUTS DISPONIBLES (ARREGLADOS EN ESTA SESIÓN)
./dev.sh                     # Script completo con colores y monitoreo (FIXED v1.1.1)
./dev-start.sh              # Script simple para todos los servidores (FIXED v1.1.1)
npm run dev                 # Concurrently con kill-others (FIXED v1.1.1)

# Comandos por servicio (método tradicional)
cd frontend && npm run dev  # Puerto 3000
cd backend && npm run dev   # Puerto 3004  
cd rust_generator && cargo run  # Puerto 3002 (CORRECTED)
```

---

## 🧠 **CONTEXTO DE DECISIONES TÉCNICAS**

### **🔧 Fixes Recientes Implementados**
1. **TypeScript Build**: Resueltos 20+ errores de compilación
2. **ESLint**: Downgrade a v8.57.0 por compatibilidad Next.js
3. **Vitest**: Configuración globals y exclusiones e2e
4. **Clipboard API**: Hook universal con fallback `useClipboard`
5. **Sentry**: APIs deprecadas corregidas
6. **CSS**: Propiedades estándar `line-clamp` agregadas
7. **🔴 PUERTOS**: Conflictos resueltos - fuente única en CODEX.md
8. **🚀 SCRIPTS**: Scripts de desarrollo arreglados (v1.1.1)

### **📋 Logros Técnicos Recientes** 
> **Nota**: Ver historial completo en `CHANGELOG.md`

#### **Hoy (14 Junio 2025)**
- ✅ **API v1/v2**: Reestructuración completa con endpoints especializados
- ✅ **`.nav.md`**: Actualizado con workflows modernos y validación automática
- ✅ **Documentación**: Reorganización de CONTEXT_SUMMARY.md para claridad

#### **Implementaciones Clave Activas**
- ✅ **PM2 Process Manager**: Sistema estable con auto-restart y monitoreo
- ✅ **Super Admin System**: Sidebar exclusivo y control de acceso robusto
- ✅ **Dashboard Enterprise**: 3 columnas, modo avanzado, health checks
- ✅ **AI Workflow Tools**: `.workspace/`, scripts helpers, `.nav.md`
- ✅ **Performance**: HTTP pooling, rate limits optimizados, cache mejorado

### **🎯 Próximos Pasos Autorizados** (según CODEX.md)
- [ ] Integración activa de Redis Cache
- [ ] Validación robusta de inputs con Zod
- [ ] Mejoras de performance (índices BD, alertas)
- [ ] Más simbologías + GS1 Digital Link
- [ ] Panel de analíticas básicas

### **⚡ OPTIMIZACIÓN DE RENDIMIENTO (June 9, 2025)**
- ✅ **AUDITORÍA PROFUNDA**: Identificados cuellos de botella principales (72 req/s límite)
- ✅ **HTTP CONNECTION POOLING**: Implementado con undici (100 conexiones persistentes)
- ✅ **CONFIGURACIONES OPTIMIZADAS**: 
  - Timeouts: 5s → 30s
  - Rate limit: 100 → 10,000 requests
  - Thread pool: default → 16
  - Cache TTL: 5min → 10min
- ✅ **INFRAESTRUCTURA DE TESTING**: Scripts de carga gradual con métricas detalladas
- ⚠️ **BOTTLENECK IDENTIFICADO**: Arquitectura single-instance limita escalabilidad
- 📝 **DOCUMENTACIÓN COMPLETA**: `/docs/technical/performance-optimization-session-20250609.md`
- 🎯 **TARGET PENDIENTE**: 300-500 req/s requiere escalamiento horizontal

### **🤖 METODOLOGÍA DE TRABAJO OPTIMIZADA PARA IA (June 10, 2025)**
- ✅ **WORKSPACE STRUCTURE**: Creada estructura `.workspace/` para trabajo eficiente
  - `temp/`: Archivos temporales (auto-limpiados)
  - `session-logs/`: Logs estructurados de cada sesión
  - `templates/`: Plantillas para consistencia
- ✅ **AI HELPER SCRIPTS**: Scripts especializados para agentes IA
  - `session-start.sh`: Inicializa sesión con contexto completo
  - `project-status.sh`: Estado comprensivo del proyecto
  - `recent-changes.sh`: Análisis de cambios recientes
  - `session-cleanup.sh`: Limpieza post-sesión
- ✅ **QUICK NAVIGATION**: Archivo `.nav.md` con rutas rápidas a workflows comunes
- ✅ **SCRIPT ORGANIZATION**: Reorganización temática
  - `scripts/ai-helpers/`: Herramientas para IA
  - `scripts/dev/`: Utilidades de desarrollo
  - `scripts/test/`: Scripts de testing
  - `scripts/ops/`: Scripts operacionales
- ✅ **SESSION TRACKING**: Sistema de logs estructurados para cada sesión
- 📝 **DOCUMENTACIÓN**: Ver `.workspace/README.md` para detalles completos

### **📊 Dashboard - Partes Críticas Implementadas**

#### **Layout de 3 Columnas con Altura Forzada**
```typescript
// frontend/src/app/dashboard/page.tsx - ESTRUCTURA CRÍTICA
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
  <div className="h-full"><SystemStatus isAdvancedMode={isAdvancedMode} /></div>
  <div className="h-full"><CacheMetricsPanel isAdvancedMode={isAdvancedMode} /></div>
  <div className="h-full"><RustAnalyticsDisplay /></div>
</div>
```

#### **Sistema de Modo Avanzado**
- **Estado centralizado**: `isAdvancedMode` en dashboard principal
- **Props drilling controlado**: Solo a componentes que necesitan funcionalidad avanzada
- **Controla**: Botones configuración, acciones destructivas, control servicios

#### **Cache Clearing Integration**
```typescript
// CacheMetricsPanel.tsx - ENDPOINT CRÍTICO
const handleClearCache = async () => {
  await fetch(`${rustUrl}/cache/clear`, { method: 'POST' });
  setTimeout(() => fetchCacheStats(), 1000); // Refresco automático
};
```

#### **Configuración de Altura Forzada**
- **SystemStatus**: `w-full h-full` (removido max-w-4xl mx-auto)  
- **CacheMetricsPanel**: `h-full` en todos los estados (loading, normal, sin datos)
- **RustAnalyticsDisplay**: `h-full` en Card raíz
- **Grid**: `items-stretch` garantiza altura igual entre columnas

#### **Variables de Entorno Críticas**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3004    # Health checks + control servicios
NEXT_PUBLIC_RUST_SERVICE_URL=http://localhost:3002  # Cache clearing + analytics
```

---


## 🚨 **PROBLEMAS CONOCIDOS Y SOLUCIONES**

### **🔴 Errores Críticos Resueltos**
1. **`navigator.clipboard undefined`** → ✅ Hook `useClipboard` con fallback
2. **`ESLint 9 incompatible`** → ✅ Downgrade a v8.57.0  
3. **`Vitest globals undefined`** → ✅ tsconfig.json types configurado
4. **`CODEX.md archivado`** → ✅ Restaurado a raíz

### **🟡 Limitaciones Actuales**
- Redis configurado pero no activamente integrado
- Frontend: warnings menores de ESLint (no críticos)
- Testing: cobertura podría mejorar

---

## 📖 **REGLAS DE DOCUMENTACIÓN**

### **✅ CUÁNDO ACTUALIZAR DOCUMENTACIÓN EXISTENTE**
- Agregar información a `TROUBLESHOOTING.md` para nuevos problemas
- Actualizar `CHANGELOG.md` con cambios significativos  
- Modificar `README.md` con nuevas instrucciones de setup
- Actualizar `API_DOCUMENTATION.md` con nuevos endpoints

### **❌ CUÁNDO NO CREAR DOCUMENTACIÓN NUEVA**
- Fix puntual de bug (agregar a TROUBLESHOOTING.md)
- Mejora menor de performance (agregar a CHANGELOG.md)
- Configuración específica (agregar a README.md correspondiente)
- Cambio temporal o experimental

### **🤔 CUÁNDO PREGUNTAR ANTES DE DOCUMENTAR**
- Implementación de nueva funcionalidad mayor
- Cambio de arquitectura o tecnología
- Proceso nuevo que afecta múltiples desarrolladores
- Documentación que podría volverse obsoleta rápidamente

---

## 🔄 **PROCESO DE TRANSFERENCIA IA**

**Inicio Rápido**: Seguir el "ORDEN DE LECTURA" al inicio de este documento.

**Al Finalizar Sesión**: Ejecutar checklist de buenas prácticas en `CLAUDE.md` (sección 🧹)

---

## ⚡ **METODOLOGÍA FOCUS** (OBLIGATORIO - LEER CADA 30 MIN)

> **PROBLEMA**: Las IAs crean demasiada documentación innecesaria.  
> **SOLUCIÓN**: 80% código, 20% documentación. NO crear archivos nuevos.

### **Regla de Oro**: 
```
ANTES de crear CUALQUIER archivo (código o documentación):
0. ¿Tengo dudas? → PREGUNTAR AL USUARIO PRIMERO
1. ¿Ya existe este archivo? → PREGUNTAR "¿Existe already X.tsx?"
2. ¿Puedo actualizar uno existente? → SÍ = Actualizar
3. ¿Es crítico para el proyecto? → NO = No crear
4. ¿El usuario lo pidió explícitamente? → NO = No crear
```

### **🚨 REGLA CARDINAL: ANTE LA DUDA, PREGUNTA**
- "¿Ya existe un componente para X?"
- "¿Dónde debería ir esta funcionalidad?"
- "¿Hay un archivo similar que pueda actualizar?"
- "He encontrado page.tsx, ¿debo modificarlo o crear uno nuevo?"

### **Archivos Permitidos para Actualizar**:
- `CHANGELOG.md` - Cambios del día (2-5 líneas máx)
- `TROUBLESHOOTING.md` - Solo si hay un problema NUEVO
- `README.md` correspondiente - Solo cambios de setup
- Archivos en `docs/` EXISTENTES - NO crear nuevos

### **Check Rápido** (cada 30 minutos):
- ¿Cuánto tiempo sin escribir código? > 10 min = PROBLEMA
- ¿Cuántos archivos nuevos creaste? > 0 = JUSTIFICAR
- ¿Actualizaste CHANGELOG.md? NO = Hacerlo ahora

**Ver `CLAUDE.md` sección "FOCUS Methodology" para detalles completos**

---

## 📞 **RECURSOS RÁPIDOS**

**Comando Principal**: `./pm2-start.sh` (inicia todos los servicios con auto-restart)

**URLs**: Frontend (3000), Backend (3004), Rust (3002)

---

## 🏆 **MÉTRICAS DE ÉXITO ACTUAL**

```
📊 ESTADO DEL PROYECTO:
✅ Build Success Rate: 100%
✅ Test Pass Rate: 8/8 (100%)
✅ ESLint: Stable configuration
✅ TypeScript: 0 compilation errors
✅ Documentation: Well-organized hierarchy
✅ Development: 3 server startup shortcuts
✅ Error Handling: Universal clipboard support

🎯 PRÓXIMOS OBJETIVOS:
🔄 Complete Fase 2 (Beta) según CODEX.md
🔄 Integrate Redis cache actively  
🔄 Implement robust input validation
🔄 Add more barcode symbologies
🔄 Build analytics dashboard
```

---

## 🚀 **ESTADO ACTUAL API v1/v2** (14 Junio 2025)

### **📋 Estructura de Endpoints Implementada**
```
✅ /api/v1/barcode    → Códigos de barras con motor Node.js (v1)
✅ /api/v2/qr         → QR codes con motor Rust (v2)
```

### **🔄 Endpoints Legacy (Con Headers de Deprecación)**
```
⚠️ /api/generate      → Use /api/v1/barcode (remover: Junio 2025)
⚠️ /api/qr/*          → Use /api/v2/qr/* (remover: Junio 2025)
```

### **🔧 Problemas Resueltos Durante Reestructuración**
1. ✅ **Error "fetch is not defined"** - Importación undici corregida
2. ✅ **404/422 en endpoints v2** - Rutas y formato de request arreglados  
3. ✅ **Variable no definida** - qrService.ts línea 88 corregida
4. ✅ **Headers de deprecación** - Removidos de endpoints v2 activos

### **📚 Documentación Clave**
- **Guía de Migración**: `/docs/api/v1-v2-migration-guide.md`
- **Desafíos Técnicos**: `/docs/technical/endpoint-restructuring-challenges-20250614.md`
- **QR Engine v2**: `/docs/qr-engine/README.md`

### **🎯 Estado de Integración**
```javascript
// Frontend hooks actualizados automáticamente
useBarcodeGenerationV2() {
  // QR → /api/v2/qr/generate
  // Otros → /api/v1/barcode
}
```

---

## 🎖️ **CONCLUSIÓN**

**Siguiente paso**: Lee los documentos en el orden indicado al inicio.

**Recuerda**: PM2 para servicios, respetar jerarquía de docs, seguir Design System v2.0.

---

*Última actualización: 14 de Junio, 2025 - API v1/v2 reestructurada y documentación de desafíos técnicos completada*

**📚 CAMBIO IMPORTANTE (Jun 8, 2025)**: Toda la documentación ha sido consolidada y organizada en el directorio `/docs/`. Los documentos originales fueron archivados con timestamp. Siempre verificar en `/docs/` antes de crear nueva documentación. 

## 🌐 **CONFIGURACIÓN DE PUERTOS** (REFERENCIA RÁPIDA)

> **📋 FUENTE AUTORIZADA**: `CODEX.md` sección "PORT CONFIGURATION"

### **✅ PUERTOS DEFINITIVOS**
```bash
Frontend:    3000  # Next.js - Interfaz principal
Backend:     3004  # Express - API y lógica de negocio  
Rust:        3002  # Axum - Generación de códigos de alto rendimiento
PostgreSQL:  5432  # Base de datos
Redis:       6379  # Cache
```

### **🚀 SCRIPTS DE DESARROLLO FUNCIONANDO**
```bash
# ⭐ RECOMENDADO: Script completo (FUNCIONA 100%)
./dev.sh

# 🔧 ALTERNATIVO: Script simple (FUNCIONA ~90%)  
./dev-start.sh

# 📦 ALTERNATIVO: NPM (FUNCIONA ~70%)
npm run dev
```

**🎯 Estado de Scripts (Post-Fix v1.2.0):**
- `./dev.sh`: ✅ Inicia 3/3 servidores + monitoreo + logs + **AUTO-CLEANUP** (ENHANCED)
- `./dev-start.sh`: ⚠️ Inicia 2-3/3 servidores (ocasionales fallos)
- `npm run dev`: ⚠️ Inicia 1-2/3 servidores (conflictos concurrently)

### **🚀 NUEVA CARACTERÍSTICA v1.2.0**: Auto-cleanup de procesos duplicados
```bash
# ✨ AUTOMÁTICO: El script ahora limpia procesos anteriores antes de iniciar
./dev.sh  # Mata procesos en puertos 3000,3002,3004 + rust_generator + next/tsx duplicados
```

### **🏗️ ENTERPRISE SERVICE CONTROL v2.0** (IMPLEMENTADO HOY)

#### **🔧 Backend Mejorado - Control Robusto de Servicios**
```typescript
// ✅ NUEVO: Control de Database con health checks reales
- startDatabaseService(): Creación automática vía docker-compose
- stopDatabaseService(): Verificación de parada exitosa  
- Validación con pg_isready y timeouts configurables

// ✅ NUEVO: Control de Rust Service con process management
- spawn() controlado con detached: false para mejor control
- Cleanup inteligente por puerto y nombre de proceso
- Health checks automáticos post-inicio (http://localhost:3002/health)
- Manejo de procesos zombies y limpieza de puerto 3002

// ✅ NUEVO: Backend restart REAL
- Development: process.exit(0) para tsx/nodemon restart
- Production: Detección automática PM2/systemd con restart real
- Fallback manual con instrucciones claras
```

#### **🌐 Nuevos Endpoints Enterprise**
```bash
GET  /api/services/status           # Estado de todos los servicios
GET  /api/services/{service}/status # Estado de servicio individual  
POST /api/services/health-check     # Health check forzado completo
POST /api/services/{service}/{action} # Acciones con detalles mejorados
```

#### **📱 Frontend Dashboard Mejorado**
```typescript
// ✅ NUEVO: Estados visuales en tiempo real
- Botones con loading/success/error states
- Colores dinámicos (azul=loading, verde=success, rojo=error)
- Timeouts diferentes por tipo de servicio
- Botón "Check completo" para health check forzado
- Feedback específico para restart de backend (3s timeout)
```

#### **🎯 Casos de Uso Solucionados**
1. **Rust service colgado**: Cleanup automático de puerto + process
2. **Backend restart**: Restart real en desarrollo y producción  
3. **Database no inicia**: Auto-creación vía docker-compose
4. **Procesos zombies**: Limpieza inteligente con SIGTERM → SIGKILL
5. **Feedback user**: Estados visuales inmediatos en dashboard
6. **🛡️ DATABASE PROTECTION**: Stop/restart bloqueados para estabilidad del sistema

#### **🛡️ PROTECCIÓN DE BASE DE DATOS** (CRÍTICO - NUEVA IMPLEMENTACIÓN)

**PROBLEMA RESUELTO**: Al detener el backend también se detenía la base de datos, causando inestabilidad del sistema.

**CAMBIOS IMPLEMENTADOS**:
1. **Backend API Protection**:
   - ✅ `POST /api/services/database/stop` → Bloqueado con mensaje informativo
   - ✅ `POST /api/services/database/restart` → Bloqueado para evitar downtime 
   - ✅ `POST /api/services/database/start` → Permitido (solo inicia si está detenida)

2. **Frontend UI Protection**:
   - ✅ Botones Stop/Restart de Database **ocultos** en `SystemStatus.tsx`
   - ✅ Solo se muestra botón **Start** para Database
   - ✅ Otros servicios (Backend/Rust) mantienen todos los botones

3. **Arquitectura Mantenida**:
   - ✅ Database (Docker) independiente del Backend (Node.js)
   - ✅ Base de datos persiste cuando backend se detiene/reinicia
   - ✅ Integridad del sistema preservada

**ARCHIVOS MODIFICADOS**:
```
backend/src/index.ts              # API endpoints protegidos
frontend/src/components/SystemStatus.tsx # UI con botones filtrados
```

**FILOSOFÍA**: "La base de datos es infraestructura crítica que debe permanecer estable."

## 🧹 **BUENAS PRÁCTICAS PARA AGENTES IA**

> **📋 NOTA**: El checklist completo de buenas prácticas ha sido movido a `CLAUDE.md` (sección 🧹 Best Practices Checklist) para mejor accesibilidad y mantenimiento.

## 🚨 **TROUBLESHOOTING**

Para soluciones detalladas a problemas comunes, ver: **`docs/TROUBLESHOOTING.md`**

### **Problemas Documentados:**
- ❌ **PostgreSQL múltiples instancias** - "User denied access"
- 🛡️ **Sistema de Observabilidad** - Dashboard robusto con health checks
- 🔧 **Validación de entorno** - Scripts automáticos en `./dev.sh`

## 🔥 **SISTEMA DE ROLES Y SEGURIDAD**

### **Super Admin System**
- **Arquitectura**: Sidebar exclusivo para SUPERADMIN con navegación categorizada
- **Componentes clave**: `SuperAdminSidebar.tsx`, `SuperAdminLayout.tsx`, `RoleGuard.tsx`
- **Experiencia diferenciada**: Click directo al dashboard vs dropdown para otros roles
- **Seguridad reforzada**: Control estricto de acceso por roles

### **Jerarquía de Roles**
| **Rol** | **Acceso** | **Restricciones** |
|---------|------------|-------------------|
| SUPERADMIN | Control total del sistema | Ninguna |
| WEBADMIN | Gestión usuarios, monitoreo | No puede controlar servicios críticos |
| PREMIUM/ADVANCED | Funciones avanzadas | No administración |
| USER | Generador básico | Solo funciones básicas |

> **Nota**: Para detalles técnicos de implementación, ver documentación en `frontend/src/components/admin/`

---

## 🗄️ **BASE DE DATOS**

### **Estado Actual**
- **PostgreSQL 15** en Docker únicamente (puerto 5432)
- **Volumen correcto**: `codexproject_postgres_data`
- **4 usuarios** migrados con roles correctos

### **Usuarios del Sistema**
| Email | Rol | Propósito |
|-------|-----|-----------|
| `capta1nfire@me.com` | SUPERADMIN | Control total |
| `admin@codex.com` | WEBADMIN | Gestión técnica |
| `premium@codex.com` | PREMIUM | Usuario premium test |
| `user@codex.com` | USER | Usuario básico test |

> **⚠️ IMPORTANTE**: Si encuentras problemas de "datos perdidos" o múltiples PostgreSQL, ver **`docs/database/README.md`** para solución completa del problema de volúmenes Docker.

---

## 🎨 **DESIGN SYSTEM v2.0**

### **"Corporate Sophistication"**
- **Filosofía**: Interfaces profesionales con elegancia sutil
- **Paleta**: Corporate Blue como color de confianza universal
- **Componentes**: Glassmorphism selectivo, gradientes corporativos
- **Layout**: Hero-driven con progressive disclosure
- **Métricas**: -40% friction, +200% visual prominence

> **📚 LECTURA OBLIGATORIA**: Ver **`docs/CODEX_DESIGN_SYSTEM.md`** (993 líneas) para implementación completa

---

*Última actualización: 14 de Junio, 2025 - Documento condensado y reorganizado para claridad*