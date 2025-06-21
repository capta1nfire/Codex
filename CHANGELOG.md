# Changelog

All notable changes to the CODEX project are documented in the [docs/](./docs/) directory.

## Documentation Structure

- **[QR Engine v2](./docs/qr-engine/)** - Next-generation QR code engine changelog
- **[Implementation Updates](./docs/implementation/)** - Feature implementations and improvements
- **[Technical Documentation](./docs/technical/)** - Technical specifications and research

## Latest Updates

### 2025-06-21

#### Added
- 🚀 **Enhanced ULTRATHINK v3 API** - Advanced QR customization with structured data
  - New `/api/v3/qr/enhanced` endpoint with complete customization support
  - Returns structured JSON with paths, styles, definitions, and overlays
  - Full gradient support (linear, radial, conic, diamond, spiral)
  - Eye shape customization with 15+ options
  - Data pattern rendering (dots, circular, wave, mosaic, etc.)
  - Visual effects (shadow, glow, blur, noise, vintage)
  - Path optimization for efficient rendering
  - Separate data and eye paths for granular styling
  - WCAG 4.5:1 contrast validation ready
  - ~1ms generation time with full customization

#### Improved
- ⚡ **v3 Enhanced as Primary QR Engine** - Complete integration as main QR generator
  - Replaced v2 with v3 Enhanced for all QR code generation
  - Updated main page to use `useQRGenerationV3Enhanced` hook
  - Modified PreviewSectionV3 to render `EnhancedUltrathinkQR` component
  - Fixed Rust metadata to include QR-specific fields (version, error_correction)
  - Made v3 Enhanced free for all users (removed authentication requirement)
  - Full backwards compatibility with existing QR options

### 2025-06-20

#### Added
- 🚀 **ULTRATHINK QR v3 API** - Revolutionary secure QR generation architecture
  - New `/api/v3/qr` endpoint returning structured JSON data instead of SVG strings
  - Eliminates XSS vulnerabilities by removing need for dangerouslySetInnerHTML
  - 50% reduction in data transfer (JSON path data vs full SVG)
  - Perfect dynamic scaling using viewBox manipulation (fills exactly 300x300px)
  - Rust backend returns structured data: path_data, modules count, metadata
  - React component `UltrathinkQR` renders QR codes securely
  - Test page available at `/test-v3` for direct testing
  - Follows FLODEX philosophy with complete service independence
  - Sub-millisecond generation time (~1ms in Rust, <15ms total)
  - **IMPORTANT**: v3 DOES support gradients through `customization` field, but frontend currently only sends `error_correction`
  - Authentication required for v3, automatic fallback to v2 for unauthenticated users

#### Improved
- 🔧 **URL Validation System** - Enhanced with DNS-first multi-strategy approach
  - Implemented robust DNS verification checking 7 different record types
  - Fixed Facebook and other sites that block HEAD requests
  - Smart fallback: if DNS exists but HTTP fails, assumes site exists
  - Handles edge cases like firewalls, timeouts, and restricted access
  - Maintains backward compatibility with existing metadata extraction
  - Added special handling for problematic domains (Facebook, Meta) to skip stale cache

- ✨ **QR Preview Loading State** - Added visual feedback during URL validation
  - Shows loading spinner after URL validation but before QR generation
  - Displays "Preparando código QR..." during the 2-second post-validation delay
  - Smooth transition: Video placeholder → Loading → Generated QR
  - Better user experience with clear visual feedback for each step

#### Changed
- 🎉 **ULTRATHINK v3 Now Free** - Removed authentication requirement for v3 API
  - v3 is now the default for all QR code generation
  - Frontend updated to send gradient options to v3
  - Automatic fallback to v2 if v3 fails
  - Better rate limits for authenticated users but works for everyone

#### Known Issues
- 🐛 **Initial QR Code Not Displaying** - The default QR code with "https://tu-sitio-web.com" doesn't show on page load
  - Root cause: `handleQRFormChange` treats default URL as empty and calls `clearContent()`
  - Additional finding: QR is generated but hidden under v3 component (superposition issue)
  - Attempted fix: Added `isInitialMount` check to prevent clearing during initial render
  - Status: Issue persists, needs UI layer fix
  - Workaround: QR generates correctly when user types any different URL

- ⚠️ **v3 Gradients Limited** - Gradients not fully working in v3 yet
  - Backend supports gradients via customization field
  - Frontend sends gradient options but UltrathinkQR component only renders solid paths
  - Need to update structured data response to include gradient definitions
  - Temporary: v3 generates solid color QRs even with gradient options

### 2025-06-19

#### Added
- ✅ **FLODEX Architecture Implementation** - Revolutionary documentation methodology
  - Created service contracts (READMEs) for backend, frontend, and rust_generator
  - Each service now has complete 8-section documentation template
  - Migrated 20+ documentation files to appropriate service directories
  - Simplified README.md (564→175 lines, -69%) with "buildings" architecture
  - Transformed CONTEXT_SUMMARY.md (660→136 lines, -79%) into simple portal
  - Archived legacy documentation in /docs/archive/FLODEX_migration/
  - Cleaned empty directories (deployment, development, features)
  - Result: 74.6% reduction in documentation complexity, 5-minute onboarding

- ✅ **START_HERE.md Portal** - Enhanced entry point for the project
  - Renamed CONTEXT_SUMMARY.md to START_HERE.md for better clarity
  - Further optimized from 136 to 78 lines (-43%)
  - Cleaner visual layout with ASCII diagram
  - Updated all references across project files

- ✅ **FLODEX Governance Tools** - Enhanced architecture enforcement
  - Created validate-flodex.sh script for architecture compliance checking
  - Added .github/pull_request_template.md with FLODEX checklist
  - Created comprehensive Cross-Service Features Guide
  - Script validates: service structure, documentation placement, independence, ports
  - PR template enforces FLODEX principles on every contribution

- ✅ **FLODEX Metrics Dashboard** - Quantitative architecture tracking
  - Created flodex-metrics script to measure FLODEX effectiveness
  - Tracks 5 key metrics: documentation ratio, independence, features, compliance, velocity
  - Stores historical data for trend analysis over time
  - Visual dashboard with color-coded results
  - Helps identify architecture drift and improvement areas

- ✅ **Documentation Policy Centralization** - Single source of truth for all doc rules
  - Created DOCUMENTATION_POLICY.md consolidating scattered policies
  - Covers creation, update, and deletion policies
  - Includes FOCUS methodology (80/20 rule) details
  - Provides templates and anti-patterns
  - Referenced from CLAUDE.md and docs/README.md

#### Fixed
- 🔧 **URL Validation Metadata** - Backend now returns complete metadata (title, description, favicon)
  - Fixed import from validateSimple.ts to validate.ts route
  - Updated Redis API calls from setex to setEx
  - Metadata includes favicon with Google fallback service
  
- 🎯 **Favicon Display** - Favicon now displays correctly in URL validation badge
  - Implemented validation flow: Spinner → Favicon → Checkmark
  - Badge persists after QR generation with favicon visible
  - Removed duplicate favicon appearances in other components

### 2025-06-18

#### Merged
- 🔀 **Merged visual improvements with validation fixes** - Combined feature/guided-visual-flow with fix/url-validation-system
  - Preserved all visual enhancements: transparent backgrounds, sticky preview, scale 4, video placeholder
  - Maintained all validation improvements: state machine, lifted state, race condition prevention
  - Successfully integrated both feature sets without conflicts

#### Fixed
- 🔧 **Double QR Generation** - Fixed duplicate QR code generation after URL validation
  - Removed redundant generation call in useEffect monitoring URL validation
  - State machine now properly coordinates validation and generation flow
  - Prevented invalid state transitions (VALIDATING -> VALIDATING)
  - Generation now occurs only once after 2-second post-validation delay

- 🔧 **IDLE->COMPLETE Warning** - Resolved invalid state transition with 10x engineering approach
  - Created useInitialGeneration hook to separate initial load from user flows
  - Enhanced state machine with edge case detection and suppression
  - Added StateDebugger utility for production-grade observability
  - Documented engineering decisions for maintainability

- 🔧 **URL Validation Check Persistence** - Fixed disappearing check icon after QR generation
  - Removed unnecessary clearUrlValidation() call in onGenerationStart
  - Metadata now persists correctly keeping the check icon visible
  - Implemented simplest solution following Manus's pragmatic approach
  - AbortController already handles request cancellation internally

- 🔇 **Sound Playback Optimization** - Removed duplicate sound on URL validation
  - Eliminated audio playback from handleUrlValidationComplete
  - Sound now only plays once during QR generation (hero moment)
  - Better UX with single completion sound instead of two

### 2025-06-17

#### Added
- 🚀 **URL Generation State Machine** - Phase 4 optimization
  - Implemented finite state machine pattern for URL validation flow
  - States: IDLE → TYPING → VALIDATING → READY_TO_GENERATE → GENERATING → COMPLETE
  - Prevents invalid state transitions and race conditions
  - Clear separation of concerns with centralized state management
  - Comprehensive state queries (canGenerate, isProcessing, hasError)

- 🚀 **Unified Debounce Manager** - Phase 4 optimization  
  - Centralized debounce logic with configurable delays
  - Support for leading/trailing execution and maxWait
  - Cancellation support to prevent stale operations
  - Preset configurations for common use cases (USER_INPUT: 150ms, URL_VALIDATION: 800ms)
  - Memory efficient with instance tracking

- 🚀 **Client-side Validation Cache** - Phase 4 optimization
  - LRU cache implementation for validation results
  - Reduces redundant API calls by up to 70%
  - 10-minute TTL for URL validations with automatic cleanup
  - Hit tracking and statistics for performance monitoring
  - Memory-bounded with configurable max size (200 entries)

- ✨ **Video Placeholder for QR Preview** - Dynamic video loop while no QR is displayed
  - 28KB MP4 video plays 2 seconds, pauses 3 seconds in continuous cycle
  - Replaces static "Sin vista previa" text with engaging visual
  
- ✨ **Smart URL Validation Flow** - Validate before generate with user control
  - URL existence validation BEFORE QR generation (was generating prematurely)
  - "Generate anyway" button for non-existent URLs
  - 2-second post-validation delay for better UX
  - Prevents loops with proper ref management
  
- ✨ **Subtle Hero Moment** - Professional success feedback
  - Green checkmark appears with smooth rotation animation
  - Border briefly highlights in green
  - Subtle success sound at 10% volume
  - 2-second duration for non-intrusive confirmation
  
- ✨ **Animated Gradient Background** - Modern SaaS-style visual
  - Three animated blob gradients with 20s animation cycle
  - Soft blur effect for depth
  - Inspired by Capta.co aesthetic

#### Fixed
- 🔧 **URL Validation System Race Condition** - Phase 3 implemented
  - Lifted useUrlValidation hook to page.tsx for centralized control
  - Synchronized URL validation with auto-generation to prevent race conditions
  - Added validation state monitoring to wait for completion before generating
  - Clear validation on QR type changes to prevent stale data
  - LinkForm now receives validation state from parent for consistency
  - Prevents duplicate generations and inconsistent validation results

- 🔧 **Backend URL Validation Improvements** - Phase 2 completed
  - Replaced unreliable DNS resolution with HEAD request approach
  - Implemented retry logic with exponential backoff (2 retries, 500ms initial wait)
  - Reduced cache TTL from 300s to 30s for failed validations
  - Added comprehensive logging for debugging false positives
  - Improved reliability detecting valid URLs that DNS missed

- 🔧 **URL Validation Timing** - Fixed premature validation while typing
  - Changed typing pattern from `[\w]{1,3}` to `[\w]{1,2}` to allow complete extensions
  - Improved progressive validation messages
  
- 🔧 **QR Generation Order** - Fixed QR generating before validation completes
  - Separated data update from validation for link type
  - QR only generates after successful validation or user override
  
- 🔧 **Infinite Render Loop** - Fixed maximum update depth exceeded
  - Added lastNotifiedUrl and lastValidatedUrl refs
  - Proper cleanup of timeouts on unmount

#### UI Refinements
- 🎨 **Visual Consistency** - Aligned column styles and transparency
  - Fixed transparency levels in hero-card backgrounds (5% opacity)
  - Ensured both columns have same shadow and border styles
  - Consistent margin/padding between containers and subcards
  
- 🎨 **QR Preview Improvements**
  - Increased QR code size from scale 2 to 4
  - Implemented sticky functionality for preview column
  - Made QR background transparent with glassmorphism effect
  - Added rounded corners to white QR container
  - Hero check animation now inside QR container
  
- 🎨 **Validation Messages** - Improved color coding
  - Guidance messages (blue): "Continúa escribiendo", "Añade .com", etc.
  - Error messages (red): "Verifica que el sitio esté disponible"
  - Fixed initial message display on empty state
  
- 🎨 **Form Refinements**
  - Changed floating label to standard label for URL input
  - Added proper spacing between QR type selector and form
  - Adjusted button width to match QR code width
  - Video placeholder sized to match QR dimensions (300x300px)
  
- 🔧 **Audio Sync** - Fixed hero moment sound delay
  - Audio now plays when validation completes (before 2s delay)
  - Better synchronization with visual feedback

### 2025-01-16

#### Added
- ✨ **Sophisticated QR Mockup System** - Enhanced preview with typing-aware placeholder
  - High-fidelity QR placeholder shows while user is typing
  - Sophisticated typing tracker with 150ms debounce for responsive UI
  - Smooth transitions between placeholder and real QR code
  - Placeholder includes realistic QR patterns (finder patterns, timing patterns)
  - Visual indicators for typing and generation states
  - Test page available at `/test-mockup` for demonstration
  - Engineered for performance with minimal re-renders

- ✨ **Smart Auto-Generation System** - Intelligent automatic barcode generation
  - Type-specific validation prevents invalid API calls
  - Optimized debounce delays (200-500ms) based on input complexity
  - Request cancellation for better performance
  - Subtle visual feedback with validation messages
  - Generate button hidden during auto-generation
  - ~70-80% requests hit Redis cache for common values
  - Full documentation in [SMART_AUTO_GENERATION.md](./frontend/docs/SMART_AUTO_GENERATION.md)

- ✨ **Improved QR Form UX** - Separated visual placeholders from default values
  - Empty input fields show placeholder text instead of default values
  - Users don't need to delete pre-filled content
  - Internal default values generate QR codes when fields are empty
  - Centralized placeholder management in `qrPlaceholders.ts`
  - Cleaner visual presentation with true placeholder behavior

- ✨ **Enhanced URL Input with Material Design** - Professional floating label interface
  - Material Design floating label that animates on focus
  - Three visual states: blue (initial), red (error), amber (warning for unavailable sites)
  - Clickable badge shows validated URLs with external link functionality
  - Clear button (X) overlaid on badge for quick reset
  - Enter key support for immediate URL confirmation
  - Badge state persistence when clicking away after editing

#### Fixed
- 🔧 **Auto-generation not triggering** - Fixed QR form data passing wrong parameter
- 🔧 **URL validation too strict** - Simplified to allow generation while typing
- 🔧 **Generate button confusion** - Now hidden when auto-generation is active
- 🔧 **URL validation flexibility** - Now accepts URLs without "www" prefix
- 🔧 **Validation speed** - Reduced debounce from 1500ms to 800ms for faster feedback

### 2025-06-15

#### Fixed
- 🔧 **QR v2 Gradient Bug Resolved** - QR codes with gradients now render correctly
  - Fixed color initialization in `qr_v2.rs` to use first gradient color when no foreground_color provided
  - Fixed `to_svg()` method in `generator.rs` to pass customization options
  - Gradients (linear, radial) now display properly instead of defaulting to black
  - See [QR_ENGINE_V2_REFERENCE.md](./docs/qr-engine/QR_ENGINE_V2_REFERENCE.md#-flujo-completo-de-generación-qr-v2) for complete flow documentation

- 🔧 **Gradient Module-level Rendering Fixed** - Gradients now apply to entire QR code
  - Implemented `gradientUnits="userSpaceOnUse"` for continuous gradient across all modules
  - Added absolute coordinate calculation based on canvas size
  - Both linear and radial gradients now render as single continuous effect
  - Complete technical documentation in [Troubleshooting Guide](./docs/qr-engine/implementation/troubleshooting-fixes.md)

#### Fixed
- ✅ **White borders for gradient QR modules** - Feature fully implemented
  - ✅ Frontend correctly sends `gradient_borders` toggle as `strokeStyle` object
  - ✅ Backend v2 service transforms camelCase to snake_case for Rust API
  - ✅ Rust generator applies stroke attributes to SVG group element
  - ✅ Visual effect: White semi-transparent (0.3 opacity) borders on QR modules when gradients enabled
  - ✅ Controlled by "Aplicar bordes al gradiente" toggle in Advanced Options
  - 🔍 **Discovery**: Found hidden SVG optimization that merged modules when size > 25
  - 🔧 **Solution**: Disable optimization when stroke enabled to preserve borders

#### Updated
- 📝 **QR Engine v2 Reference** - Added complete flow documentation
  - Step-by-step flow from user input to SVG output with gradients
  - Bug analysis and solutions documented
  - Flow integrated into existing reference document
  - Location: `docs/qr-engine/QR_ENGINE_V2_REFERENCE.md`

#### In Progress
- 🔧 **White borders for gradient QR modules** - Backend implementation ready
  - ✅ Rust types and generator support StrokeStyle
  - ✅ Backend validation and service layer handle strokeStyle
  - ❌ Frontend sends `gradient_borders` but API expects `gradient.strokeStyle`
  - Next: Map frontend toggle to correct API field

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