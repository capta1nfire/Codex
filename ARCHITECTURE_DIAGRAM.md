# 🏗️ Diagrama de Arquitectura: Actual vs Propuesta

## 📊 ARQUITECTURA ACTUAL (God Component)

```mermaid
graph TD
    subgraph "page.tsx (1,154 líneas)"
        A[15+ Estados Locales]
        B[10+ useEffects]
        C[7+ useCallbacks]
        D[4 useRefs]
        E[Lógica de Validación]
        F[Lógica de Generación]
        G[Coordinación de Estado]
        H[Renderizado de UI]
        I[Manejo de Formularios]
        J[Control de Flujos Asíncronos]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> A
    
    style A fill:#ff6b6b
    style B fill:#ff6b6b
    style C fill:#ff6b6b
```

### Problemas Identificados:
- 🔴 **Acoplamiento Extremo**: Todo está interconectado
- 🔴 **Responsabilidades Múltiples**: UI + Lógica + Estado + Coordinación
- 🔴 **Difícil de Testear**: No se pueden probar partes aisladas
- 🔴 **Propenso a Bugs**: Efectos pueden crear loops infinitos
- 🔴 **Mantenibilidad Pobre**: Cambiar algo puede romper todo

---

## ✨ ARQUITECTURA PROPUESTA (Componentes Modulares)

```mermaid
graph TD
    subgraph "page.tsx (~30 líneas)"
        Page[Layout Principal]
    end
    
    subgraph "Orquestador"
        QGC[QRGeneratorContainer]
        OSM[useQRGeneratorOrchestrator<br/>State Machine]
    end
    
    subgraph "Componentes UI"
        URL[URLValidation]
        QFM[QRFormManager]
        GC[GenerationControls]
        PS[PreviewSection]
        GL[GeneratorLayout]
    end
    
    subgraph "Hooks Especializados"
        H1[useURLValidation]
        H2[useQRFormState]
        H3[useGenerationState]
        H4[useTypingTracker]
    end
    
    subgraph "Servicios"
        S1[validationService]
        S2[generationService]
        S3[autoGenerationService]
    end
    
    Page --> QGC
    QGC --> OSM
    QGC --> GL
    
    GL --> URL
    GL --> QFM
    GL --> GC
    GL --> PS
    
    URL --> H1
    QFM --> H2
    GC --> H3
    
    OSM --> S1
    OSM --> S2
    OSM --> S3
    
    H1 --> S1
    H3 --> S2
    
    style Page fill:#4ecdc4
    style QGC fill:#4ecdc4
    style OSM fill:#95e1d3
```

### Beneficios de la Nueva Arquitectura:

#### 🟢 **Separación de Responsabilidades**
- **page.tsx**: Solo layout y composición
- **QRGeneratorContainer**: Orquestación de componentes
- **State Machine**: Coordinación de flujos complejos
- **Componentes UI**: Solo presentación
- **Hooks**: Lógica reutilizable
- **Servicios**: Efectos secundarios aislados

#### 🟢 **Flujo de Datos Unidireccional**
```
User Input → Component → Hook → State Machine → Service → State Update → UI Update
```

#### 🟢 **Testing Simplificado**
- Cada componente testeable independientemente
- State machine con tests determinísticos
- Servicios mockeables
- Hooks testables con renderHook

---

## 🔄 MAPEO DE MIGRACIÓN

### handleQRFormChange (116 líneas) → Dividido en:
```
├── URLValidationInput.onChange()     (10 líneas)
├── useURLValidation.validate()       (20 líneas)
├── stateMachine.FORM_CHANGE action   (15 líneas)
├── validationService()               (20 líneas)
└── QRFormManager.updateField()       (10 líneas)
```

### useEffects (10+) → Convertidos a:
```
├── stateMachine.services
│   ├── initialGenerationService
│   ├── urlValidationService
│   └── autoGenerationService
└── Component lifecycle hooks
    ├── URLValidation.useEffect (debounce)
    └── PreviewSection.useEffect (animation)
```

### Estados (15+) → Organizados en:
```
├── stateMachine.context
│   ├── generation: { state, data, error }
│   ├── validation: { isValidating, result, metadata }
│   └── form: { type, data, options }
└── Component local state
    ├── URLValidation: inputValue
    └── GenerationControls: isDropdownOpen
```

### Refs (4) → Eliminados y reemplazados por:
```
├── stateMachine.context.lastValidatedUrl
├── stateMachine.context.hasGeneratedInitial
├── stateMachine.context.lastGeneratedData
└── stateMachine.timers (manejados internamente)
```

---

## 📈 MÉTRICAS DE MEJORA ESPERADAS

| Métrica | Actual | Propuesta | Mejora |
|---------|--------|-----------|---------|
| Líneas en page.tsx | 1,154 | ~30 | -97% |
| Complejidad Ciclomática | >20 | <5 | -75% |
| Acoplamiento | Alto | Bajo | ⬇️⬇️⬇️ |
| Cohesión | Baja | Alta | ⬆️⬆️⬆️ |
| Testabilidad | Difícil | Fácil | ⬆️⬆️⬆️ |
| Tiempo para nuevas features | Alto | Bajo | -60% |
| Riesgo de bugs | Alto | Bajo | -70% |

---

## 🎯 PRINCIPIOS APLICADOS

1. **Single Responsibility Principle (SRP)**
   - Cada componente tiene una sola razón para cambiar

2. **Open/Closed Principle (OCP)**
   - Abierto para extensión (nuevos tipos QR), cerrado para modificación

3. **Dependency Inversion Principle (DIP)**
   - Componentes dependen de abstracciones (hooks/servicios)

4. **Composition over Inheritance**
   - Componentes pequeños compuestos en lugar de herencia

5. **State Machine Pattern**
   - Estados explícitos y transiciones predecibles

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Backup realizado**
2. ✅ **Análisis de dependencias completado**
3. ✅ **Diagrama de arquitectura creado**
4. ⏳ **Escribir tests de regresión** (siguiente)
5. ⏳ **Setup nueva estructura de directorios**