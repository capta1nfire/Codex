# FLODEX - Propuesta de Migración de Documentación

## FASE 0: Análisis y Clasificación de Archivos

### Resumen de Archivos Encontrados
- Total de archivos .md: 75
- Necesitan migración activa: ~35
- Ya archivados: ~20
- Permanecen como globales: ~10

### Clasificación Propuesta por Categoría

## 1. BACKEND (Migrar a `backend/README.md`)
- `./docs/api/README.md` - Documentación de la API
- `./docs/api/v1-v2-migration-guide.md` - Guía de migración de endpoints
- `./docs/database/README.md` - Documentación de base de datos
- `./docs/BATCH_PROCESSING_GUIDE.md` - Procesamiento batch (feature del backend)
- `./docs/PORT_MIGRATION_CHECKLIST.md` - Puertos y configuración del backend
- `./backend/README.md` - README actual (será reemplazado)

## 2. FRONTEND (Migrar a `frontend/README.md`)
- `./docs/CODEX_DESIGN_SYSTEM.md` - Sistema de diseño UI/UX
- `./docs/CLIPBOARD_FIX.md` - Fix del clipboard (componente frontend)
- `./docs/E2E_TESTING_GUIDE.md` - Testing E2E (principalmente frontend)
- `./docs/IMAGE_OPTIMIZATION_GUIDE.md` - Optimización de imágenes
- `./docs/STICKY_COLUMN_ISSUE_PROMPT.md` - Issue específico del frontend
- `./docs/SVG_GRADIENT_SYSTEM.md` - Sistema de gradientes SVG
- `./frontend/docs/SMART_AUTO_GENERATION.md` - Feature de auto-generación
- `./frontend/test-service-buttons.md` - Tests de servicios
- `./frontend/test-tab-rerenders.md` - Tests de tabs
- `./frontend/V2_MIGRATION_STATUS.md` - Estado de migración a v2
- `./frontend/README.md` - README actual (será reemplazado)

## 3. RUST_GENERATOR (Migrar a `rust_generator/README.md`)
- `./rust_generator/API_DOCS.md` - Documentación de la API Rust
- `./rust_generator/README.md` - README actual (será reemplazado)
- `./docs/technical/barcode-research.md` - Investigación técnica de códigos de barras

## 4. GLOBAL (Conservar en raíz o `/docs` simplificado)
- `./CHANGELOG.md` - Historial de cambios del proyecto
- `./CLAUDE.md` - Guía para agentes IA (metodología de trabajo)
- `./CODEX.md` - Visión estratégica y roadmap
- `./README.md` - README principal (actualizar para FLODEX)
- `./CONTEXT_SUMMARY.md` - Será reemplazado por v2.0 simplificado
- `./.nav.md` - Navegación rápida (actualizar referencias)

## 5. QR ENGINE V2 (Decisión especial necesaria)
### Opción A: Distribuir entre servicios
- Backend: Lógica de generación
- Frontend: Integración UI
- Rust: Motor de generación

### Opción B: Mantener como módulo global en `/docs/qr-engine`
- `./docs/qr-engine/QR_ENGINE_V2_REFERENCE.md` - Referencia completa
- `./docs/qr-engine/README.md` - Documentación principal
- Y todos los subdirectorios relacionados

**Recomendación**: Opción B por ser una feature cross-service crítica

## 6. ARCHIVAR (Mover a `docs/archive/`)
- `./.workspace/*` - Logs de sesiones de trabajo
- `./docs/archive/*` - Ya archivados (mantener donde están)
- `./docs/DOCUMENTATION_AUDIT_20250608.md` - Auditoría antigua
- `./docs/implementation/audit-jules/*` - Auditoría específica
- `./docs/technical/remember-me-auth-issue-20250611.md` - Issue resuelto
- `./docs/technical/endpoint-restructuring-challenges-20250614.md` - Desafíos pasados
- `./docs/technical/performance-optimization-session-20250609.md` - Sesión específica
- `./scripts/README.md` - Scripts ya no utilizados

## 7. INTEGRAR EN CÓDIGO (Como docstrings o comentarios)
- `./docs/TROUBLESHOOTING.md` - Convertir en comentarios donde ocurren los problemas
- `./docs/TECHNICAL_IMPROVEMENTS_2025.md` - Convertir en TODOs o issues
- `./docs/implementation/performance-optimization-files.md` - Comentarios en archivos optimizados
- `./docs/implementation/url-validation-fixes-20250617.md` - Comentarios en el código de validación

## 8. REQUIEREN ANÁLISIS ADICIONAL
- `./docs/implementation/README.md` - Revisar contenido
- `./docs/implementation/features/*` - Determinar si son actuales
- `./docs/implementation/quality/*` - Verificar relevancia
- `./docs/README.md` - Revisar qué contiene

---

## Siguiente Paso
Por favor, revisa esta propuesta de clasificación y confirma si estás de acuerdo con la categorización o si hay ajustes que realizar antes de proceder con la FASE 1.

### Puntos clave para tu decisión:
1. ¿Qué hacer con la documentación de QR Engine v2? (Opción A o B)
2. ¿Estás de acuerdo con los archivos propuestos para archivar?
3. ¿Hay algún archivo que consideres crítico mantener como global?