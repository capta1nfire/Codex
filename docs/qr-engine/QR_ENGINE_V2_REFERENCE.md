# Arquitectura de Generación QR Unificada (v3)

> **Propósito**: Este documento describe la arquitectura de generación de QR consolidada y sirve como la única fuente de verdad técnica. Reemplaza todas las referencias a motores v1 y v2.

## 📊 Estado Arquitectónico: Propuesta de Consolidación

El análisis del código ha revelado una fragmentación significativa en la lógica de generación de QR. Múltiples versiones de APIs y servicios coexisten, creando una deuda técnica que debe ser resuelta.

**La arquitectura propuesta unifica toda la generación de QR a través de un único y potente flujo de datos, utilizando el motor v3 "enhanced" como la única fuente de generación.**

---

##  flusso de Datos Unificado (Arquitectura Objetivo)

El siguiente diagrama ilustra el flujo de datos ideal, desde la interfaz de usuario hasta el generador de Rust.

```mermaid
graph TD
    subgraph Frontend
        A[Componente de UI<br/>(page.tsx)] -- 1. Interacción --> B{useQRGenerationState.ts};
        B -- 2. Llama a API --> C[Cliente API Unificado<br/>(api.ts)];
    end

    subgraph Backend (Node.js)
        C -- 3. POST /api/qr --> D[Ruta Unificada<br/>(qr.unified.routes.ts)];
        D -- 4. Llama a Servicio --> E[Servicio Unificado<br/>(qr.unified.service.ts)];
    end

    subgraph Generador (Rust)
        E -- 5. Llama a Generador --> F[Endpoint Único<br/>(/api/v3/qr/enhanced)];
        F -- 6. Procesa y Devuelve JSON --> G[Motor v3 "Enhanced"];
    end

    subgraph Flujo de Retorno
        G -- 7. Datos Estructurados --> E;
        E -- 8. Responde a Ruta --> D;
        D -- 9. Responde a Cliente --> C;
        C -- 10. Actualiza Hook --> B;
        B -- 11. Actualiza Estado --> A;
        A -- 12. Renderiza QR --> H[Componente de Vista Previa];
    end
```

---

## 🐛 Diagnóstico Correcto del Problema de Gradientes

-   **Causa Real:** El problema no es que el procesador de gradientes no esté integrado. El problema es que las **rutas de API legacy (`/api/generate`) invocan una función en Rust (`lib.rs::generate_code`) que es incapaz de procesar opciones de personalización avanzada.**
-   **Solución Propuesta:** Eliminar por completo las rutas legacy y dirigir todas las solicitudes de generación de QR a través del nuevo flujo unificado que utiliza el motor v3, el cual sí procesa correctamente los gradientes y todas las demás opciones de personalización.

---

## ⚙️ Especificación de la API Unificada

### Endpoint Único: `POST /api/qr`

Este endpoint reemplaza a `/api/generate`, `/api/v2/qr/generate` y `/api/v3/qr/enhanced`.

#### **Payload de la Petición (Request Body)**

El cuerpo de la petición debe ser un objeto JSON que contenga los datos a codificar y un objeto de opciones de personalización.

```json
{
  "data": "https://codex-project.com",
  "options": {
    "error_correction": "M",
    "customization": {
      "gradient": {
        "enabled": true,
        "gradient_type": "linear",
        "colors": ["#FF0000", "#0000FF"],
        "angle": 90
      },
      "eye_shape": "rounded_square",
      "data_pattern": "dots",
      "logo": {
        "data": "data:image/png;base64,...",
        "size_percentage": 20,
        "shape": "square"
      },
      "frame": {
        "frame_type": "simple",
        "text": "SCAN ME"
      },
      "effects": [
        { "effect_type": "shadow", "config": {} }
      ]
    }
  }
}
```

#### **Respuesta Exitosa (Response Body)**

La respuesta no será un SVG, sino un objeto JSON con los datos estructurados del QR, permitiendo un renderizado seguro y flexible en el frontend.

```json
{
  "success": true,
  "data": {
    "path_data": "M4 0h1v1H4z M5 0h1v1H5z ...",
    "total_modules": 33,
    "data_modules": 789,
    "version": 4,
    "error_correction": "M",
    "customization_applied": {
        "gradient": { /* ... */ },
        "eye_shape": "rounded_square",
        "data_pattern": "dots"
    }
  },
  "metadata": {
    "engine_version": "3.1.0",
    "cached": false,
    "processing_time_ms": 15
  }
}
```

---

## ✅ Checklist de Implementación

Para alcanzar esta arquitectura unificada, el equipo de desarrollo debe seguir los pasos descritos en el **Plan de Acción de Consolidación**. Este documento sirve como la especificación técnica para esa refactorización.

1.  **Unificar Backend:** Centralizar la lógica en `qr.unified.service.ts` y `qr.unified.routes.ts`.
2.  **Unificar Frontend:** Centralizar la lógica en el hook `useQRGenerationState.ts`.
3.  **Eliminar Código Obsoleto:** Borrar todos los archivos de rutas, servicios y hooks redundantes.
4.  **Verificar Funcionalidad:** Probar exhaustivamente que todas las opciones de personalización funcionan a través del nuevo flujo unificado.

---
*Última actualización: 25 de junio de 2025*
*Estado: Documento de Arquitectura Objetivo*
