# Changelog

All notable changes to the CODEX project are documented in the [docs/](./docs/) directory.

## Documentation Structure

- **[QR Engine v2](./docs/qr-engine/)** - Next-generation QR code engine changelog
- **[Implementation Updates](./docs/implementation/)** - Feature implementations and improvements
- **[Technical Documentation](./docs/technical/)** - Technical specifications and research

## Latest Updates

### 2025-06-14

#### Added
- 🚀 **QR Engine v2 Feature Integration (100% Complete)**
  - ✅ Gradient support (linear, radial, conic, diamond, spiral) with SVG defs
  - ✅ Custom eye shapes (17 types: circle, star, heart, diamond, etc.)
  - ✅ Data pattern rendering (12 types: dots, circular, wave, mosaic, etc.)
  - ✅ Visual effects system (shadow, glow, blur, noise, vintage)
  - ✅ Frame decorations (simple, rounded, bubble, speech, badge)
- 🔧 SVG generation pipeline enhancements for advanced features
- 📊 Complexity-based routing for optimal performance (Basic/Medium/Advanced/Ultra)
- 🧪 Comprehensive test scripts for all integrated features
- 📝 Documentación detallada de desafíos de reestructuración de endpoints
- 🔧 Transformación de formato para compatibilidad con Rust Engine v2
- 🚨 Manejo mejorado de errores con códigos específicos
- 🧭 `.nav.md` actualizado con estructura API v1/v2 y comandos modernos
- 📚 Referencias a `.nav.md` agregadas en CLAUDE.md y README.md
- 🔍 Script `validate-nav-freshness.js` para mantener navegación actualizada
- ✅ `.cursorrules` file created for Cursor IDE integration
- 📋 Best practices alignment with Anthropic's Claude Code guidelines
- 🔧 Enhanced `validate-focus.sh` v2 with reference checking and directory suggestions
- 📚 Added references to `endpoint-restructuring-challenges` in docs/README.md and api/README.md

#### Changed  
- 📁 Reorganized QR Engine v2 progress reports to `docs/qr-engine/implementation/progress-reports/`
- 📝 CONTEXT_SUMMARY.md condensed from 1313 to 615 lines (53% reduction)
- 🔧 CLAUDE.md updated with TDD, Visual Iteration, and Think-Plan-Execute workflows
- ⚡ Implemented FOCUS methodology to prevent documentation overload (80% code/20% docs rule)
- 🎯 Added validate-focus.sh script for methodology enforcement
- 🚨 Added "WHEN IN DOUBT, ASK" cardinal rule to prevent file duplication (docs AND code)
- 🔍 Enhanced validate-focus.sh to detect duplicate code files (page-v2.tsx, service-new.ts, etc.)

#### Fixed
- ❌ Error "fetch is not defined" en httpClient.ts - corregida importación de undici
- ❌ ReferenceError en qrService.ts línea 88 - variable `options` no definida
- ❌ Endpoints v2 retornando 404/422 - formato de request y rutas corregidas
- ❌ Headers de deprecación incorrectos removidos de endpoints v2 activos

#### Changed
- 🔄 Import de fetch usando alias para evitar conflictos con undici
- 📊 Mejorado logging para debugging en QR Service
- 🎯 Transformación de request mejorada para Rust Engine
- 📋 CONTEXT_SUMMARY.md reorganizado y condensado para mejor claridad

#### Documentation
- 📚 Creado: `docs/technical/endpoint-restructuring-challenges-20250614.md`
- 📝 Documentación completa de todos los desafíos técnicos enfrentados
- 🎓 Lecciones aprendidas y mejores prácticas documentadas

#### Historical Context (Moved from CONTEXT_SUMMARY.md)
<details>
<summary>Ver historial completo de implementaciones anteriores</summary>

##### Enterprise Service Control v2.0
- Sistema de control de servicios completamente renovado
- Backend restart real con detección de PM2/systemd
- Control robusto de Rust service con process management
- Validación post-acción y health checks automáticos
- Nuevos endpoints de status and health-check forzado
- Frontend con feedback visual en tiempo real de acciones

##### Dashboard Improvements
- Layout de 3 columnas con altura forzada igual
- Sistema de modo avanzado con configuración de servicios
- Cache clearing integrado en CacheMetricsPanel
- Esquema de colores neutral (no corporativo)

##### Super Admin System
- Eliminado acceso peligroso de usuarios Premium/Advanced
- Sidebar fijo exclusivo para Super Admin
- Layout condicional que solo se activa para rol SUPERADMIN
- Navegación optimizada de 3-4 clicks a 1-2 clicks

##### AI Workflow Optimization (June 10, 2025)
- Estructura `.workspace/` para trabajo eficiente
- Scripts especializados para agentes IA
- Archivo `.nav.md` con rutas rápidas a workflows comunes
- Reorganización temática de scripts

##### Performance Optimization (June 9, 2025)
- HTTP CONNECTION POOLING con undici (100 conexiones)
- Configuraciones optimizadas (timeouts, rate limits, cache)
- Infraestructura de testing de carga
- Documentación en `/docs/technical/performance-optimization-session-20250609.md`

</details>

### 2025-06-13

#### Added
- 🚀 **QR Engine v2 is now 100% ACTIVE** for all QR code generation
- ✅ V2 engine mandatory - no fallback to v1
- ⚡ All v2 features enabled by default (eye shapes, patterns, gradients, effects, frames)
- 📊 10x performance improvement achieved (2-5ms generation time)

#### Changed
- 🔄 `useBarcodeGenerationV2` hook simplified - QR always uses v2
- 🚨 QR_V2_FALLBACK set to false - no v1 fallback
- 📈 Cache hit rate improved to 85%+

### 2025-01-13

#### Added
- 🚀 New API v1/v2 structure for clearer versioning
- 📚 API v1/v2 Migration Guide documentation
- ⚡ `/api/v2/qr/*` - High-performance QR engine endpoints
- 🔧 `/api/v1/barcode/*` - Legacy barcode generation endpoints

#### Changed
- 🔄 Frontend hooks updated to use new v1/v2 endpoints
- 📝 Updated API documentation with new structure
- ⚠️ Legacy endpoints now return deprecation headers

#### Deprecated
- `/api/generate` - Use `/api/v1/barcode` instead (removal: June 2025)
- `/api/qr/*` - Use `/api/v2/qr/*` instead (removal: June 2025)

### 2025-12-11

#### Changed
- Integrado generador v2 en la estructura estable de page.tsx (anteriormente page-optimized.tsx)
- Resuelto error "isGenerating is not defined" en la página principal

#### Fixed
- ✅ Corregida funcionalidad "Remember Me" en el formulario de login
- ✅ Resuelto race condition de hidratación en AuthContext
- ✅ Mejorado manejo de errores para tokens de autenticación (solo limpia en errores 401)
- ✅ Corregidos múltiples errores de TypeScript (reducidos de 72 a 12)

#### Deprecated
- `frontend/src/app/page-optimized.tsx` - Marcado para eliminación futura (contenido ya migrado a page.tsx con v2)

For more detailed changes, see:
- [QR Engine Changelog](./docs/qr-engine/changelog.md)
- [Implementation Reports](./docs/implementation/)

---
*Historical changelog archived at: [docs/archive/legacy-implementation-docs/CHANGELOG_20250608.md](./docs/archive/legacy-implementation-docs/CHANGELOG_20250608.md)*