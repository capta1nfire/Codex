# 📋 AUDITOR GUIDELINES - Directrices para Análisis y Auditoría CODEX

> **🎯 Propósito**: Establecer reglas claras para mantener el código y documentación "como un espejo" - perfectamente sincronizados y reflejando la realidad.

## 🪞 Filosofía del Espejo

### Principio Fundamental
**"La documentación debe ser un reflejo EXACTO del código, no una aspiración"**

```
CÓDIGO (Realidad) ←→ DOCUMENTACIÓN (Reflejo)
         ↑                    ↑
         └────── ESPEJO ──────┘
```

### Reglas del Espejo:
1. **Si no está en el código, NO debe estar en la documentación**
2. **Si está en el código, DEBE estar documentado (solo si es público)**
3. **La documentación NUNCA dicta, solo refleja**
4. **El código es la única fuente de verdad**

## 📏 Directrices FLODEX para Auditoría

### 1. Análisis por Servicio (NO Global)
```
✅ CORRECTO:
- Analizar backend/README.md vs backend/src/
- Verificar frontend/README.md vs frontend/src/
- Auditar rust_generator/README.md vs rust_generator/src/

❌ INCORRECTO:
- Crear documentación global
- Mezclar información entre servicios
- Sugerir archivos fuera de servicios
```

### 2. Jerarquía de Documentación
```
PRIORIDAD 1: README.md del servicio
PRIORIDAD 2: Comentarios en código
PRIORIDAD 3: Docs técnicos específicos (si existen)
NUNCA: Crear nuevos archivos de documentación
```

### 3. Proceso de Auditoría FLODEX

#### Paso 1: Mapeo de Realidad
```typescript
// Para cada servicio:
1. Listar TODAS las funciones/endpoints/componentes públicos
2. Crear mapa mental del código REAL
3. Ignorar código interno/privado
```

#### Paso 2: Contraste con Documentación
```typescript
// Comparar:
- README.md del servicio ¿refleja lo que existe?
- ¿Hay features documentadas que no existen?
- ¿Hay features existentes no documentadas?
```

#### Paso 3: Reporte de Discrepancias
```markdown
## Discrepancias [Servicio]

### Documentado pero NO existe:
- Endpoint: POST /api/v2/users (README línea 45)
- Función: processPayment() (README línea 78)

### Existe pero NO documentado:
- Endpoint: GET /api/v2/analytics (archivo: routes/analytics.ts:23)
- Component: DashboardWidget (archivo: components/Dashboard.tsx:156)

### Información Incorrecta:
- README dice: "retorna JSON" → Realidad: retorna blob (archivo: services/export.ts:89)
```

## 🚫 Política ANTI-Documentación

### NUNCA Sugerir Crear:
```
❌ architecture-overview.md
❌ implementation-notes.md
❌ feature-planning.md
❌ technical-decisions.md
❌ api-design.md
```

### SIEMPRE Actualizar Existente:
```
✅ [servicio]/README.md
✅ Comentarios en código
✅ CHANGELOG.md (solo para cambios ejecutados)
```

### Excepción Única:
Solo si el usuario EXPLÍCITAMENTE pide: "Crea un documento sobre X"

## 🔍 Técnicas de Auditoría

### 1. Verificación de Endpoints
```bash
# Realidad: Buscar todas las rutas
grep -r "router\." backend/src/routes/
grep -r "app\." backend/src/

# Documentación: Verificar en README
# Comparar lista real vs documentada
```

### 2. Verificación de Componentes
```bash
# Realidad: Buscar exports
grep -r "export.*function" frontend/src/
grep -r "export.*const.*=.*React.FC" frontend/src/

# Documentación: Verificar en README
# Solo componentes PÚBLICOS/REUTILIZABLES
```

### 3. Verificación de Tipos/Interfaces
```bash
# Realidad: Buscar tipos públicos
grep -r "export.*interface" */src/
grep -r "export.*type" */src/

# Documentación: ¿Están los críticos documentados?
```

## 📊 Formato de Reportes

### Reporte de Auditoría Estándar
```markdown
# 🔍 Auditoría CODEX - [Fecha]

## Servicio: [Backend/Frontend/Rust]

### ✅ Sincronizado
- Feature X: Código y docs coinciden
- API Y: Documentación precisa

### ⚠️ Desincronizado
| Tipo | Documentación | Realidad | Ubicación |
|------|---------------|----------|-----------|
| Endpoint | GET /api/users | GET /api/v2/users | routes/users.ts:15 |
| Parámetro | limit: number | limit: string | schemas/user.ts:23 |

### 🧹 Código Muerto Detectado
- Función `oldProcessor()` sin uso - utils/legacy.ts:45
- Import sin usar: `lodash` - services/data.ts:3

### 📋 Acciones Recomendadas
1. Actualizar README.md línea 67: cambiar ruta endpoint
2. Eliminar función `oldProcessor()`
3. Remover import no usado
```

## 🎯 Métricas de Calidad

### El Espejo Perfecto:
- **100% Sincronización**: Docs = Código
- **0% Documentación Fantasma**: No docs de features inexistentes
- **0% Features Ocultas**: No features sin documentar
- **Mínima Documentación**: Solo lo necesario

### Indicadores de Problema:
```
🔴 README describe 20 endpoints, código tiene 15
🔴 Documentación menciona "próximamente"
🔴 Diagramas de arquitectura no coinciden
🔴 Ejemplos de código no funcionan
```

## 🤖 Prompts de Auto-Verificación

Antes de reportar, pregúntate:

1. **¿Estoy sugiriendo CREAR documentación?** → STOP
2. **¿Estoy comparando código vs docs existentes?** → ✅
3. **¿Mi reporte tiene ubicaciones específicas?** → ✅
4. **¿Estoy mezclando servicios?** → STOP
5. **¿El usuario pidió explícitamente esto?** → ✅

## 📝 Plantillas de Comunicación

### Para Reportar Discrepancia:
```
"En [servicio]/README.md línea [X] se documenta [feature], 
pero en el código no existe. El código real en [archivo]:[línea] 
hace [realidad]."
```

### Para Sugerir Actualización:
```
"Detecté que [componente] en [archivo]:[línea] no está documentado.
Sugiero actualizar [servicio]/README.md agregando: [texto específico]"
```

### Para Código Muerto:
```
"La función [nombre] en [archivo]:[línea] no tiene referencias.
Búsqueda: grep -r 'nombre' devuelve solo su definición."
```

## 🚨 Banderas Rojas

Si te encuentras:
- Escribiendo más de 5 líneas de documentación nueva → STOP
- Creando un archivo .md → STOP  
- Sugiriendo "mejorar" documentación → STOP
- Documentando código interno/privado → STOP

## ✅ Banderas Verdes

Continúa si estás:
- Actualizando líneas específicas en README existente
- Eliminando documentación de features removidas
- Corrigiendo información incorrecta
- Reportando discrepancias código vs docs

---

**RECORDATORIO FINAL**: Tu trabajo es ser un espejo, no un pintor. Reflejas la realidad, no la creas.