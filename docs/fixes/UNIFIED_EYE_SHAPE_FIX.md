# Fix para Modo Unificado de Eye Shape en QR v3

## Problema Identificado

El modo unificado (`eye_shape`) está generando incorrectamente los ojos del QR:

### Estado Actual (Incorrecto):
```svg
<!-- Genera solo un anillo, dejando el centro vacío -->
M 4 7.5 A 3.5 3.5 0 1 0 11 7.5 A 3.5 3.5 0 1 0 4 7.5 Z  <!-- Círculo exterior -->
M 6 7.5 A 1.5 1.5 0 1 0 9 7.5 A 1.5 1.5 0 1 0 6 7.5 Z   <!-- Agujero (incorrecto) -->
```

### Comportamiento Esperado:
El modo unificado debe generar un ojo completo (marco + centro relleno), similar a cómo se ve cuando se usan estilos separados con el mismo valor.

## Solución Propuesta

### Opción 1: Path Compuesto (Recomendada)
Generar un path que dibuje primero el círculo completo exterior y luego agregue el centro relleno:

```svg
<!-- Círculo exterior completo (marco + fondo) -->
M 4 7.5 A 3.5 3.5 0 1 0 11 7.5 A 3.5 3.5 0 1 0 4 7.5 Z
<!-- Centro relleno con color diferente (se renderiza encima) -->
M 6 7.5 A 1.5 1.5 0 1 0 9 7.5 A 1.5 1.5 0 1 0 6 7.5 Z
```

### Opción 2: Dos Elementos SVG
Retornar el modo unificado como dos paths separados internamente pero tratados como una unidad:

```rust
// En lugar de un solo path con agujero
eye_path: "M outer... M hole..."

// Generar dos paths que se renderizan juntos
eye_outer_path: "M 4 7.5 A 3.5 3.5 0 1 0 11 7.5..."  // Marco completo
eye_inner_path: "M 6 7.5 A 1.5 1.5 0 1 0 9 7.5..."  // Centro relleno
```

## Implementación en Rust

### Cambios Necesarios:

1. **En el generador de paths de ojos unificados**:
   - NO usar el patrón de "agujero" (hole pattern)
   - Generar paths sólidos para marco y centro
   
2. **En la función de renderizado**:
   - Para modo unificado: renderizar dos paths superpuestos
   - Para modo separado: mantener comportamiento actual

3. **Lógica de decisión**:
```rust
if use_unified_eye_shape {
    // Generar marco completo + centro relleno
    let outer_path = generate_eye_shape(shape, size, position);
    let inner_path = generate_eye_center(shape, size * 0.43, position); // 1.5/3.5 = 0.43
    
    // Combinar en un solo path o retornar como estructura especial
} else {
    // Mantener lógica actual de estilos separados
}
```

## Casos de Prueba

### 1. Círculo Unificado
- Input: `eye_shape: 'circle'`
- Output: Círculo completo con centro visible

### 2. Cuadrado Unificado  
- Input: `eye_shape: 'square'`
- Output: Cuadrado completo con centro cuadrado visible

### 3. Comparación con Separados
- Unificado `eye_shape: 'circle'` debe verse igual que
- Separado `eye_border_style: 'circle' + eye_center_style: 'circle'`

## Validación

1. El centro debe ser visible y relleno
2. El marco debe rodear completamente el centro
3. Debe ser posible aplicar diferentes colores a marco vs centro
4. La escaneabilidad no debe verse afectada

## Notas de Implementación

- Mantener retrocompatibilidad con QRs existentes
- El cambio solo afecta al modo de renderizado, no a la estructura de datos
- Considerar agregar un flag `unified_eye_rendering_v2` para transición gradual