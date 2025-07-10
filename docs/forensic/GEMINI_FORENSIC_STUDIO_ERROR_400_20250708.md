# 🔍 ANÁLISIS FORENSE: Error 400 en Studio QR Preview

**🤖 AGENTE:** Gemini  
**📅 FECHA:** 2025-07-08  
**🎯 CASO:** Error 400 campos faltantes is_active, created_by, created_at, updated_at  
**🔧 ESTADO:** Análisis Completado  

## 📋 RESUMEN EJECUTIVO

Error identificado en la cadena de llamadas de `StudioQRPreview` donde el servicio Rust rechaza requests por campo `background` faltante en `ColorOptions`, pero el error mostrado al usuario menciona campos de base de datos (is_active, created_by, etc.) que no deberían estar relacionados con generación de QR.

## 🔗 CADENA DE LLAMADAS IDENTIFICADA

```
StudioGlobalPage -> StudioQRPreview -> /api/v3/qr/enhanced -> Rust Service
```

### 🎯 Punto de Falla Identificado

**Ubicación:** `StudioQRPreview.tsx` líneas 58-65  
**Problema:** Discrepancia entre estructura enviada y esperada por Rust

## 🧩 CAUSA RAÍZ EXACTA

### 1. **Definición en Rust (obligatoria)**
```rust
// /rust_generator/src/engine/types.rs líneas 202-207
pub struct ColorOptions {
    pub foreground: String,  // Campo OBLIGATORIO
    pub background: String,  // Campo OBLIGATORIO
    pub eye_colors: Option<EyeColors>,
}
```

### 2. **Implementación en Frontend**
```typescript
// /frontend/src/components/studio/StudioQRPreview.tsx líneas 58-65
const customization: any = {
  data_pattern: config.data_pattern,
  colors: {
    foreground: config.colors?.foreground || '#000000',
    background: config.colors?.background || '#FFFFFF',
  },
  error_correction: config.error_correction || 'M',
};
```

### 3. **Error Real vs Error Mostrado**

**Error Real (logs backend):**
```
"options.customization.colors: missing field `background` at line 1 column 99"
```

**Error Mostrado (frontend):**
```
campos faltantes: is_active, created_by, created_at, updated_at
```

## 🔍 ANÁLISIS DETALLADO

### 📊 Error de Deserialización en Rust

El servicio Rust está recibiendo un objeto `colors` que no contiene el campo `background` requerido. Esto puede ocurrir cuando:

1. **Configuración incompleta desde Studio Provider**
2. **Interceptor modificando el request**
3. **Transformación incorrecta en middleware backend**

### 🛠️ Puntos de Investigación

1. **¿Qué configuración llega a StudioQRPreview?**
   - Verificar `config` object en línea 54 del log
   
2. **¿Hay middleware interceptando?**
   - Revisar transformaciones en `qr-v3.routes.ts` líneas 631-725

3. **¿Error de confusión de endpoints?**
   - El error menciona campos de DB que sugieren llamada a `/api/studio/configs` en lugar de `/api/v3/qr/enhanced`

## 🚨 INCONSISTENCIAS CRÍTICAS

### 1. **Error Malleading**
El error mostrado al usuario menciona campos de base de datos (`is_active`, `created_by`, etc.) que pertenecen a `StudioConfig`, no a un request de QR. Esto sugiere:

- **Posible llamada incorrecta:** StudioProvider está llamando a endpoint de configuración en lugar de generación QR
- **Error de validación confuso:** El mensaje de error no refleja el problema real

### 2. **Validación Asíncrona**
```typescript
// StudioProvider.tsx línea 162
const response = await api.post<{ config: any }>('/api/studio/configs', config);
```

Esta línea sugiere que el `saveConfig` de StudioProvider puede estar interfiriendo con las llamadas de QR preview.

## 🎯 HIPÓTESIS PRINCIPAL

**El error NO viene de la generación de QR directamente, sino de una llamada paralela o interceptada a `/api/studio/configs` que se está confundiendo con la llamada a `/api/v3/qr/enhanced`.**

### Evidencia:
1. Campos mencionados (`is_active`, `created_by`) son de tabla `studio_configs`
2. StudioProvider hace llamadas a `/api/studio/configs` 
3. El log muestra error de `background` pero usuario ve error de DB

## 🔧 VECTORES DE SOLUCIÓN

### 1. **Inmediato (Debug)**
- Añadir logs específicos en StudioQRPreview antes del fetch
- Verificar que la llamada va realmente a `/api/v3/qr/enhanced`
- Interceptar y logear el body exacto enviado

### 2. **Corrección (Posible Race Condition)**
- Verificar si `useEffect` en StudioQRPreview y `saveConfig` en StudioProvider están causando llamadas simultáneas
- Implementar debouncing en preview updates
- Separar completamente las llamadas de configuración y preview

### 3. **Robustez (Validación)**
- Añadir validación client-side del objeto `config` antes de enviar
- Mejorar mensajes de error para distinguir entre endpoints
- Implementar fallbacks para configuraciones incompletas

## 📝 PLAN DE IMPLEMENTACIÓN

### Fase 1: Diagnóstico (5 min)
```typescript
// En StudioQRPreview.tsx antes de fetch
console.log('🔍 DEBUG - Request URL:', `${backendUrl}/api/v3/qr/enhanced`);
console.log('🔍 DEBUG - Request Body:', JSON.stringify(requestBody, null, 2));
console.log('🔍 DEBUG - Config Object:', config);
```

### Fase 2: Validación (10 min)
```typescript
// Validar config antes de usar
if (!config.colors?.background) {
  console.warn('⚠️ Background color missing, using default');
}
```

### Fase 3: Separación (15 min)
```typescript
// Debounce preview updates
const debouncedGenerateQR = useCallback(
  debounce(generateQR, 500),
  [config, text]
);
```

## 🏁 CONCLUSIÓN

El error 400 es causado por una **discrepancia entre la estructura de datos esperada por el servicio Rust y la enviada por el frontend**, posiblemente agravada por **llamadas simultáneas o interceptadas entre preview y configuración**. La solución requiere:

1. **Debug inmediato** para confirmar la ruta de llamada
2. **Validación robusta** del objeto de configuración
3. **Separación temporal** de llamadas de configuración y preview

**Prioridad:** 🔥 Alta - Afecta funcionalidad core de Studio
**Complejidad:** 🟡 Media - Requiere coordinación frontend-backend-rust
**Riesgo:** 🟢 Bajo - Limitado a Studio, no afecta generación principal

---

*📋 Reporte generado por análisis forense automatizado*  
*🔍 Próximos pasos: Implementar debug logging y validación robusta*