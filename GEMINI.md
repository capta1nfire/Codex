# 🚀 GEMINI.md - Guía Rápida del Proyecto CODEX

Este documento sirve como una referencia concisa para el agente IA Gemini, resumiendo los aspectos clave del proyecto CODEX para una operación eficiente y contextualizada.

---

## 1. Visión General del Proyecto

*   **Misión:** Construir la plataforma enterprise de generación de códigos más importante del mundo.
*   **Filosofía:** FLODEX - Servicios autónomos como "edificios" independientes, con contratos públicos claros.
*   **Estado:** Plataforma optimizada, segura y enterprise-ready (v2.0.0).

---

## 2. Entorno de Desarrollo

**Configuración Actual:**
*   **SO:** macOS Sequoia 15.5 (24F74)
*   **IDE:** Cursor PRO con integración Claude Code
*   **Agentes IA:** Claude Code + Gemini CLI
*   **Terminal:** Usar comandos de terminal macOS (no equivalentes de Linux)

**Comandos Específicos de macOS:**
```bash
# Monitoreo de procesos
lsof -i :3000        # Verificar puerto (no netstat -tulpn)
lsof -i :3004        # Puerto backend
lsof -i :3002        # Puerto Rust

# Abrir navegador
open http://localhost:3000    # Abre en navegador predeterminado

# Copiar al portapapeles
pbcopy < archivo.txt    # Copiar contenido de archivo al portapapeles

# Uso de memoria
vm_stat              # Estadísticas de memoria macOS (no free -h)

# Operaciones de archivos
ls -la               # Listar archivos con detalles
find . -name "*.ts"  # Encontrar archivos TypeScript
```

**Integración Cursor PRO:**
*   **Claude Code**: Agente principal de desarrollo
*   **Gemini CLI**: Análisis forense y verificación
*   **Coordinación**: Usar MULTI_AGENT_COLLABORATION_PROTOCOL.md

**⚠️ DIFERENCIAS IMPORTANTES de Comandos:**
```bash
# NO usar comandos de Linux:
❌ netstat -tulpn    # Usar: lsof -i :PUERTO
❌ free -h           # Usar: vm_stat
❌ sudo systemctl    # Usar: comandos pm2

# SÍ usar equivalentes de macOS:
✅ lsof -i :3000     # Verificar si el puerto está en uso
✅ vm_stat           # Estadísticas de memoria
✅ open .            # Abrir directorio actual en Finder
✅ pbcopy/pbpaste    # Operaciones de portapapeles
```

---

## 3. Arquitectura FLODEX - Los 3 Edificios

CODEX se compone de tres servicios principales, cada uno con su propio `README.md` como fuente de verdad:

1.  **🌐 FRONTEND:**
    *   **Tecnología:** Next.js 14
    *   **Puerto:** 3000
    *   **Propósito:** Interfaz de usuario, componentes y experiencia del cliente.
    *   **Ruta:** `/frontend/`

2.  **🔧 BACKEND:**
    *   **Tecnología:** Express + Prisma (Node.js)
    *   **Puerto:** 3004
    *   **Propósito:** API principal, lógica de negocio y gestión de base de datos.
    *   **Ruta:** `/backend/`

3.  **⚡ RUST GENERATOR:**
    *   **Tecnología:** Axum + QR Engine v2/v3 (Rust)
    *   **Puerto:** 3002
    *   **Propósito:** Motor de alto rendimiento para la generación de códigos (QR y otros códigos de barras).
    *   **Ruta:** `/rust_generator/`

**Comunicación:** La interacción entre servicios es **exclusivamente vía APIs REST**. No hay código compartido entre ellos.

---

## 4. Principios Clave y Guías para Agentes IA

*   **Reglas FLODEX:**
    *   ✅ **HACER:** Trabajar en el `README.md` del servicio específico.
    *   ✅ **HACER:** Mantener servicios independientes.
    *   ❌ **NO HACER:** Crear docs fuera de servicios.
    *   ❌ **NO HACER:** Mezclar código entre servicios.
*   **Política de Documentación (FOCUS):**
    *   80% Código, 20% Documentación (solo actualizaciones críticas a archivos existentes).
    *   **Prioridad:** Comentarios en código > `CHANGELOG.md` > `Service README` > `TROUBLESHOOTING.md` > `Existing /docs/`.
    *   **CRÍTICO:** Documentar **solo lo que funciona y ha sido probado**.
*   **Flujo de Trabajo (Think-Plan-Execute):**
    1.  **EXPLORAR:** Leer y entender el código (`.nav.md` es tu GPS).
    2.  **PLANIFICAR:** Crear un plan detallado.
    3.  **EJECUTAR:** Implementar incrementalmente.
    4.  **VERIFICAR:** Revisar cambios y ejecutar tests/linters.
*   **Seguridad:** Siempre revisar cambios propuestos, trabajar en ramas aisladas, testear en desarrollo primero.

---

## 5. APIs y Endpoints Principales

El Backend expone varias APIs, incluyendo:

*   **Autenticación:** `/api/auth/register`, `/api/auth/login`.
*   **Generación de Códigos:**
    *   **Legacy (Deprecado):** `/api/generate`, `/api/qr/generate`.
    *   **API v1 (Códigos de Barras):** `/api/v1/barcode`.
    *   **API v3 (QR Estructurado):** `/api/v3/qr` (o `/api/v3/qr/generate`, `/api/v3/qr/enhanced`). Este es el motor principal actual para QR.
    *   **Smart QR:** `/api/smart-qr/generate`, `/api/smart-qr/templates`, `/api/smart-qr/templates/:id`.
*   **Validación:** `/api/validate`.
*   **Control de Servicios:** `/api/services/status`, `/api/services/:service/start/stop/restart`.
*   **Health & Métricas:** `/health`, `/health/status`, `/metrics`.

---

## 6. Flujo de Desarrollo y Herramientas

*   **Inicio Rápido:** `./pm2-start.sh` (inicia todos los servicios con PM2).
*   **Gestión de Servicios:** `pm2 status`, `pm2 logs [servicio]`, `pm2 monit`.
*   **Testing:**
    *   Backend: `cd backend && npm test`
    *   Frontend: `cd frontend && npm test`
    *   Rust: `cd rust_generator && cargo test`
    *   Validación FLODEX: `./scripts/validate-flodex.sh`
*   **Depuración:** `pm2 logs --err`, `npx tsc --noEmit`, `docker exec ... psql`.

---

## 7. Discrepancias Conocidas (Prioridad de Actualización)

Se ha identificado que la `docs/API_DOCUMENTATION.md` está considerablemente desactualizada. Las áreas críticas a corregir incluyen:

*   **CRÍTICO:**
    *   **Smart QR API:** Documentación completamente incorrecta.
    *   **Paths de Endpoints:** Inconsistencias en `/api/validate` y `/api/v2/qr/preview-url`.
    *   **Response Bodies:** Diferencias significativas en `/api/validate` y `/health`.
*   **ALTO:**
    *   **Schemas de Validación:** Listas de `eyeShape`/`dataPattern` y campos de `effects` (`offsetX`, `offsetY`, `blurRadius`) incorrectos/incompletos.
    *   **Autenticación:** Requisitos de autenticación/rol mal documentados para algunos endpoints (ej. `batch`, `cache/stats`, `cache/clear`).
    *   **Parámetros Faltantes:** `url` requerido en `GET /api/smart-qr/templates` y `GET /api/smart-qr/templates/:id` no documentado.
*   **MEDIO:**
    *   **Inconsistencias de Naming:** `camelCase` vs `snake_case` en `batch` options.
    *   **Campos No Documentados:** `stopOnError` en `batch`, límites de batch.
    *   **Roles Incorrectos:** Requisito de rol ADMIN vs solo JWT para `cache/stats` y `cache/clear`.

---

**Este documento es un resumen dinámico. Para detalles técnicos profundos, consulta la documentación específica de cada servicio y módulo.**