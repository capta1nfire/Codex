# 🔧 **CODEX - Guía de Resolución de Problemas**

**Última Actualización**: 15 de Enero, 2024

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

## 📞 **Contacto y Soporte**

Para errores no cubiertos en esta guía:

1. **Logs**: Siempre incluir logs completos del error
2. **Contexto**: Describir qué estabas haciendo cuando ocurrió
3. **Entorno**: Especificar si es desarrollo, testing o producción
4. **Pasos**: Detallar pasos para reproducir el error

---

**📋 Nota**: Esta guía se actualiza constantemente con nuevos problemas y soluciones identificados. 