# Changelog

All notable changes to the CODEX project are documented in the [docs/](./docs/) directory.

## Documentation Structure

- **[QR Engine v2](./docs/qr-engine/)** - Next-generation QR code engine changelog
- **[Implementation Updates](./docs/implementation/)** - Feature implementations and improvements
- **[Technical Documentation](./docs/technical/)** - Technical specifications and research

## Latest Updates

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