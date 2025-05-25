# 🧪 Guía de Validación - Botones de Control de Servicios

## ✅ Pre-requisitos para las pruebas

1. **Backend corriendo** en puerto 3004
2. **Frontend corriendo** en puerto 3000  
3. **Docker disponible** para el servicio de base de datos
4. **Rust service** disponible (opcional para algunas pruebas)

## 🎯 Método de Validación Paso a Paso

### Paso 1: Activar las Opciones Avanzadas
1. Abrir el dashboard en `http://localhost:3000/dashboard`
2. Hacer clic en el **menú hamburguesa** (🍔) en la esquina superior derecha
3. Activar el toggle **"Opciones Avanzadas"**
4. ✅ **Verificar**: El botón de configuración (⚙️) aparece en la sección "Servicios del Sistema"

### Paso 2: Activar los Botones de Control
1. Hacer clic en el **botón de configuración** (⚙️) en "Servicios del Sistema"
2. ✅ **Verificar**: Aparecen 3 botones en cada servicio:
   - ▶️ **Start** (Play)
   - ⏸️ **Stop** (Pause) 
   - ⏹️ **Restart** (Square)

## 🧪 Pruebas por Servicio

### 🗄️ Base de Datos (Database)
```bash
# Preparación: Detener contenedor si existe
docker stop codex_postgres
```

**Pruebas Frontend:**
1. **Start Database** → Debería crear/iniciar contenedor Docker
2. **Stop Database** → Debería detener contenedor Docker  
3. **Restart Database** → Debería detener e iniciar contenedor

**Validación Backend:**
```bash
# Verificar contenedor corriendo
docker ps | grep codex_postgres

# Verificar logs
docker logs codex_postgres

# Health check manual
curl http://localhost:3004/health/db
```

### 🦀 Rust Generator Service  
```bash
# Preparación: Matar procesos existentes
pkill -f rust_generator
```

**Pruebas Frontend:**
1. **Start Rust** → Debería compilar e iniciar en puerto 3002
2. **Stop Rust** → Debería matar procesos y liberar puerto
3. **Restart Rust** → Debería detener e iniciar nuevamente

**Validación Backend:**
```bash
# Verificar proceso corriendo
pgrep -f rust_generator

# Verificar puerto ocupado
lsof -i :3002

# Health check manual
curl http://localhost:3002/health
```

### 🖥️ Backend Service
```bash
# Nota: Backend restart puede reiniciar el proceso actual
```

**Pruebas Frontend:**
1. **Start Backend** → Usa restart (el backend ya está corriendo)
2. **Stop Backend** → Mensaje informativo (no detiene el proceso actual)
3. **Restart Backend** → Reinicia el proceso backend (tsx/nodemon)

**Validación:**
```bash
# Verificar que el backend sigue respondiendo después del restart
curl http://localhost:3004/health

# Ver logs del backend
# (en la terminal donde corre npm run dev:backend)
```

## 🎨 Estados Visuales a Verificar

### Durante la Ejecución:
- 🔵 **Azul + Spinner**: Acción en progreso (loading)
- 🟢 **Verde + ✓**: Acción exitosa (success)  
- 🔴 **Rojo + ✗**: Acción fallida (error)

### Después de 3-5 segundos:
- Los botones vuelven al estado normal (gris)
- El health check se actualiza automáticamente

## 🐛 Console Logs a Verificar

### Frontend (F12 → Console):
```javascript
// Al hacer clic en un botón
🔧 starting Database...
✅ Database start successful: Database service started successfully

// Si hay errores  
❌ Database start failed: Failed to start database: ...
```

### Backend (Terminal):
```bash
# Acciones de servicios
🔧 Starting service: database
✅ Database service started successfully

# Health checks automáticos
🔍 Getting database status...
🏥 Forcing health check of all services...
```

## 🎯 Endpoints de Prueba Manual

```bash
# Controlar servicios directamente via API
curl -X POST http://localhost:3004/api/services/database/start
curl -X POST http://localhost:3004/api/services/database/stop  
curl -X POST http://localhost:3004/api/services/database/restart

curl -X POST http://localhost:3004/api/services/rust/start
curl -X POST http://localhost:3004/api/services/rust/stop
curl -X POST http://localhost:3004/api/services/rust/restart

curl -X POST http://localhost:3004/api/services/backend/restart

# Health checks
curl http://localhost:3004/api/services/status
curl http://localhost:3004/api/services/database/status
curl http://localhost:3004/api/services/rust/status

# Force health check  
curl -X POST http://localhost:3004/api/services/health-check
```

## ✅ Lista de Verificación Final

- [ ] Menú hamburguesa funciona y activa opciones avanzadas
- [ ] Botón de configuración aparece solo en modo avanzado
- [ ] Botones start/stop/restart aparecen en modo configuración
- [ ] Estados visuales funcionan (azul→verde/rojo→gris)
- [ ] Database: start/stop/restart controlan Docker correctamente
- [ ] Rust: start/stop/restart controlan proceso en puerto 3002
- [ ] Backend: restart funciona sin romper el sistema
- [ ] Health checks se actualizan automáticamente
- [ ] Console logs muestran información útil
- [ ] API endpoints responden correctamente

## 🚨 Problemas Comunes

1. **Botones no aparecen**: Verificar que opciones avanzadas estén activadas
2. **Docker no responde**: Verificar que Docker Desktop esté corriendo
3. **Rust no compila**: Verificar que Rust esté instalado (`cargo --version`)
4. **Backend no reinicia**: Normal en algunos entornos, verificar logs
5. **Permisos de Docker**: Puede requerir `sudo` en algunos sistemas

## 📝 Notas de Desarrollo

- Los botones usan los iconos: Play (▶️), Pause (⏸️), Square (⏹️)
- Los estados son gestionados por `serviceActions` con keys tipo `"Database-start"`
- El backend tiene endpoints robustos con manejo de errores y timeouts
- Los health checks son automáticos cada 10 segundos
- El sistema es tolerante a fallos y proporciona feedback detallado 