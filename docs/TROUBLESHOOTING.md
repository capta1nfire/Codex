# 🔧 **CODEX - Guía de Resolución de Problemas**

**Última Actualización**: 14 de Junio, 2025

---

## 🎯 **Errores Comunes y Soluciones**

### **🔑 Problema: Error 401 al Generar API Key**

#### **Síntomas**
```
Error generando API Key: Error desconocido
[401] UNAUTHORIZED: No autorizado
```

#### **Causa Raíz**
Inconsistencia en las claves de localStorage entre el contexto de autenticación y el cliente API:

- **AuthContext guarda token como**: `localStorage.setItem('authToken', token)`
- **ApiClient buscaba token como**: `localStorage.getItem('token')`

#### **Solución Implementada** ✅
Actualizado el método `getAuthToken()` en `frontend/src/lib/api.ts`:

```typescript
// ANTES (incorrecto)
private getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token'); // ❌ Clave incorrecta
}

// DESPUÉS (correcto)
private getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken'); // ✅ Clave correcta
}
```

#### **Verificación**
1. El usuario debe poder generar API Keys sin errores de autorización
2. La llamada a `/api/auth/api-key` debe incluir el header `Authorization: Bearer <token>`
3. No más errores 401 en la generación de API Keys

### **📝 Problema: Campos del Perfil Aparecen Vacíos**

#### **Síntomas**
```
- Los campos firstName, lastName, username aparecen vacíos en el formulario de perfil
- Al hacer clic en "Editar", los campos no se precargan con los datos del usuario
- Los datos existen correctamente en la base de datos
```

#### **Causa Raíz**
Problema de timing en la inicialización del formulario con `react-hook-form`:

1. **Inicialización prematura**: Los `defaultValues` se establecían cuando `user` era `null/undefined`
2. **Reset insuficiente**: El `useEffect` que hacía `reset()` no verificaba que los datos estuvieran completos
3. **Mapeo de campos**: Inconsistencia entre campos del backend (`username` opcional) y frontend

#### **Solución Implementada** ✅

**1. Problema Principal: React Refs**: El componente `Input` no usaba `forwardRef`, impidiendo que `react-hook-form` accediera a las referencias de los campos.

**Solución en `frontend/src/components/ui/input.tsx`**:
```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // ... otras props
        ref={ref}  // ✅ Ref agregado
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

**2. Problema Secundario: Timing de Inicialización**: Los `defaultValues` se establecían cuando `user` era `null/undefined`.

**Solución en `frontend/src/components/profile/ProfileForm.tsx`**:
```typescript
// ✅ Estrategia dual: reset + setValue individual con delay
React.useEffect(() => {
  if (user && user.firstName) {
    const resetData = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
    };
    
    // setTimeout para asegurar que el formulario esté listo
    setTimeout(() => {
      // Estrategia principal: reset completo
      reset(resetData);
      
      // Estrategia backup: setValue individual
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('username', user.username || '');
      setValue('email', user.email || '');
      setValue('password', '');
    }, 100);
  }
}, [user, reset, setValue]);
```

**3. Actualización de AuthContext**: Mapeo consistente de campos entre backend y frontend.

```typescript
// ✅ Interfaz User actualizada
interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  username?: string; // Opcional para coincidir con backend
  role: string;
  profilePictureUrl?: string;
  profilePictureType?: string;
  // ... otros campos
}
```

#### **Verificación**
```bash
# Verificar datos en BD
cd backend && node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const users = await prisma.user.findMany();
console.log(users.map(u => ({email: u.email, firstName: u.firstName, lastName: u.lastName})));
await prisma.\$disconnect();
"
```

#### **Prevención**
- Siempre verificar que los datos del usuario estén disponibles antes de inicializar formularios
- Usar logging temporal para debuggear problemas de mapeo de datos
- Mantener consistencia entre tipos de frontend y backend

---

## 🚨 **Errores de Autenticación**

### **Token Expirado**
**Síntoma**: `Token inválido o expirado`  
**Solución**: 
1. Hacer logout y login nuevamente
2. Verificar configuración de `JWT_EXPIRES_IN` en backend

### **Usuario No Encontrado**
**Síntoma**: `Usuario no encontrado`  
**Solución**:
1. Verificar que el usuario existe en la base de datos
2. Comprobar que `isActive = true`
3. Revisar logs del backend para más detalles

---

## 🔧 **Errores de API**

### **Error de Conexión**
**Síntoma**: `Error de conexión` o `Failed to fetch`  
**Solución**:
1. Verificar que el backend esté ejecutándose en el puerto correcto
2. Comprobar variables de entorno `NEXT_PUBLIC_BACKEND_URL`
3. Revisar CORS si hay problemas de dominio cruzado

### **Rate Limiting**
**Síntoma**: `Límite de generación de códigos alcanzado`  
**Solución**:
1. Esperar el tiempo especificado (generalmente 1 hora)
2. Usar autenticación con API Key para límites más altos
3. Considerar actualizar el plan si es necesario

---

## 🗃️ **Errores de Base de Datos**

### **Conexión a PostgreSQL**
**Síntoma**: `Database connection failed`  
**Solución**:
1. Verificar que PostgreSQL esté ejecutándose
2. Comprobar `DATABASE_URL` en variables de entorno
3. Ejecutar migraciones: `npx prisma migrate deploy`

### **Conexión a Redis**
**Síntoma**: `Redis connection failed`  
**Solución**:
1. Verificar que Redis esté ejecutándose
2. Comprobar `REDIS_URL` en variables de entorno
3. Reiniciar Redis si es necesario

---

## 🎭 **Errores de Testing E2E**

### **Playwright Browser No Instalado**
**Síntoma**: `Browser not found`  
**Solución**: `npx playwright install --with-deps`

### **Tests Timeouts**
**Síntoma**: Tests fallan por timeout  
**Solución**:
1. Aumentar timeout en `playwright.config.ts`
2. Verificar que servicios estén corriendo
3. Usar `waitForLoadState('networkidle')`

### **Elementos No Encontrados**
**Síntoma**: `Locator not found`  
**Solución**:
1. Verificar que `data-testid` existan en componentes
2. Usar selectores más específicos
3. Añadir `waitForElement()` antes de interacciones

---

## 🚀 **Errores de Deployment**

### **Build Falló**
**Síntoma**: `Build failed`  
**Solución**:
1. Verificar que todas las dependencias estén instaladas
2. Comprobar errores de TypeScript
3. Revisar configuración de Next.js

### **Variables de Entorno**
**Síntoma**: Funcionalidades no funcionan en producción  
**Solución**:
1. Verificar que todas las variables de entorno estén configuradas
2. Comprobar que variables públicas tengan prefijo `NEXT_PUBLIC_`
3. Reiniciar servicios después de cambios

---

## ⚙️ **Errores de CI/CD**

### **🔧 Error: Context Access Invalid para NEXT_PUBLIC_BACKEND_URL**

#### **Síntomas**
```
Context access might be invalid: NEXT_PUBLIC_BACKEND_URL
Error en línea 194: ${{ secrets.NEXT_PUBLIC_BACKEND_URL }}
```

#### **Causa Raíz**
Las variables que empiezan con `NEXT_PUBLIC_` son **variables públicas** por naturaleza en Next.js y no deberían tratarse como secrets en GitHub Actions. Estas variables se incluyen en el bundle del frontend y son visibles para el cliente.

#### **Solución Implementada** ✅

**1. Problema Principal**: Uso incorrecto de `secrets.NEXT_PUBLIC_BACKEND_URL`

**Antes (incorrecto)**:
```yaml
- name: 🏗️ Build Frontend
  working-directory: ./frontend
  env:
    NEXT_PUBLIC_BACKEND_URL: ${{ secrets.NEXT_PUBLIC_BACKEND_URL }}  # ❌ Incorrecto
  run: npm run build
```

**Después (correcto)**:
```yaml
env:
  # Variables globales para CI/CD
  NODE_VERSION: '18'
  BACKEND_PORT: 3004
  FRONTEND_PORT: 3000
  CI_BACKEND_URL: http://localhost:3004

# ...

- name: 🏗️ Build Frontend
  working-directory: ./frontend
  env:
    NEXT_PUBLIC_BACKEND_URL: ${{ env.CI_BACKEND_URL }}  # ✅ Correcto
  run: npm run build
```

**2. Mejoras Adicionales**: Centralización de configuración en `.github/workflows/ci.yml`

```yaml
# ✅ Variables globales centralizadas
env:
  NODE_VERSION: '18'
  BACKEND_PORT: 3004
  FRONTEND_PORT: 3000
  CI_BACKEND_URL: http://localhost:3004

# ✅ Uso consistente en todos los jobs
- name: 🟢 Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}  # Usa variable global
    cache: 'npm'
```

#### **Archivos Modificados**
- `.github/workflows/ci.yml`: Agregadas variables de entorno globales y corregida referencia incorrecta a secrets

#### **Verificación**
1. El pipeline de CI/CD debe ejecutarse sin warnings de "context access invalid"
2. El build del frontend debe completarse exitosamente
3. Las variables de entorno deben ser consistentes en todos los jobs

#### **Prevención**
- **Nunca usar `secrets.*` para variables `NEXT_PUBLIC_*`** - estas son públicas
- **Centralizar configuración** en variables de entorno globales del workflow
- **Documentar URLs** específicas para diferentes entornos (desarrollo, testing, producción)

#### **Buenas Prácticas para Variables CI/CD**
```yaml
# ✅ Para variables públicas (accesibles en el cliente)
env:
  NEXT_PUBLIC_API_URL: http://localhost:3004
  
# ✅ Para secrets reales (tokens, passwords)
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

---

## 🎯 **Production Readiness Checker**

### **🚀 Uso del Production Readiness Dashboard**

#### **Propósito**
Valida automáticamente si el sistema CODEX está listo para lanzamiento a producción mediante una serie de checks críticos.

#### **Checks Implementados**
1. **API Gateway Health** - Backend responde en < 200ms
2. **Rust Microservice** - Servicio de generación responde en < 100ms
3. **Database Connection** - PostgreSQL responde en < 50ms (verificado vía health endpoint)
4. **Cache Performance** - Hit rate > 20% (desarrollo), > 50% (producción)
5. **Load Capacity** - Sistema maneja 10+ requests simultáneas
6. **Error Rate** - Tasa de errores < 5% para requests válidos

#### **Interpretación de Resultados**
- **✅ PASS**: Check aprobado, componente listo para producción
- **⚠️ WARNING**: Funciona pero puede necesitar optimización
- **❌ FAIL**: Issue crítico que debe resolverse antes del lanzamiento
- **🔄 RUNNING**: Check en progreso
- **⏸️ PENDING**: Check no ejecutado aún

#### **Estados Generales**
- **Sistema Listo para Producción**: Todos los checks críticos pasaron
- **No Listo para Producción**: Hay issues críticos sin resolver
- **Estado Desconocido**: No se han ejecutado los checks

#### **Uso Recomendado**
```bash
# Acceder al dashboard
http://localhost:3000/dashboard

# Ejecutar validación completa antes de cada lanzamiento
# Revisar warnings para optimizaciones futuras
# Resolver todos los FAIL antes de salir a producción
```

#### **Troubleshooting Común**

**Error: "La URL del servicio Rust no está configurada"**
```bash
# Verificar variable de entorno
echo $NEXT_PUBLIC_RUST_SERVICE_URL

# Debería ser: http://localhost:3002
```

**Error: "Connection timeout"**
```bash
# Verificar que todos los servicios estén ejecutándose
# Backend: npm run dev (puerto 3004)
# Rust: cargo run (puerto 3002)
# Frontend: npm run dev (puerto 3000)
```

**Cache Hit Rate Bajo**
```bash
# Generar algunos códigos para poblar cache
curl -X POST http://localhost:3002/generate \
  -H "Content-Type: application/json" \
  -d '{"barcode_type": "qr", "data": "test"}'

# Ejecutar el mismo request varias veces para aumentar hit rate
```

#### **🔧 Ajustes de Thresholds v2.0**

**Cambios implementados para mayor realismo en desarrollo:**

**Database Connection**
- **Antes**: Test directo a endpoint auth (fallaba por 401)
- **Después**: Verifica vía `/health` endpoint que ya testea DB internamente
- **Resultado**: Detección correcta de estado de BD

**Cache Performance**  
- **Antes**: Threshold agresivo > 70%
- **Después**: Realista > 20% (desarrollo), > 50% (producción)
- **Justificación**: Sistemas nuevos típicamente tienen cache hit rate bajo inicialmente

**Error Rate**
- **Antes**: Test con requests inválidos esperando errores (confuso)
- **Después**: Solo requests válidos, threshold < 5%
- **Justificación**: Error rate debe medir fallas del sistema, no validación de inputs

**Cache Hit Rate (Ajuste Final)**
- **Antes**: 0% cache = FAIL (demasiado estricto)
- **Después**: 0% cache = WARNING (realista para sistemas nuevos)
- **Justificación**: Sistemas recién iniciados naturalmente tienen cache vacío

---

## 🔍 **Debugging Tips**

### **Logs del Backend**
```bash
# Logs en tiempo real
npm run dev

# Logs estructurados en producción
docker logs codex-backend -f
```

### **Debugging Frontend**
```bash
# Modo desarrollo con source maps
npm run dev

# Inspeccionar estado de autenticación
localStorage.getItem('authToken')

# Verificar llamadas API en Network tab
```

### **Testing E2E Debug**
```bash
# Ejecutar con interfaz gráfica
npm run test:e2e:ui

# Modo debug paso a paso
npm run test:e2e:debug

# Ver traces de errores
npx playwright show-trace test-results/trace.zip
```

---

## 🗄️ **Problema: Múltiples PostgreSQL (Docker + Local)**

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
```

## QR Code Gradients Not Working

**Issue**: QR codes generated with gradient options only show solid color (color1), gradients are not applied.

**Root Cause**: 
- Frontend and backend correctly pass gradient options
- Rust service receives gradient data in the request
- However, the legacy `/generate` endpoint doesn't process gradient options
- The v2 endpoint that supports gradients is commented out in Rust service (line 643 in main.rs)

**Current Status** (June 14, 2025):
- Frontend ✅ sends gradient options correctly
- Backend ✅ transforms and forwards gradient options  
- Rust ❌ receives but ignores gradient options in legacy endpoint

**Solution**: 
1. Enable the v2 endpoint in Rust service by uncommenting line 643
2. Update backend to use `/api/qr/generate` instead of `/generate`
3. Or update the legacy handler to process gradient options

# 4. Verificar conectividad
docker exec codex_postgres psql -U codex_user -d codex_db -c "SELECT 1;"

# 5. Ejecutar migraciones si es necesario
cd backend && npx prisma migrate deploy
```

**PREVENCIÓN**: Usar `./dev.sh` que ahora valida automáticamente el entorno

---

## 🛡️ **Sistema de Observabilidad Robusto**

### **Problema Resuelto**
Dashboard se caía completamente cuando fallaban servicios, dejando al usuario sin información crítica.

### **Solución Implementada**

#### 1. **Health Checks Robustos** (`/health`, `/health/db`, `/health/quick`)
- NUNCA fallan completamente - siempre responden con información útil
- Detectan problemas específicos (DB, Redis, Rust service)
- Timeouts y graceful degradation
- Información detallada de errores

#### 2. **Sistema de Alertas Proactivo** (`useSystemAlerts`)
- Monitoreo cada 15 segundos
- Notificaciones del navegador para errores críticos
- Alertas persistentes vs. temporales
- Detección de cambios de estado del sistema

#### 3. **Dashboard que NUNCA se cae** (`SystemStatus.tsx`)
- Graceful degradation cuando servicios fallan
- Siempre muestra información útil
- Estados visuales claros (operativo/degradado/caído)
- Información de errores específicos

#### 4. **Alertas Siempre Visibles** (`SystemAlerts.tsx`)
- Indicador de estado en tiempo real (esquina superior derecha)
- Alertas categorizadas (error/warning/info)
- Auto-dismiss para alertas no críticas
- Contador de alertas críticas

### **Archivos Clave**
```
frontend/src/components/SystemStatus.tsx     # Dashboard robusto
frontend/src/components/SystemAlerts.tsx     # Alertas siempre visibles
frontend/src/hooks/useSystemAlerts.ts        # Lógica de alertas
backend/src/routes/health.ts                 # Health checks robustos
frontend/src/app/layout.tsx                  # Integración global
```

---

## 🔧 **Validación Automática del Entorno**

El script `./dev.sh` ahora incluye validación automática que detecta:
- Conflictos de múltiples PostgreSQL
- Problemas de conectividad de BD
- Archivos de configuración faltantes
- Servicios Docker requeridos

**Uso**:
```bash
# Validación manual del entorno
./scripts/validate-environment.sh

# Inicio automático con validación
./dev.sh
```

---

## 📞 **Contacto y Soporte**

Para errores no cubiertos en esta guía:

1. **Logs**: Siempre incluir logs completos del error
2. **Contexto**: Describir qué estabas haciendo cuando ocurrió
3. **Entorno**: Especificar si es desarrollo, testing o producción
4. **Pasos**: Detallar pasos para reproducir el error

---

**📋 Nota**: Esta guía se actualiza constantemente con nuevos problemas y soluciones identificados. 