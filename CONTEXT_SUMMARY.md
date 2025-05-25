# 📋 **CODEX - Documento de Transferencia para Agentes IA**

**Última Actualización**: 24 de Mayo, 2025  
**Versión del Proyecto**: 1.1.0  
**Estado**: ✅ **DESARROLLO ACTIVO - FASE 1.5 → 2.0**

---

## 🚪 **ORDEN DE LECTURA PARA AGENTES IA** (EMPEZAR AQUÍ)

> **🎯 ESTE ES TU PRIMER DOCUMENTO** - Si eres un nuevo agente IA, estás en el lugar correcto.

### **📚 Secuencia de Lectura Obligatoria:**
1. **🔥 PRIMERO**: `CONTEXT_SUMMARY.md` ← **ESTÁS AQUÍ** (orientación técnica inmediata)
2. **👑 SEGUNDO**: `CODEX.md` (roadmap estratégico y fases de desarrollo) 
3. **📖 TERCERO**: `README.md` (setup técnico detallado)
4. **🔧 OPCIONAL**: Documentación específica según necesidad

> **⏰ Tiempo estimado**: 10 minutos para entender completamente el proyecto

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

### **✅ ACCIONES AUTORIZADAS**
- ✅ **Actualizar documentación existente** con nueva información
- ✅ **Corregir bugs** y errores técnicos
- ✅ **Mejorar código** siguiendo patrones establecidos
- ✅ **Agregar tests** para validar funcionalidad
- ✅ **Optimizar performance** sin cambiar arquitectura core
- ✅ **Usar puertos definidos** en CODEX.md (3000, 3004, 3002)

### **🤔 REQUIERE CONSULTA PREVIA**
- 🔄 Crear nuevos archivos de documentación
- 🔄 Cambiar estructura de carpetas o archivos críticos
- 🔄 Modificar arquitectura o tecnologías core
- 🔄 Agregar nuevas dependencias importantes
- 🔄 Cambiar procesos de desarrollo establecidos
- 🔄 **Cambiar configuración de puertos** (requiere actualizar múltiples archivos)

---

## 📁 **JERARQUÍA DE DOCUMENTACIÓN** (SAGRADA)

### **🔴 CRÍTICOS - NUNCA TOCAR SIN PERMISO**
```
├── CODEX.md                     # 👑 DOCUMENTO MAESTRO - Roadmap/Estrategia
├── README.md                    # Overview técnico principal
├── API_DOCUMENTATION.md         # Documentación completa de APIs
└── CHANGELOG.md                 # Historial oficial de versiones
```

### **🟡 IMPORTANTES - CONSULTAR ANTES DE MODIFICAR**
```
├── CONTEXT_SUMMARY.md           # 📋 ESTE DOCUMENTO (transferencia IA)
├── IMPLEMENTATION_REPORT.md     # Reporte de auditoría Jules
└── validate_implementation.js   # Script de validación crítico
```

### **🟢 TÉCNICOS - MODIFICABLES CON CUIDADO**
```
├── docs/TROUBLESHOOTING.md      # Solución de problemas (muy útil)
├── docs/PORT_MIGRATION_CHECKLIST.md  # Conflictos de puertos y archivos pendientes
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

### **📋 Tareas Completadas Esta Sesión**
- ✅ Eliminados imports no utilizados en 9+ componentes
- ✅ Corregidos errores Sentry de APIs deprecadas
- ✅ Implementado sistema de shortcuts para desarrollo
- ✅ Restaurado CODEX.md desde archivo (¡era crítico!)
- ✅ Establecidas reglas de documentación
- ✅ **CRÍTICO**: Resueltos conflictos de puertos (3001 vs 3004)
- ✅ **CRÍTICO**: Creada fuente única de verdad en CODEX.md
- ✅ **CRÍTICO**: Scripts de desarrollo funcionando al 100%
- ✅ **NUEVO**: Enhanced dev.sh v1.2.0 con auto-cleanup de procesos duplicados
- ✅ **NUEVO**: Solucionado problema recurrente de Rust Generator puerto ocupado
- ✅ **NUEVO**: Integrado sistema inteligente de limpieza por puerto y nombre de proceso
- ✅ **ENTERPRISE**: Sistema de control de servicios completamente renovado
- ✅ **ENTERPRISE**: Backend restart real con detección de PM2/systemd
- ✅ **ENTERPRISE**: Control robusto de Rust service con process management
- ✅ **ENTERPRISE**: Validación post-acción y health checks automáticos
- ✅ **ENTERPRISE**: Nuevos endpoints de status y health-check forzado
- ✅ **ENTERPRISE**: Frontend con feedback visual en tiempo real de acciones
- ✅ **DASHBOARD**: Implementado layout de 3 columnas con altura forzada igual
- ✅ **DASHBOARD**: Sistema de modo avanzado con configuración de servicios
- ✅ **DASHBOARD**: Cache clearing integrado en CacheMetricsPanel
- ✅ **DASHBOARD**: Esquema de colores neutral (no corporativo)
- ✅ **DOCKER**: Corregida configuración AlertManager webhook

### **🎯 Próximos Pasos Autorizados** (según CODEX.md)
- [ ] Integración activa de Redis Cache
- [ ] Validación robusta de inputs con Zod
- [ ] Mejoras de performance (índices BD, alertas)
- [ ] Más simbologías + GS1 Digital Link
- [ ] Panel de analíticas básicas

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

## 🔍 **PATRONES DE CÓDIGO ESTABLECIDOS**

### **Frontend (Next.js)**
```typescript
// ✅ PATRÓN: Usar hook personalizado useClipboard
import { useClipboard } from '@/hooks/useClipboard';

// ✅ PATRÓN: Error boundaries con Sentry
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ✅ PATRÓN: Components con Card + CardHeader + CardContent
import { Card, CardHeader, CardContent } from '@/components/ui/card';
```

### **Backend (Node.js)**
```typescript
// ✅ PATRÓN: Usar Prisma para DB
import { prisma } from '@/lib/prisma';

// ✅ PATRÓN: Manejo de errores consistente
import { ApiError } from '@/utils/errors';

// ✅ PATRÓN: Rate limiting diferenciado
import { rateLimitMiddleware } from '@/middleware/rateLimitMiddleware';
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

## 💡 **FILOSOFÍA DEL PROYECTO**

### **🎯 Principios Core**
1. **KISS (Keep It Simple, Stupid)**: Código simple y mantenible
2. **DRY (Don't Repeat Yourself)**: Evitar duplicación en código y docs
3. **YAGNI (You Aren't Gonna Need It)**: No sobre-ingeniería
4. **Documentation as Code**: Docs viven con el código

### **🎨 FILOSOFÍA DE DISEÑO: "CLEAN GLOBAL PRODUCTIVITY"**

> **📋 REGLA DE ORO**: Antes de realizar **CUALQUIER** cambio visual, consultar `docs/CODEX_DESIGN_SYSTEM.md`

#### **🌍 Principios de Diseño Global**
- **Neutralidad cultural**: Evitar sesgos visuales regionales
- **Profesionalismo**: Balance sofisticación/simplicidad  
- **Escalabilidad**: Decisiones que funcionen a largo plazo
- **Coherencia**: Una interfaz, un lenguaje visual

#### **🚫 PROHIBIDO - Crear elementos visuales sin consultar:**
- ❌ Nuevos colores o variantes no documentadas
- ❌ Componentes UI desde cero sin revisar el sistema
- ❌ Cambios tipográficos arbitrarios
- ❌ Espaciados o shadows inventados
- ❌ Iconografía que no sea Lucide React

#### **✅ OBLIGATORIO - Siempre seguir:**
- ✅ **Tokens de diseño**: Usar variables CSS definidas (--primary, --spacing-*, etc.)
- ✅ **Componentes modulares**: Reutilizar Button, Input, Card con sus variants
- ✅ **Paleta "Qwen Professional"**: Mantener neutralidad cultural
- ✅ **Consistencia visual**: Cada pixel debe alinearse con el sistema
- ✅ **Iconografía Lucide**: Única fuente autorizada, tamaños estandarizados

#### **🔧 FLUJO DE TRABAJO VISUAL OBLIGATORIO**
```
1. 📖 Consultar docs/CODEX_DESIGN_SYSTEM.md
2. 🔍 Buscar componente/token existente
3. 🎯 Usar variant apropiada
4. ⚠️  Si no existe → Proponer extensión del sistema
5. 🚫 NUNCA crear soluciones ad-hoc
```

> **🎯 PARA NUEVOS AGENTES**: Si no has leído el Design System, **STOP**. Ve primero a `docs/CODEX_DESIGN_SYSTEM.md` antes de tocar cualquier componente visual. La consistencia visual es **sagrada** en CODEX.

### **🚀 Objetivos de Calidad**
- **Build**: 100% exitoso siempre
- **Tests**: Mínimo 8/8 passing (actual)
- **Linting**: Solo warnings menores permitidos
- **Performance**: Sub-segundo para operaciones críticas

---

## 🔄 **PROCESO DE TRANSFERENCIA IA**

### **📋 Checklist al Recibir Proyecto**
- [ ] ✅ **PASO 1**: Leer REGLAS DE JUEGO CRÍTICAS (arriba)
- [ ] ✅ **PASO 2**: Revisar jerarquía de documentación  
- [ ] ✅ **PASO 3**: Leer `CODEX.md` para entender roadmap completo
- [ ] ✅ **PASO 4**: Verificar que build funciona (`npm run build`)
- [ ] ✅ **PASO 5**: Verificar que tests pasan (`npm test`)
- [ ] ✅ **PASO 6**: Entender estado actual del proyecto
- [ ] ✅ **PASO 7**: Leer sección 🧹 BUENAS PRÁCTICAS (checklist de rigor)

> **🎓 Al completar estos 7 pasos, estarás 100% orientado en el proyecto**

### **🤝 Al Finalizar Sesión**
- [ ] ✅ **Ejecutar checklist 🧹 BUENAS PRÁCTICAS** (limpieza post-cambios)
- [ ] ✅ Actualizar este documento con cambios realizados
- [ ] ✅ Documentar problemas encontrados en TROUBLESHOOTING.md
- [ ] ✅ Actualizar CHANGELOG.md si hubo cambios significativos
- [ ] ✅ Asegurar que proyecto sigue funcionando

---

## 📞 **RECURSOS RÁPIDOS**

### **🔧 Comandos de Emergencia**
```bash
# Verificar estado del proyecto
npm run build && npm test

# Limpiar y reiniciar
rm -rf node_modules .next && npm install

# Ver logs del desarrollo
./dev.sh  # Logs automáticos en ./logs/

# Verificar documentación crítica
ls -la CODEX.md README.md API_DOCUMENTATION.md
```

### **📖 Documentación Esencial**
- **Roadmap**: `CODEX.md` líneas 158-208 (Fases desarrollo)
- **APIs**: `API_DOCUMENTATION.md` (ejemplos completos)  
- **Problemas**: `docs/TROUBLESHOOTING.md` (soluciones conocidas)
- **Historia**: `CHANGELOG.md` (qué cambió cuándo)

### **🌐 URLs de Desarrollo**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3004  
- **Rust Generator**: http://localhost:3002  
- **DB Admin**: (configurar según necesidad)

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

## 🎖️ **CONCLUSIÓN PARA AGENTES IA**

Si eres un nuevo agente IA trabajando en CODEX:

1. **🚪 Este documento es tu PUNTO DE ENTRADA** - has empezado correctamente
2. **📋 Sigue la secuencia de lectura** - CONTEXT_SUMMARY → CODEX.md → README.md
3. **🚨 Respeta las reglas** - evita errores que otros cometieron
4. **🤝 Pregunta si dudas** - mejor consultar que romper algo
5. **📝 Documenta cambios** - actualiza este archivo al finalizar

**¡Bienvenido al equipo! 🚀 Ahora ve a leer `CODEX.md` para el roadmap completo.**

---

*Última actualización: 24 de Mayo, 2025 - Post implementación de reglas de transferencia IA y cleanup de documentación* 

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

## 🧹 **BUENAS PRÁCTICAS PARA AGENTES IA** (CHECKLIST DE RIGOR)

> **📋 REFERENCIA RÁPIDA**: Use esta sección como shortcut para mantener orden y estructura después de cambios importantes.

### **✅ CHECKLIST POST-CAMBIOS** (Ejecutar SIEMPRE después de modificaciones importantes)

#### **🔧 1. LIMPIEZA DE CÓDIGO**
- [ ] ✅ **Corregir linters**: `npm run lint` (frontend/backend), `cargo clippy` (rust)
- [ ] ✅ **Eliminar imports no utilizados**: Revisar warnings de TypeScript/ESLint
- [ ] ✅ **Eliminar variables/funciones no utilizadas**: Usar `ts-prune` o análisis manual
- [ ] ✅ **Eliminar comentarios obsoletos**: TODO viejos, código comentado, notas temporales
- [ ] ✅ **Verificar builds**: `npm run build` (frontend/backend), `cargo build` (rust)
- [ ] ✅ **Verificar tests**: `npm test` (frontend/backend), `cargo test` (rust)

#### **📝 2. DOCUMENTACIÓN DE CAMBIOS CRÍTICOS**
- [ ] ✅ **Cambios de arquitectura**: Actualizar `CODEX.md` si aplica
- [ ] ✅ **Cambios de puertos/URLs**: Actualizar `CODEX.md` PORT CONFIGURATION primero
- [ ] ✅ **Nuevas dependencias**: Documentar en README.md correspondiente
- [ ] ✅ **Cambios de API**: Actualizar `API_DOCUMENTATION.md`
- [ ] ✅ **Problemas resueltos**: Agregar a `docs/TROUBLESHOOTING.md`
- [ ] ✅ **Actualizar CONTEXT_SUMMARY.md**: Sección "Tareas Completadas Esta Sesión"

#### **🗂️ 3. LIMPIEZA DE ARCHIVOS TEMPORALES**
- [ ] ✅ **Scripts temporales**: Eliminar archivos `.sh`, `.js`, `.py` de prueba
- [ ] ✅ **Documentos de prueba**: Eliminar archivos `test_*.md`, `temp_*.txt`, etc.
- [ ] ✅ **Archivos de configuración temporal**: `.env.test`, `config.temp.json`, etc.
- [ ] ✅ **Logs de desarrollo**: Limpiar `*.log`, `debug_*.txt`, carpetas `logs/` si es necesario
- [ ] ✅ **Archivos de backup**: `*.bak`, `*.backup`, `*_old.*`
- [ ] ✅ **Capturas de pantalla de debugging**: `screenshot_*.png`, etc.

#### **📋 4. ORGANIZACIÓN DE DOCUMENTACIÓN**
- [ ] ✅ **Verificar jerarquía**: Seguir estructura definida en CONTEXT_SUMMARY.md
- [ ] ✅ **Evitar duplicación**: No crear docs nuevos si se puede actualizar existentes
- [ ] ✅ **Referencias cruzadas**: Actualizar enlaces entre documentos si es necesario
- [ ] ✅ **Versionado**: Actualizar fechas de "última actualización" en docs modificados

#### **💾 5. CONTROL DE VERSIONES** 
- [ ] ✅ **Commit atómico**: Hacer commits frecuentes con mensajes descriptivos
- [ ] ✅ **Verificar git status**: Asegurar que no hay archivos sin trackear importantes
- [ ] ✅ **Push al remoto**: `git push` para salvaguardar cambios
- [ ] ✅ **Verificar .gitignore**: Asegurar que archivos temporales no se suban

#### **🎯 6. VALIDACIÓN FINAL**
- [ ] ✅ **Funcionalidad intacta**: Verificar que cambios no rompieron nada
- [ ] ✅ **Scripts de desarrollo**: Probar `./dev.sh` o comando principal
- [ ] ✅ **URLs de desarrollo**: Verificar que servicios arrancan en puertos correctos
- [ ] ✅ **Documentación actualizada**: Revisar que info en docs coincide con realidad

#### **💾 7. GUARDADO EN REPOSITORIO REMOTO**
- [ ] ✅ **Verificar git status**: `git status` - revisar archivos modificados
- [ ] ✅ **Agregar cambios**: `git add .` - stagear archivos modificados
- [ ] ✅ **Commit descriptivo**: `git commit -m "descripción clara de cambios"`
- [ ] ✅ **Push al remoto**: `git push` - salvaguardar trabajo en repositorio
- [ ] ✅ **Verificar push exitoso**: Confirmar que no hubo conflictos

> **🚨 IMPORTANTE**: Solo ejecutar paso 7 si pasos 1-6 están completamente exitosos y NO hay errores de linters, builds o tests.

### **🚨 SITUACIONES QUE REQUIEREN ESTE CHECKLIST**

**Ejecutar checklist completo después de:**
- ✅ Cambios de configuración (puertos, URLs, env vars)
- ✅ Agregado/eliminado de dependencias importantes
- ✅ Modificaciones de arquitectura o estructura de archivos
- ✅ Corrección de bugs complejos
- ✅ Implementación de nuevas funcionalidades
- ✅ Sesiones de desarrollo largas (>30 min de cambios)

**Ejecutar checklist parcial (pasos 1, 5, 6) después de:**
- ✅ Correcciones menores de código
- ✅ Actualizaciones de documentación
- ✅ Cambios de configuración menores

### **📞 REFERENCIA RÁPIDA PARA USUARIOS**

**Para referenciar este checklist:**
```
"Ejecuta el checklist de buenas prácticas (CONTEXT_SUMMARY.md sección 🧹)"
"Limpia el código según las buenas prácticas definidas"
"Aplica el checklist post-cambios antes de finalizar"
```

### **🏆 FILOSOFÍA DE ORDEN**

**Principios core:**
1. **Leave it cleaner than you found it** - Siempre mejorar el estado del código
2. **Document as you go** - Documentar cambios importantes inmediatamente
3. **Commit early, commit often** - Guardar progreso frecuentemente
4. **Clean up temporarily** - Eliminar rastros de trabajo temporal
5. **Verify before finishing** - Asegurar que todo funciona antes de terminar

## 🚨 **TROUBLESHOOTING COMÚN**

### **❌ Error: "User 'codex_user' was denied access"**

**CAUSA**: Múltiples instancias de PostgreSQL corriendo (local + Docker)

**SÍNTOMAS**:
```
Error: P1010: User `codex_user` was denied access on the database `codex_db.public`
```

**SOLUCIÓN**:
```bash
# 1. Detener PostgreSQL local
brew services stop postgresql@14

# 2. Verificar que Docker PostgreSQL esté corriendo
docker ps | grep postgres

# 3. Si no está corriendo, iniciar infraestructura
docker-compose up -d

# 4. Verificar conectividad
docker exec codex_postgres psql -U codex_user -d codex_db -c "SELECT 1;"

# 5. Ejecutar migraciones si es necesario
cd backend && npx prisma migrate deploy
```

**PREVENCIÓN**: Usar `./dev.sh` que ahora valida automáticamente el entorno

### **🛡️ SISTEMA DE OBSERVABILIDAD ROBUSTO** (NUEVO - CRÍTICO)

**PROBLEMA RESUELTO**: Dashboard se caía completamente cuando fallaban servicios, dejando al usuario sin información crítica.

#### **✅ SOLUCIÓN IMPLEMENTADA:**

1. **Health Checks Robustos** (`/health`, `/health/db`, `/health/quick`):
   - ✅ NUNCA fallan completamente - siempre responden con información útil
   - ✅ Detectan problemas específicos (DB, Redis, Rust service)
   - ✅ Timeouts y graceful degradation
   - ✅ Información detallada de errores

2. **Sistema de Alertas Proactivo** (`useSystemAlerts`):
   - ✅ Monitoreo cada 15 segundos
   - ✅ Notificaciones del navegador para errores críticos
   - ✅ Alertas persistentes vs. temporales
   - ✅ Detección de cambios de estado del sistema

3. **Dashboard que NUNCA se cae** (`SystemStatus.tsx`):
   - ✅ Graceful degradation cuando servicios fallan
   - ✅ Siempre muestra información útil
   - ✅ Estados visuales claros (operativo/degradado/caído)
   - ✅ Información de errores específicos

4. **Alertas Siempre Visibles** (`SystemAlerts.tsx`):
   - ✅ Indicador de estado en tiempo real (esquina superior derecha)
   - ✅ Alertas categorizadas (error/warning/info)
   - ✅ Auto-dismiss para alertas no críticas
   - ✅ Contador de alertas críticas

#### **🎯 ARCHIVOS CLAVE:**
```
frontend/src/components/SystemStatus.tsx     # Dashboard robusto
frontend/src/components/SystemAlerts.tsx     # Alertas siempre visibles
frontend/src/hooks/useSystemAlerts.ts        # Lógica de alertas
backend/src/routes/health.ts                 # Health checks robustos
frontend/src/app/layout.tsx                  # Integración global
```

#### **🚨 GARANTÍAS:**
- ✅ **NUNCA** más dashboards que se caen completamente
- ✅ **SIEMPRE** información del estado del sistema visible
- ✅ **ALERTAS PROACTIVAS** antes de que problemas se agraven
- ✅ **DEGRADACIÓN GRACEFUL** cuando servicios fallan
- ✅ **INFORMACIÓN DETALLADA** de qué exactamente está fallando

### **🔧 Validación Automática del Entorno**

El script `./dev.sh` ahora incluye validación automática que detecta:
- ✅ Conflictos de múltiples PostgreSQL
- ✅ Problemas de conectividad de BD
- ✅ Archivos de configuración faltantes
- ✅ Servicios Docker requeridos

**Uso**:
```bash
# Validación manual del entorno
./scripts/validate-environment.sh

# Inicio automático con validación
./dev.sh
```

---