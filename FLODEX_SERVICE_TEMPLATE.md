# [NOMBRE DEL SERVICIO]

## 1. Propósito del Servicio

[Descripción concisa del rol de este servicio en la arquitectura QReable. 2-3 párrafos máximo.]

### Responsabilidades Principales
- [Responsabilidad 1]
- [Responsabilidad 2]
- [Responsabilidad 3]

### Lo que NO hace este servicio
- [Límite 1]
- [Límite 2]

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| Runtime | [ej. Node.js] | [versión] | [propósito] |
| Framework | [ej. Express] | [versión] | [propósito] |
| Base de Datos | [ej. PostgreSQL] | [versión] | [propósito] |
| [Otra] | [tecnología] | [versión] | [propósito] |

### Dependencias Críticas
- **[Dependencia 1]**: [Por qué es crítica]
- **[Dependencia 2]**: [Por qué es crítica]

---

## 3. Cómo Ejecutar y Probar

### Requisitos Previos
```bash
# Versiones requeridas
node --version  # >= X.X.X
npm --version   # >= X.X.X
```

### Instalación
```bash
cd [servicio]
npm install
```

### Configuración
1. Copiar `.env.example` a `.env`
2. Configurar las variables requeridas (ver sección 5)

### Ejecución
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Con PM2 (recomendado)
pm2 start ecosystem.config.js --only [nombre-servicio]
```

### Testing
```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch
```

---

## 4. Contrato de API (Endpoints principales)

### Base URL
- Desarrollo: `http://localhost:[PUERTO]`
- Producción: `[URL_PRODUCCION]`

### Endpoints Públicos

#### [MÉTODO] `/api/[ruta]`
**Propósito**: [Qué hace este endpoint]

**Request**:
```json
{
  "campo1": "tipo",
  "campo2": "tipo"
}
```

**Response** (200 OK):
```json
{
  "resultado": "tipo",
  "mensaje": "tipo"
}
```

**Errores Comunes**:
- `400`: [Cuándo ocurre]
- `401`: [Cuándo ocurre]
- `500`: [Cuándo ocurre]

[Repetir para cada endpoint principal]

### Tipos Compartidos
```typescript
// Tipos que otros servicios necesitan conocer
interface [NombreTipo] {
  campo1: tipo;
  campo2: tipo;
}
```

---

## 5. Variables de Entorno

### Requeridas
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `3000` |
| `DATABASE_URL` | URL de conexión a BD | `postgresql://...` |
| `[VARIABLE]` | [Descripción] | `[ejemplo]` |

### Opcionales
| Variable | Descripción | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Nivel de logs | `info` |
| `[VARIABLE]` | [Descripción] | `[default]` |

---

## 6. Comunicación con Otros Servicios

### Servicios de los que Depende
- **[Servicio]**: [Para qué lo usa] - Puerto `[XXXX]`

### Servicios que Dependen de Este
- **[Servicio]**: [Qué consume] - Endpoints [`/api/...`]

---

## 7. Troubleshooting Común

### Problema: [Descripción del problema]
**Síntoma**: [Lo que ve el usuario/desarrollador]
**Solución**: [Pasos para resolver]

### Problema: [Otro problema común]
**Síntoma**: [Lo que ve el usuario/desarrollador]
**Solución**: [Pasos para resolver]

---

## 8. Mantenimiento y Monitoreo

### Logs
- Ubicación: `logs/[servicio].log`
- Rotación: [Política de rotación]

### Métricas Clave
- [Métrica 1]: [Qué significa]
- [Métrica 2]: [Qué significa]

### Comandos Útiles
```bash
# Ver logs en tiempo real
pm2 logs [servicio]

# Ver estado
pm2 status [servicio]

# Reiniciar
pm2 restart [servicio]
```