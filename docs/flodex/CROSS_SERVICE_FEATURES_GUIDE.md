# 🌉 **Guía FLODEX para Features Cross-Service**

**Versión:** 1.0  
**Última Actualización:** 19 de Junio, 2025  
**Autor:** CODEX Development Team

---

## 📋 **Tabla de Contenidos**

1. [Cuándo Aplica Esta Guía](#1-cuándo-aplica-esta-guía)
2. [Principios Fundamentales](#2-principios-fundamentales)
3. [Proceso Paso a Paso](#3-proceso-paso-a-paso)
4. [Plantillas y Ejemplos](#4-plantillas-y-ejemplos)
5. [Anti-Patrones a Evitar](#5-anti-patrones-a-evitar)
6. [Casos de Estudio](#6-casos-de-estudio)
7. [FAQ](#7-faq)

---

## 1. **Cuándo Aplica Esta Guía**

Esta guía es **OBLIGATORIA** cuando tu feature:

✅ **DEBE usar esta guía si:**
- Requiere cambios en 2 o más servicios
- Introduce nueva comunicación entre servicios
- Modifica el contrato API entre servicios
- Agrega nueva funcionalidad end-to-end
- Cambia el flujo de datos entre servicios

❌ **NO uses esta guía si:**
- Solo modificas un servicio
- Es un bug fix interno de un servicio
- Solo actualizas documentación
- Es refactoring interno sin cambios de API

---

## 2. **Principios Fundamentales**

### **🏛️ Los 4 Pilares de FLODEX Cross-Service**

1. **Independencia**: Cada servicio debe poder desarrollarse, testearse y deployarse independientemente
2. **Contratos Claros**: La comunicación entre servicios es SOLO vía APIs REST bien documentadas
3. **Sin Código Compartido**: NUNCA compartir código fuente entre servicios
4. **Documentación Distribuida**: Cada servicio documenta su parte del feature

### **🚫 Lo que NUNCA debes hacer:**
```javascript
// ❌ MAL: Importar desde otro servicio
import { validateUser } from '../../backend/utils/auth';

// ✅ BIEN: Llamar via API
const response = await fetch('http://localhost:3004/api/v1/auth/validate');
```

---

## 3. **Proceso Paso a Paso**

### **📝 Fase 1: Planificación**

#### **Paso 1.1: Crear Feature Design Document**
```bash
# Crear documento de diseño
touch docs/flodex/features/[FEATURE_NAME]_design.md
```

#### **Paso 1.2: Mapear Cambios por Servicio**
```markdown
## Feature: User Notifications

### Frontend Changes:
- Add notification bell icon
- Create notification dropdown component
- WebSocket connection for real-time updates

### Backend Changes:
- POST /api/v1/notifications/create
- GET /api/v1/notifications/user/:id
- WebSocket endpoint for push

### Rust Generator Changes:
- (No changes needed)
```

### **📊 Fase 2: Definir Contratos**

#### **Paso 2.1: Documentar APIs**
```markdown
## API Contract: Notifications

### Create Notification
**Endpoint:** POST /api/v1/notifications
**Request:**
```json
{
  "userId": "string",
  "type": "info|warning|error",
  "title": "string",
  "message": "string"
}
```
**Response:** 201 Created
```json
{
  "id": "string",
  "createdAt": "ISO8601",
  "status": "sent"
}
```
```

#### **Paso 2.2: Definir Modelos de Datos**
Cada servicio define sus propios modelos, NO compartir tipos:

```typescript
// backend/src/types/notification.ts
export interface BackendNotification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: Date;
  readAt?: Date;
}

// frontend/src/types/notification.ts
export interface FrontendNotification {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
```

### **🔨 Fase 3: Implementación**

#### **Paso 3.1: Crear Branch por Servicio (Opcional)**
```bash
# Opción A: Un branch para todo el feature
git checkout -b feature/notifications

# Opción B: Branch por servicio (para equipos grandes)
git checkout -b feature/notifications-backend
git checkout -b feature/notifications-frontend
```

#### **Paso 3.2: Implementar en Orden**
1. **Backend First**: APIs deben existir antes que el frontend las use
2. **Tests de Integración**: Mock del otro servicio
3. **Frontend**: Consumir las APIs
4. **End-to-End Testing**: Validar flujo completo

#### **Paso 3.3: Documentar en Cada README**
```markdown
# backend/README.md
## 6. Comunicación con Otros Servicios

### Notifications Feature (v1.2.0)
- **Expone**: POST/GET /api/v1/notifications
- **WebSocket**: ws://localhost:3004/notifications
- **Consumido por**: Frontend
- **Documentación**: [Ver diseño completo](../docs/flodex/features/notifications_design.md)
```

### **🧪 Fase 4: Testing**

#### **Paso 4.1: Tests Unitarios por Servicio**
```javascript
// backend/src/__tests__/notifications.test.ts
describe('Notifications API', () => {
  it('should create notification', async () => {
    const response = await request(app)
      .post('/api/v1/notifications')
      .send({ userId: '123', type: 'info', title: 'Test' });
    
    expect(response.status).toBe(201);
  });
});
```

#### **Paso 4.2: Tests de Integración con Mocks**
```javascript
// frontend/src/__tests__/NotificationBell.test.tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('http://localhost:3004/api/v1/notifications', (req, res, ctx) => {
    return res(ctx.json({ notifications: mockNotifications }));
  })
);
```

### **📋 Fase 5: Documentación Final**

#### **Paso 5.1: Actualizar Feature Document**
```markdown
# docs/flodex/features/notifications_implementation.md

## Implementation Status
- ✅ Backend API implemented
- ✅ Frontend components created
- ✅ WebSocket connection established
- ✅ E2E tests passing

## Deployment Notes
- Backend must be deployed first
- Frontend requires env var: NEXT_PUBLIC_WS_URL
```

---

## 4. **Plantillas y Ejemplos**

### **📄 Template: Feature Design Document**
```markdown
# Feature: [FEATURE_NAME]

## Overview
[1-2 párrafos describiendo el feature]

## User Stories
- As a [user type], I want to [action] so that [benefit]

## Technical Design

### Service Impact Matrix
| Service | Changes Required | Priority | Estimated Effort |
|---------|-----------------|----------|------------------|
| Frontend | UI components, API calls | High | 3 days |
| Backend | New endpoints, DB schema | High | 2 days |
| Rust | None | - | - |

### API Contracts
[Documentar todos los endpoints nuevos/modificados]

### Data Flow
[Diagrama o descripción del flujo de datos]

### Security Considerations
[Autenticación, autorización, validación]

## Implementation Plan
1. [ ] Backend: Create API endpoints
2. [ ] Backend: Add tests
3. [ ] Frontend: Create components
4. [ ] Frontend: Integrate with API
5. [ ] E2E: Full flow testing

## Rollback Plan
[Cómo revertir si algo sale mal]
```

### **🔧 Template: Integration Test**
```javascript
// e2e-tests/features/[feature_name].test.js
describe('[Feature Name] E2E', () => {
  beforeAll(async () => {
    // Start all services
    await startBackend();
    await startFrontend();
    await startRustGenerator();
  });

  test('complete flow works', async () => {
    // 1. Create data via backend
    const item = await createTestItem();
    
    // 2. Verify frontend displays it
    await page.goto('http://localhost:3000');
    await expect(page).toHaveText(item.name);
    
    // 3. Generate code if applicable
    if (requiresCodeGeneration) {
      const code = await generateCode(item.id);
      expect(code).toBeTruthy();
    }
  });
});
```

---

## 5. **Anti-Patrones a Evitar**

### **❌ Anti-Patrón 1: Shared Types Package**
```json
// ❌ MAL: Crear un package compartido
{
  "workspaces": ["packages/shared-types", "frontend", "backend"]
}
```

**Por qué es malo**: Crea acoplamiento, dificulta versioning independiente

**✅ Solución**: Duplicar tipos en cada servicio

### **❌ Anti-Patrón 2: Direct Database Access**
```javascript
// ❌ MAL: Frontend accediendo a la DB
import { prisma } from '../../backend/lib/prisma';
```

**✅ Solución**: Siempre usar APIs REST

### **❌ Anti-Patrón 3: Synchronous Coupling**
```javascript
// ❌ MAL: Backend esperando respuesta de Rust
const qrCode = await rustGenerator.generateSync(data);
```

**✅ Solución**: Usar patrones asincrónicos (webhooks, polling)

### **❌ Anti-Patrón 4: Monolithic Deployment**
```yaml
# ❌ MAL: Deploy todo junto
deploy:
  - build-all
  - test-all
  - deploy-all
```

**✅ Solución**: Deploy independiente por servicio

---

## 6. **Casos de Estudio**

### **📚 Caso 1: Sistema de Autenticación**

**Problema**: Implementar login con JWT

**Solución FLODEX**:
1. Backend expone `/api/v1/auth/login`
2. Frontend almacena JWT en httpOnly cookie
3. Cada request incluye el token
4. Backend valida en cada endpoint

**Documentación**:
- `backend/README.md`: Sección de auth endpoints
- `frontend/README.md`: Sección de auth flow
- `docs/flodex/features/authentication.md`: Diseño completo

### **📚 Caso 2: Generación de Códigos con Metadata**

**Problema**: Frontend necesita generar QR con datos del usuario

**Solución FLODEX**:
1. Frontend → Backend: GET /api/v1/user/profile
2. Frontend → Backend: POST /api/v1/generate con userData
3. Backend → Rust: POST /generate con datos procesados
4. Rust → Backend: SVG generado
5. Backend → Frontend: Response con SVG + metadata

**Lecciones Aprendidas**:
- No pasar datos sensibles directamente a Rust
- Backend actúa como gateway y validador
- Cada servicio mantiene su responsabilidad

---

## 7. **FAQ**

### **Q: ¿Puedo usar gRPC en lugar de REST?**
A: Sí, pero debe documentarse claramente en los contratos. REST es preferido por simplicidad.

### **Q: ¿Cómo manejo transacciones distribuidas?**
A: Usa patrones como Saga o Event Sourcing. Documenta el flujo en `/docs/flodex/patterns/`.

### **Q: ¿Puedo compartir una librería de utilidades?**
A: NO para lógica de negocio. SÍ para utilidades puras sin estado (formatters, validators básicos) mediante NPM privado.

### **Q: ¿Dónde documento cambios de base de datos?**
A: En el README del servicio que posee la base de datos, sección "Database Schema".

### **Q: ¿Cómo versiono APIs cuando hay breaking changes?**
A: Usa versioning en la URL (/api/v1/, /api/v2/). Mantén ambas versiones durante período de transición.

### **Q: ¿Qué hago si necesito datos de múltiples servicios?**
A: 
1. **Opción A**: Frontend hace múltiples llamadas (simple)
2. **Opción B**: Backend agrega los datos (Backend for Frontend pattern)
3. **Opción C**: GraphQL gateway (complejo, solo si es necesario)

---

## 📞 **Soporte**

¿Dudas sobre un caso específico? 

1. Revisa casos de estudio existentes en `/docs/flodex/features/`
2. Consulta con el equipo antes de romper principios FLODEX
3. Documenta nuevos patrones descubiertos

---

*Recuerda: La complejidad de coordinar servicios se compensa con la simplicidad de mantener cada uno.*