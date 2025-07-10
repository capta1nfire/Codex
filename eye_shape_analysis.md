# QR Engine Eye Shape Analysis - Unified vs Separated Modes

## Test Parameters
- **Data**: "TEST"
- **Error Correction**: M
- **Test Date**: Mon Jul  7 19:23:52 PDT 2025

## Test 1: Unified Eye Shape Mode
**Configuration**: eye_shape='circle'
**Response Format**: Single 'path' field per eye
**Eye Structure**: Combined border + center in single path

### Eye Paths Generated:

#### Top Left Eye:
```svg
M 4 7.5 A 3.5 3.5 0 1 0 11 7.5 A 3.5 3.5 0 1 0 4 7.5 Z M 6 7.5 A 1.5 1.5 0 1 0 9 7.5 A 1.5 1.5 0 1 0 6 7.5 Z
```

#### Top Right Eye:
```svg
M 18 7.5 A 3.5 3.5 0 1 0 25 7.5 A 3.5 3.5 0 1 0 18 7.5 Z M 20 7.5 A 1.5 1.5 0 1 0 23 7.5 A 1.5 1.5 0 1 0 20 7.5 Z
```

#### Bottom Left Eye:
```svg
M 4 21.5 A 3.5 3.5 0 1 0 11 21.5 A 3.5 3.5 0 1 0 4 21.5 Z M 6 21.5 A 1.5 1.5 0 1 0 9 21.5 A 1.5 1.5 0 1 0 6 21.5 Z
```

## Test 2: Separated Eye Styles Mode
**Configuration**: eye_border_style='circle', eye_center_style='circle'
**Response Format**: Separate 'border_path' and 'center_path' fields per eye
**Eye Structure**: Border and center are separate paths

### Eye Paths Generated:

#### Top Left Eye:
**Border**: `M 4 7.5 A 3.5 3.5 0 1 0 11 7.5 A 3.5 3.5 0 1 0 4 7.5 Z M 5 7.5 A 2.5 2.5 0 1 0 10 7.5 A 2.5 2.5 0 1 0 5 7.5 Z`
**Center**: `M 6 7.5 A 1.5 1.5 0 1 0 9 7.5 A 1.5 1.5 0 1 0 6 7.5 Z`

#### Top Right Eye:
**Border**: `M 18 7.5 A 3.5 3.5 0 1 0 25 7.5 A 3.5 3.5 0 1 0 18 7.5 Z M 19 7.5 A 2.5 2.5 0 1 0 24 7.5 A 2.5 2.5 0 1 0 19 7.5 Z`
**Center**: `M 20 7.5 A 1.5 1.5 0 1 0 23 7.5 A 1.5 1.5 0 1 0 20 7.5 Z`

#### Bottom Left Eye:
**Border**: `M 4 21.5 A 3.5 3.5 0 1 0 11 21.5 A 3.5 3.5 0 1 0 4 21.5 Z M 5 21.5 A 2.5 2.5 0 1 0 10 21.5 A 2.5 2.5 0 1 0 5 21.5 Z`
**Center**: `M 6 21.5 A 1.5 1.5 0 1 0 9 21.5 A 1.5 1.5 0 1 0 6 21.5 Z`


## Analysis Results

### Key Differences Found:

#### 1. **Response Structure**
- **Unified Mode**: Single `path` field per eye
- **Separated Mode**: Separate `border_path` and `center_path` fields per eye

#### 2. **SVG Path Construction**
- **Unified Mode**: Creates one continuous path combining border and center
- **Separated Mode**: Creates distinct paths for border and center elements

#### 3. **Content Hash Differences**
- **Unified Mode**: `ce3732c956df63d5f83591d3d3069ff2d64691b751fc31b5e826f26f53146ab1`
- **Separated Mode**: `82f6fb60fe5ccedd6f58fc06ed543c5cd8fde10b9f432bb7d1fd240aadf050f1`

#### 4. **Border Path Differences**
In the separated mode, the border path includes an additional inner circle to create the "hole" for the center:
- **Unified border**: Outer circle (A 3.5 3.5) + inner circle (A 1.5 1.5) - creates solid eye with hole
- **Separated border**: Outer circle (A 3.5 3.5) + middle circle (A 2.5 2.5) - creates border ring only

#### 5. **Center Path Consistency**
Both modes generate identical center paths:
- Center circle with radius 1.5 at the same coordinates
- This suggests the center rendering logic is shared between modes

### Visual Rendering Implications:

#### Unified Mode:
- **Advantage**: Single path is simpler to render
- **Limitation**: Cannot apply different styles to border vs center
- **Use Case**: When border and center should have the same visual treatment

#### Separated Mode:
- **Advantage**: Allows independent styling of border and center
- **Flexibility**: Can apply different colors, gradients, or effects to each component
- **Use Case**: When advanced eye customization is needed

### Performance Comparison:
- **Unified Mode**: Slightly less data transfer (single path vs two paths)
- **Separated Mode**: More flexible but requires more complex rendering logic

### Recommendation:
Use **Separated Mode** for advanced customization scenarios where independent border/center styling is needed. Use **Unified Mode** for simpler use cases where the eye should be rendered as a single element.

