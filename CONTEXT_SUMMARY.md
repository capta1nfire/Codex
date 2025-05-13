# Documento de Transferencia de Contexto - Proyecto "Codex"

**Última Actualización:** 2024-08-03
**Estado Actual:** Fase 1.5 (Pre-Beta) → Fase 2 (Beta)

## 🎯 Estado Inmediato

### Problemas Activos
1. **Imagen de Perfil**
   - Comportamiento inconsistente al restablecer a iniciales
   - Se muestra imagen persistente cuando el backend está caído
   - Solución implementada: Modificación de `ProfilePicture.tsx` para manejar mejor el caso de iniciales

### Cambios Recientes
1. **Frontend**
   - Refactorizado sistema de avatares
   - Implementada UI basada en perfiles
   - Mejorada paleta de colores (Qwen - Azul Cobalto)

2. **Backend**
   - Integrado caché Redis en `barcodeService`
   - Implementada validación Zod en rutas principales
   - Documentación Swagger UI en `/api-docs`

### Próximos Pasos Inmediatos
1. Verificar persistencia de imagen de perfil en BD PostgreSQL
2. Revisar y refinar validaciones Zod/Joi
3. Definir índices compuestos en Prisma/PostgreSQL

## 📚 Documentación Clave

### Documentos Maestros
- `CODEX.md`: Documento base con visión estratégica, arquitectura y roadmap
- `CONTEXT_SUMMARY.md`: Este documento - Estado actual y transferencia de contexto
- `CHANGELOG.md`: Historial detallado de cambios y evolución del proyecto

### Documentación Técnica
- `README.md`: Setup y ejecución del proyecto
- `AUDIT_REPORT.md`: Informe de auditoría y recomendaciones de seguridad
- `API_DOCS.md`: Documentación técnica de APIs (en rust_generator/)

### Documentación de UI/UX
- `PROFILE_UI_STRUCTURE.md`: Estructura y flujos de la UI por perfiles
- `frontend/README.md`: Guía específica del frontend y componentes
- `backend/README.md`: Guía específica del backend y servicios

### Referencias por Componente
1. **Frontend**
   - `frontend/src/components/`: Componentes React
   - `frontend/src/contexts/`: Contextos de estado
   - `frontend/src/services/`: Servicios y APIs

2. **Backend**
   - `backend/src/services/`: Servicios principales
   - `backend/src/routes/`: Endpoints API
   - `backend/prisma/`: Esquemas y migraciones

3. **Rust Generator**
   - `rust_generator/src/`: Lógica de generación
   - `rust_generator/API_DOCS.md`: Documentación de APIs

### Guía de Lectura Recomendada
1. Este documento (`CONTEXT_SUMMARY.md`) para estado actual
2. `CODEX.md` para visión general y arquitectura
3. `README.md` para setup inicial
4. Documentación específica según área de trabajo:
   - UI/UX → `PROFILE_UI_STRUCTURE.md`
   - Backend → `backend/README.md`
   - Rust → `rust_generator/API_DOCS.md`
5. `CHANGELOG.md` para contexto histórico

## 🏗️ Arquitectura Actual

### Componentes Principales
1. **Frontend** (Next.js, puerto 3000)
   - App Router
   - Tailwind CSS + Shadcn UI
   - Contextos: Auth, UI

2. **Backend** (Node.js, puerto 3004)
   - API Gateway
   - Prisma + PostgreSQL
   - Redis (caché)
   - Prometheus (métricas)

3. **Servicio Rust** (puerto 3002)
   - Generación de códigos
   - Caché interno (DashMap)

### Flujos Críticos
1. **Autenticación**
   - JWT + API Keys
   - Passport.js
   - Refresh token implementado

2. **Generación de Códigos**
   - Frontend → Backend → Rust Service
   - Caché en Redis
   - Validación GS1

## 🔍 Puntos de Atención

### Problemas Conocidos
1. **Imagen de Perfil**
   - Comportamiento inconsistente con iniciales
   - Investigación en progreso

2. **Caché Redis**
   - Configurado pero no completamente integrado
   - Pendiente optimización

### Mejoras Pendientes
1. **Seguridad**
   - Implementar Sentry/Datadog
   - Configurar alertas Prometheus

2. **Performance**
   - Optimizar índices BD
   - Mejorar caché

## 🚀 Comandos Críticos

```bash
# Iniciar infraestructura
docker-compose up -d

# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Servicio Rust
cd rust_generator && cargo run
```

## 📝 Notas de Desarrollo

### Convenciones
- Commits atómicos y descriptivos
- Documentación en código con JSDoc
- Pruebas unitarias requeridas

### Workflow
1. Crear rama feature/xxx
2. Desarrollar y probar
3. PR con descripción detallada
4. Revisión y merge

## 🔄 Rutinas Críticas de Mantenimiento

### Después de Cada Commit
1. **Backup Automático**
   - Verificar que el backup automático se haya ejecutado
   - Confirmar que los cambios están en el repositorio remoto
   - Validar que las ramas están actualizadas

2. **Documentación**
   - Actualizar `CHANGELOG.md` con los cambios realizados
   - Revisar y actualizar `CONTEXT_SUMMARY.md` si hay cambios relevantes
   - Verificar que los READMEs específicos estén actualizados:
     - `README.md` (raíz)
     - `frontend/README.md`
     - `backend/README.md`
     - `rust_generator/README.md`

### Después de Cada Merge a Main
1. **Documentación Maestra**
   - Actualizar `CODEX.md` si hay cambios arquitectónicos
   - Revisar `AUDIT_REPORT.md` si hay cambios de seguridad
   - Actualizar `PROFILE_UI_STRUCTURE.md` si hay cambios en UI

2. **Verificación de Estado**
   - Confirmar que todos los servicios están funcionando
   - Verificar que las variables de entorno están actualizadas
   - Comprobar que la documentación está sincronizada

### Checklist de Mantenimiento
- [ ] Backup ejecutado y verificado
- [ ] Cambios documentados en `CHANGELOG.md`
- [ ] `CONTEXT_SUMMARY.md` actualizado
- [ ] READMEs específicos revisados
- [ ] Documentación maestra actualizada (si aplica)
- [ ] Estado del proyecto verificado

---

**Instrucción para Nuevo Agente IA:**
1. Leer este documento primero
2. Revisar `CODEX.md` para contexto completo
3. Consultar `README.md` para setup
4. Verificar `CHANGELOG.md` para cambios recientes 