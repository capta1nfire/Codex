# 🗄️ Documentación de Base de Datos - Proyecto Codex

## 📋 Resumen Ejecutivo

Esta documentación detalla la configuración actual de la base de datos PostgreSQL del proyecto Codex, incluyendo el historial de problemas encontrados y su resolución definitiva.

**Estado Actual**: ✅ **RESUELTO Y ESTABLE**
- **Base de Datos**: PostgreSQL 15 (Docker)
- **Puerto**: 5432 
- **Volumen**: `codexproject_postgres_data`
- **Usuarios Migrados**: 4 usuarios activos
- **Estructura**: Completamente actualizada con roles jerárquicos

---

## 🚨 Historia del Problema (Para No Repetir)

### El Caos Inicial
Durante el desarrollo inicial se crearon **múltiples volúmenes de Docker** sin control:
- `codex_postgres_data` (volumen original, estructura antigua)
- `codexproject_postgres_data` (volumen nuevo, estructura moderna)

### Síntomas Confusos
- ✅ Los usuarios podían hacer login
- ❌ La base de datos aparecía vacía en consultas
- ❌ Prisma reportaba 0 usuarios
- ❌ Migraciones aplicadas pero sin datos

### Causa Raíz
**Múltiples instancias de PostgreSQL** corriendo simultáneamente:
- Docker PostgreSQL (puerto 5432) - volumen nuevo, vacío
- Homebrew PostgreSQL (puerto 5432) - conflicto de puertos
- **Datos "perdidos"** en volumen Docker antiguo

---

## 🔧 Resolución Implementada

### 1. Diagnóstico Sistemático
```bash
# Verificar contenedores Docker
docker ps | grep postgres

# Verificar volúmenes Docker
docker volume ls | grep postgres

# Verificar servicios PostgreSQL en sistema
brew services list | grep postgres
lsof -i :5432
```

### 2. Migración de Datos
- **Backup**: Exportación de usuarios del volumen antiguo
- **Mapping de Roles**: Conversión de estructura antigua a nueva
- **Importación**: Inserción en volumen actual con nueva estructura

### 3. Limpieza Final
- ❌ Eliminación del volumen `codex_postgres_data`
- ❌ Detención de PostgreSQL de Homebrew
- ✅ Solo Docker PostgreSQL activo

---

## 🏗️ Estructura Actual de la Base de Datos

### Esquema de Roles Jerárquicos
```typescript
enum UserRole {
  USER      // 👤 Funciones básicas de generación
  PREMIUM   // 💎 Funciones avanzadas de generación  
  ADVANCED  // ⭐ Funciones expertas de generación
  WEBADMIN  // 🔧 Gestión técnica del sitio
  SUPERADMIN // 👑 Control total + delegar admins
}
```

### Tabla de Usuarios
```sql
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  firstName   String
  lastName    String
  role        UserRole @default(USER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Usuarios Actuales (Post-Migración)
| Email | Nombre | Rol | Propósito |
|-------|--------|-----|-----------|
| `capta1nfire@me.com` | Debbie Garcia | **SUPERADMIN** | Control total del sistema |
| `admin@codex.com` | Administrator | **WEBADMIN** | Gestión técnica del sitio |
| `premium@codex.com` | Premium User | **PREMIUM** | Usuario premium de prueba |
| `user@codex.com` | Test User | **USER** | Usuario básico de prueba |

---

## 🐳 Configuración Docker

### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:15
    container_name: codex_postgres
    environment:
      POSTGRES_USER: codex_user
      POSTGRES_PASSWORD: codex_password
      POSTGRES_DB: codex_db
    ports:
      - "5432:5432"
    volumes:
      - codexproject_postgres_data:/var/lib/postgresql/data

volumes:
  codexproject_postgres_data:
    external: false
```

### Variables de Entorno
```bash
# .env (backend)
DATABASE_URL="postgresql://codex_user:codex_password@localhost:5432/codex_db"
```

---

## 📊 Sistema de Permisos

### Jerarquía de Acceso
```
SUPERADMIN ──┐
             ├─► Puede acceder a TODO
WEBADMIN ────┤
             ├─► Gestión técnica
ADVANCED ────┤  
             ├─► Funciones expertas
PREMIUM ─────┤
             ├─► Funciones avanzadas  
USER ────────┘
             └─► Funciones básicas
```

### Matriz de Permisos
| Característica | USER | PREMIUM | ADVANCED | WEBADMIN | SUPERADMIN |
|----------------|------|---------|----------|----------|------------|
| Generar QR básico | ✅ | ✅ | ✅ | ✅ | ✅ |
| Funciones avanzadas | ❌ | ✅ | ✅ | ✅ | ✅ |
| Funciones expertas | ❌ | ❌ | ✅ | ✅ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ❌ | ✅ | ✅ |
| Configuración sistema | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delegar admins | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 Comandos de Mantenimiento

### Verificar Estado
```bash
# Estado de contenedores
docker-compose ps

# Logs de PostgreSQL
docker-compose logs postgres

# Conexión directa a base de datos
docker exec -it codex_postgres psql -U codex_user -d codex_db
```

### Backup de Seguridad
```bash
# Crear backup
docker exec codex_postgres pg_dump -U codex_user codex_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i codex_postgres psql -U codex_user codex_db < backup_20250525.sql
```

### Migraciones Prisma
```bash
# Generar migración
cd backend && npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
cd backend && npx prisma migrate deploy

# Regenerar cliente
cd backend && npx prisma generate
```

---

## 🚨 Solución de Problemas

### "Base de datos vacía" pero usuarios pueden hacer login
```bash
# 1. Verificar volúmenes Docker
docker volume ls | grep postgres

# 2. Verificar múltiples PostgreSQL
lsof -i :5432

# 3. Verificar logs de autenticación
docker-compose logs backend | grep "auth"
```

### Conflictos de puerto 5432
```bash
# Detener PostgreSQL de Homebrew
brew services stop postgresql

# Verificar que solo Docker esté activo
lsof -i :5432
```

### Prisma Client desactualizado
```bash
cd backend
npx prisma generate
npm run build
```

---

## 📈 Monitoreo y Métricas

### Consultas Útiles
```sql
-- Contar usuarios por rol
SELECT role, COUNT(*) FROM "User" GROUP BY role;

-- Usuarios creados recientemente  
SELECT email, "firstName", "lastName", role, "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- Verificar integridad de datos
SELECT COUNT(*) as total_users FROM "User";
```

### Métricas de Rendimiento
- **Conexiones concurrentes**: Monitorear con `pg_stat_activity`
- **Tamaño de base de datos**: `SELECT pg_size_pretty(pg_database_size('codex_db'));`
- **Índices utilizados**: Verificar planes de ejecución con `EXPLAIN ANALYZE`

---

## 🎯 Mejores Prácticas Implementadas

### ✅ DO's
- **Un solo volumen Docker** (`codexproject_postgres_data`)
- **Un solo PostgreSQL activo** (Docker únicamente)
- **Migraciones versionadas** con Prisma
- **Backup regular** de datos críticos
- **Roles jerárquicos bien definidos**

### ❌ DON'Ts
- **NO crear múltiples volúmenes** sin documentar
- **NO correr múltiples PostgreSQL** en mismo puerto
- **NO hacer cambios directos** en base de datos sin migraciones
- **NO eliminar volúmenes** sin backup previo

---

## 📞 Contacto y Soporte

Para problemas relacionados con la base de datos:
1. **Revisar esta documentación primero**
2. **Verificar logs**: `docker-compose logs postgres`
3. **Validar entorno**: `node validate_implementation.js`
4. **Consultar historial**: Git commits relacionados con database

---

**Fecha de última actualización**: 25 de Mayo 2025  
**Estado**: ✅ Completamente funcional y estable  
**Responsable**: Sistema migrado y documentado completamente

---

> **Nota Importante**: Esta documentación fue creada después de resolver un problema complejo de múltiples volúmenes Docker que causó mucha confusión. Mantener esta referencia actualizada es crítico para evitar repetir los mismos errores. 