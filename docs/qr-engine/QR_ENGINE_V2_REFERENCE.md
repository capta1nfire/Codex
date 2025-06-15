# QR Engine v2 - Referencia Completa y Estado Real

> **IMPORTANTE**: Este documento es la fuente de verdad sobre el estado REAL del QR Engine v2. Léalo completo antes de trabajar con el motor QR.

## 📊 Estado Actual: 100% ACTIVO EN PRODUCCIÓN (14 Junio 2025)

### ✅ Características COMPLETAMENTE IMPLEMENTADAS en Backend Rust:

#### 1. **Formas de Ojos (17 tipos)**
```rust
eye_shape: "square" | "rounded_square" | "circle" | "dot" | "leaf" | 
           "bars_horizontal" | "bars_vertical" | "star" | "diamond" | 
           "cross" | "hexagon" | "heart" | "shield" | "crystal" | 
           "flower" | "arrow"
```

#### 2. **Patrones de Datos (12 tipos)**
```rust
data_pattern: "square" | "dots" | "rounded" | "vertical" | "horizontal" | 
              "diamond" | "circular" | "star" | "cross" | "random" | 
              "wave" | "mosaic"
```

#### 3. **Gradientes (4 tipos)**
```rust
gradient: {
  type: "linear" | "radial" | "diagonal" | "conical",
  colors: ["#FF0000", "#0000FF"],  // Array de colores hex
  angle: 45,                        // Solo para linear
  center_x: 0.5,                    // Solo para radial (0-1)
  center_y: 0.5,                    // Solo para radial (0-1)
  apply_to_data: true,              // Aplicar a módulos de datos
  apply_to_eyes: false              // Aplicar a ojos del QR
}
```

#### 4. **Marcos Decorativos (5 estilos)**
```rust
frame: {
  style: "simple" | "rounded" | "bubble" | "speech" | "badge",
  color: "#000000",
  width: 2,
  text: "SCAN ME",
  text_position: "bottom" | "top" | "left" | "right"
}
```

#### 5. **Efectos Visuales (5 tipos)**
```rust
effects: [
  {
    type: "shadow",
    offset_x: 2.0,
    offset_y: 2.0,
    blur_radius: 3.0,
    color: "#000000",
    opacity: 0.3
  },
  {
    type: "glow",
    intensity: 3.0,
    color: "#FFFFFF"
  },
  {
    type: "blur",
    radius: 2.0
  },
  {
    type: "noise",
    intensity: 0.2
  },
  {
    type: "vintage",
    sepia_intensity: 0.8,
    vignette_intensity: 0.4
  }
]
```

#### 6. **Integración de Logos**
```rust
logo: {
  data: "data:image/png;base64,...",  // Solo base64, NO URLs
  size_percentage: 20.0,               // 10-30% del QR
  padding: 5,                          // Píxeles de padding
  background: "#FFFFFF",               // Color de fondo opcional
  shape: "square" | "circle" | "rounded_square"
}
```

## 🔄 Estructura de API Actual (14 Junio 2025)

### Endpoints ACTIVOS:
```
POST   /api/v2/qr/generate      → Generación con QR Engine v2
POST   /api/v2/qr/batch         → Generación en lote
GET    /api/v2/qr/preview       → Vista previa en tiempo real
POST   /api/v2/qr/validate      → Validación de datos
GET    /api/v2/qr/analytics     → Analytics (requiere auth)
GET    /api/v2/qr/cache/stats   → Estadísticas de caché
POST   /api/v2/qr/cache/clear   → Limpiar caché

POST   /api/v1/barcode          → Otros códigos de barras (NO QR)
```

### Endpoints DEPRECATED (eliminar Junio 2025):
```
POST   /api/generate            → DEPRECATED, usa v1/barcode o v2/qr
GET    /api/qr/*               → DEPRECATED, usa v2/qr/*
```

## 🔄 Formatos de Request/Response

### Frontend → Backend Express (Puerto 3004)
```typescript
// POST /api/v2/qr/generate
{
  data: "https://example.com",
  options: {
    // Tamaño y márgenes
    size: 400,                    // Píxeles (100-2000)
    margin: 4,                    // Módulos de margen (0-10)
    errorCorrection: "M",         // "L" | "M" | "Q" | "H"
    
    // Personalización visual
    eyeShape: "rounded_square",   // Ver lista arriba
    dataPattern: "dots",          // Ver lista arriba
    foregroundColor: "#000000",   // Color principal
    backgroundColor: "#FFFFFF",   // Color de fondo
    eyeColor: "#000000",         // Color de ojos (opcional)
    
    // Gradiente (opcional)
    gradient: {
      type: "linear",
      colors: ["#FF0000", "#0000FF"],
      angle: 45,
      applyToData: true,
      applyToEyes: false
    },
    
    // Logo (opcional)
    logo: {
      data: "data:image/png;base64,...",
      size: 20,        // Porcentaje
      padding: 2,
      backgroundColor: "#FFFFFF"
    },
    
    // Marco (opcional)
    frame: {
      style: "rounded",
      color: "#000000",
      width: 2,
      text: "SCAN ME",
      textPosition: "bottom"
    },
    
    // Efectos (opcional)
    effects: [
      { type: "shadow", intensity: 50, color: "#000000" }
    ],
    
    // Performance
    optimizeForSize: false,
    enableCache: true
  }
}
```

### Backend Express → Rust Service (Puerto 3002)

⚠️ **IMPORTANTE**: El backend DEBE transformar al formato legacy que Rust espera:

```typescript
// Función transformToRustFormat en qrService.ts
{
  barcode_type: "qrcode",
  data: "https://example.com",
  options: {
    scale: 16,              // size / 25
    margin: 4,
    fgcolor: "#000000",
    bgcolor: "#FFFFFF",
    ecc_level: "M",
    
    // Gradiente en formato Rust
    gradient: {
      type: "linear",
      colors: ["#000000", "#666666"],
      angle: 90,
      apply_to_data: true,
      apply_to_eyes: false
    },
    
    // v2 específicos
    eye_shape: "rounded_square",
    data_pattern: "dots",
    eye_color: "#000000"
  }
}
```

### Response del Rust Service
```json
{
  "success": true,
  "barcode": "<svg>...</svg>",
  "metadata": {
    "version": 4,
    "modules": 29,
    "errorCorrection": "M",
    "dataCapacity": 19,
    "processingTimeMs": 3
  },
  "cached": false
}
```

## 🐛 Problemas Conocidos y Soluciones

### 1. **Gradientes NO se visualizan** ✅ RESUELTO (15 Junio 2025)
- **Causa**: Dos bugs separados en el flujo de generación
- **Bug 1**: `qr_v2.rs` línea 145 - No creaba colors cuando había gradiente
- **Bug 2**: `generator.rs` línea 143 - `to_svg()` no pasaba customization
- **Solución aplicada**: 
  - Usar primer color del gradiente como foreground en qr_v2.rs
  - Pasar `self.customization` en to_svg() para incluir gradientes
- **Estado**: FUNCIONANDO - Gradientes lineales y radiales renderizando correctamente

### 2. **Analytics muestra 0 para features**
- **Causa**: Rust no trackea qué features se usan
- **Impacto**: Dashboard muestra 0% uso de gradientes, logos, etc.

### 3. **Rate limiting agresivo**
- **Límite**: 500 QR/hora por IP
- **Solución**: Usar API keys para límites más altos

### 4. **Features deshabilitadas en UI**
- **Afectadas**: Efectos, marcos, batch UI
- **Razón**: Feature flags en modo producción
- **Backend**: Soporta todas las features

## 📊 Métricas de Performance Reales

| Métrica | Valor |
|---------|-------|
| Generación básica | 2-5ms |
| Con personalización | 10-15ms |
| Con efectos avanzados | 20-30ms |
| Throughput | 340+ RPS |
| Cache hit rate | 70-85% |
| Tasa de error | 0% |
| P95 response time | 50.73ms |
| P99 response time | 55.14ms |

## 🔄 Flujo Completo de Generación QR v2

### Flujo de Datos para Gradientes (Text → QR con Gradiente)

1. **Frontend** (ColorOptions.tsx)
   - Usuario activa toggle de gradiente
   - Selecciona tipo (linear/radial) y colores

2. **Frontend Hook** (useBarcodeGenerationV2.ts)
   - Detecta tipo 'qrcode' → usa endpoint v2
   - Transforma formato UI a API:
   ```typescript
   gradient: {
     type: 'linear',
     colors: ['#FF0000', '#0000FF'],
     angle: 45,
     applyToData: true,
     applyToEyes: false
   }
   ```

3. **Backend Express** (qr.routes.ts)
   - Recibe en `/api/v2/qr/generate`
   - Valida con Zod schema
   - Envía a qrEngineV2Service

4. **Backend Service** (qrEngineV2Service.ts)
   - Transforma a formato Rust legacy
   - POST a `http://localhost:3002/api/qr/generate`

5. **Rust Routes** (qr_v2.rs) ✅ CORREGIDO
   - Mapea opciones a QrCustomization
   - Si hay gradiente, usa primer color como foreground
   - Crea GradientOptions con todos los parámetros

6. **Rust Generator** (generator.rs) ✅ CORREGIDO
   - Genera matriz QR
   - Crea SVG con definiciones de gradiente
   - `to_svg()` ahora pasa customization correctamente

7. **SVG Output**
   ```xml
   <svg viewBox="0 0 330 330">
     <defs>
       <linearGradient id="qr_gradient_0">
         <stop offset="0%" stop-color="#FF0000"/>
         <stop offset="100%" stop-color="#0000FF"/>
       </linearGradient>
     </defs>
     <g fill="url(#qr_gradient_0)">
       <!-- módulos QR -->
     </g>
   </svg>
   ```

8. **Frontend Preview** - Renderiza SVG con gradiente visible

## 📁 Estructura de Archivos de Documentación

```
docs/qr-engine/
├── QR_ENGINE_V2_REFERENCE.md    # ESTE ARCHIVO - Referencia completa
├── README.md                    # Índice general
├── core/
│   ├── technical-guide.md       # Arquitectura y componentes (478 líneas)
│   ├── api-reference.md         # Especificación API completa (351 líneas)
│   └── changelog.md             # Historial detallado de desarrollo
├── migration/
│   ├── migration-guide.md       # Guía paso a paso (312 líneas)
│   ├── migration-status.md      # Estado actual: 100% completo
│   └── compatibility-guide.md   # TypeScript types y adaptadores
├── implementation/
│   ├── INTEGRATION_COMPLETE.md  # Resumen de integración final
│   ├── analytics-dashboard.md   # Documentación del dashboard v2
│   ├── redis-cache.md          # Configuración de caché distribuido
│   ├── troubleshooting-fixes.md # Soluciones a problemas comunes
│   └── progress-reports/        # Reportes históricos por fecha
└── performance/
    ├── benchmarks.md           # Objetivos de rendimiento
    └── test-results.md         # Resultados de pruebas reales
```

## 🎯 Resumen Ejecutivo

1. **QR Engine v2 está 100% activo** desde el 13 de junio 2025
2. **Todas las features están implementadas** en el backend Rust
3. **Los gradientes YA FUNCIONAN** - Bug corregido el 15 de junio 2025
4. **La UI tiene features deshabilitadas** pero el backend las soporta
5. **Performance excepcional**: 10x más rápido que v1
6. **No hay fallback a v1** para códigos QR

## ⚠️ Recordatorio para Desarrolladores

- **SIEMPRE** use el formato moderno en frontend
- **SIEMPRE** transforme al formato legacy para Rust
- **NUNCA** asuma que una feature funciona sin probarla
- **REVISE** este documento antes de implementar cambios

---

*Última actualización: 15 de Junio 2025*  
*Documento actualizado con corrección de bug de gradientes*