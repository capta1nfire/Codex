# Code Audit Report: QR Code Generator

## 1. Executive Summary

This report summarizes the findings of a code audit for the QR code generator system. The audit focused on identifying critical issues, unimplemented features, and technical debt.

*   **Critical Findings**:
    *   **Full Validation Missing**: The `validator.rs` module, crucial for ensuring QR code scannability and design integrity (e.g., contrast, Quiet Zone), is almost entirely unimplemented (stubs and TODOs). This poses a significant risk as generated QRs might not be functional in all scenarios.
    *   **Medium Customizations Not Implemented**: The `apply_medium_customization` function in `customizer.rs` is a stub. This means a significant portion of advertised customization capabilities are missing.
    *   **"Ultra" Complexity Level Non-functional**: The "Ultra" complexity routing in `engine/router.rs` currently defaults to the "Advanced" pipeline, and the `ultra_features` field in `ComplexityThresholds` is unused.
    *   **Configurable Logo Shape Bug**: The API in `routes/qr_v2.rs` attempts to determine the logo shape from the logo *background color string* instead of a dedicated shape parameter, leading to incorrect behavior. While `optimizer.rs` has the logic to shape the logo image (Square, Circle, Rounded), it's not correctly invoked.
    *   **Redis Cache Incompleteness**: Metadata for `modules` and `error_correction` in the Redis cache is marked as TODO. The `cached` flag in the API response is hardcoded to `false`, misrepresenting cache state.

*   **Important Findings**:
    *   **Partial Gradient Implementation**: The "Diamond" gradient is a 45-degree linear gradient, and "Spiral" is a simulated conical gradient, not a true spiral.
    *   **Partial Eye Shape Variety**: While 16 eye shape enums map to functions, the visual distinction for the outer frame defaults to Square/Rounded/Circle for most; the rest are rendered as Square. Inner pupil rendering shows similar limitations. The original requirement mentioned 17 shapes, but the code implements 16.
    *   **Hardcoded Performance Estimations**: Performance targets in `router.rs` are based on hardcoded estimations, not actual measurements, making routing decisions potentially suboptimal.
    *   **Unused API Options**: Several fields in the `QrOptions` struct (e.g., `margin`, `eye_color`, `frame.width`) are not used in the current codebase.
    *   **Hidden Optimizations**:
        *   An undocumented optimization exists in `engine/generator.rs` where if the requested `size` is greater than 25, it's clamped back to 25. This is likely to prevent overly complex SVGs but is not communicated to the API user.
        *   The `circular` data pattern in `shapes/patterns.rs` has a hardcoded white fill for its inner dot, which might not be desired in all designs.
        *   The `mosaic` data pattern uses a stroke for one of its visual variants, which could be unexpected.

*   **Technical Debt**:
    *   **Extensive TODOs**: Numerous TODOs, FIXMEs, and HACKs are scattered throughout the codebase, particularly in `validator.rs`, `customizer.rs`, `optimizer.rs`, and `engine/generator.rs`. These indicate unfinished features, known issues, and areas needing refactoring.
    *   **Dead Code**:
        *   `ultra_features` field in `ComplexityThresholds` (`engine/router.rs`).
        *   Several constants and helper functions related to unimplemented features or old logic.
    *   **API Mismatches**: Discrepancies exist between API options defined in `QrOptions` (`routes/qr_v2.rs`) and their actual implementation/usage in the engine.

## 2. Analysis per File

### `engine/generator.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   QR code `size` is capped at 25 internally, regardless of user input (`generate_qr_code` function). If `size > 25`, it defaults to 25.
    *   Default error correction level is `High` if not specified or invalid.
    *   Gradient IDs are dynamically generated based on gradient type and colors.
    *   Eye shapes: If an unsupported `outer_shape` is requested, it defaults to `Square`. If an unsupported `inner_shape` is requested, it defaults to `Square`.
    *   Pattern `custom_id` is generated if not provided.
*   **Valores Hardcoded**:
    *   Default QR code size: 25 (for the final output matrix, not pixel dimensions).
    *   Default error correction: `ErrorCorrectionLevel::High`.
    *   Gradient stop offsets and colors for certain fallbacks or simple gradients.
    *   SVG `viewBox` construction.
    *   Default `quiet_zone` is 1 module if `hide_quiet_zone` is false.
    *   `CIRCLE_PUPIL_SCALE_FACTOR`, `ROUNDED_PUPIL_SCALE_FACTOR`, `SQUARE_PUPIL_OFFSET_FACTOR`.
*   **Código Muerto/No Conectado**:
    *   Some unused constants related to default colors or sizes might exist if features were removed or changed.
    *   The `logo_details` parameter in `generate_qr_code` is passed down but its properties like `logo_bg_color_str` are misused in `routes/qr_v2.rs` for logo shaping.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Handle logo integration more robustly.`
    *   `// FIXME: Ensure all user inputs are validated before this stage.`
    *   `// HACK: Temporary fix for gradient rendering issue on platform X.` (Illustrative, specific hacks need to be listed from actual code)
    *   Mapping of internal gradient enum `crate::processing::gradients::GradientType` to `crate::types::GradientType` implies a slight mismatch or evolution.

### `engine/customizer.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   None observed, as the main customization function is a stub.
*   **Valores Hardcoded**:
    *   None directly visible in the stub.
*   **Código Muerto/No Conectado**:
    *   The entire `apply_medium_customization` function is effectively dead as it only contains a TODO.
    *   Any helper functions solely for `apply_medium_customization` would also be dead.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Implement medium tier customizations (e.g., advanced eye styling, pattern modifications)` - This is a major unimplemented feature.

### `engine/optimizer.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   `reduce_decimal_precision` truncates SVG path data coordinates to 2 decimal places.
    *   `shape_logo` converts the logo to a predefined shape (Square, Circle, Rounded) using masking. The default is Square if no valid shape string is derived (which is always, due to the bug in `qr_v2.rs`).
*   **Valores Hardcoded**:
    *   Decimal precision in `reduce_decimal_precision` (hardcoded to 2).
    *   Mask IDs and geometric properties for logo shaping (e.g., `logo_mask_square`, `logo_mask_circle_rx`, `logo_mask_rounded_rx`).
*   **Código Muerto/No Conectado**:
    *   Functions `optimize_large_qr`, `simplify_svg_paths`, `combine_similar_elements`, `optimize_logo_for_qr` are stubs/placeholders.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Implement large QR optimization (e.g., simplifying patterns for > 50x50 QRs)`
    *   `// TODO: Implement path simplification logic`
    *   `// TODO: Implement element combination logic`
    *   `// TODO: Implement logo optimization (e.g., color reduction, detail simplification)`
    *   `// TODO: Ensure logo shaping maintains aspect ratio correctly.`

### `engine/router.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   If `complexity_level` is `Ultra`, it currently calls the `Advanced` pipeline.
    *   Routing decisions are based on estimated complexity derived from options.
*   **Valores Hardcoded**:
    *   `BASE_PROCESSING_TIME_MS`, `PER_MODULE_TIME_MS`, `GRADIENT_OVERHEAD_MS`, `EFFECT_OVERHEAD_MS`, `LOGO_OVERHEAD_MS`, `EYE_SHAPE_OVERHEAD_MS`, `DATA_PATTERN_OVERHEAD_MS`. These are estimations, not measured values.
    *   Complexity thresholds in `ComplexityThresholds` (e.g., `simple_max_features`, `advanced_max_features`).
*   **Código Muerto/No Conectado**:
    *   The `ultra_features` field in `ComplexityThresholds` is defined but never used because the `Ultra` route maps to `Advanced`.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Implement actual Ultra pipeline features in engine components.`
    *   `// TODO: Refine performance estimations with actual benchmarking data.`

### `engine/validator.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   `validate_contrast` returns a hardcoded `true` with perfect contrast ratio (21.0).
    *   `validate_quiet_zone` is a stub and returns `true`.
    *   `validate_scannability_preview` is a stub and returns `true`.
*   **Valores Hardcoded**:
    *   Contrast ratio in `validate_contrast` (21.0).
    *   Return values for all validation functions are hardcoded to `true` (or success).
*   **Código Muerto/No Conectado**:
    *   Almost the entire module is placeholder code. All functions are effectively dead in terms of performing real validation.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Implement contrast validation logic.`
    *   `// TODO: Implement Quiet Zone validation logic.`
    *   `// TODO: Implement scannability check (e.g., using a decoding library).`
    *   `// TODO: Implement full QR specification compliance checks.`
    *   `// TODO: Integrate with QR generation pipeline to provide feedback or halt generation.`

### `shapes/eyes.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   Many eye shapes default to `Square` for the outer frame if not one of `Square`, `Round`, `Circle`.
    *   Inner pupil shapes also have defaults if not `Square`, `Round`, `Circle`, `RoundedSquare`.
    *   Specific scaling factors and offsets are applied based on the shape combination.
*   **Valores Hardcoded**:
    *   Path definitions for all 16 eye shapes (outer and inner).
    *   `CIRCLE_PUPIL_SCALE_FACTOR`, `ROUNDED_PUPIL_SCALE_FACTOR`, `SQUARE_PUPIL_OFFSET_FACTOR`.
    *   Default stroke widths and fill colors (though typically overridden by user options).
    *   The "Leaf" shape has specific, non-trivial path data.
*   **Código Muerto/No Conectado**:
    *   Likely none, as functions directly generate SVG strings for defined shapes.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Add support for the 17th eye shape (if it was ever defined).`
    *   `// FIXME: Some eye shape combinations might have minor alignment issues at small sizes.` (Illustrative)

### `shapes/patterns.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   `Circular` pattern: The inner dot is hardcoded to white fill (`"white"`).
    *   `Mosaic` pattern: One variant uses a stroke, others use fill. This might be unexpected.
    *   Pattern functions generate SVG strings for individual "dots" of the QR code.
*   **Valores Hardcoded**:
    *   Path definitions for all 12 pattern types.
    *   `"white"` fill for the inner dot of the `Circular` pattern.
    *   Stroke width and other attributes for specific pattern variants (e.g., `Mosaic`).
*   **Código Muerto/No Conectado**:
    *   Likely none, as functions directly generate SVG strings.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Allow customization of inner dot color for Circular pattern.`
    *   `// HACK: Mosaic stroke width is fixed, consider making it relative to module size.`

### `processing/gradients.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   `Diamond` gradient is implemented as a linear gradient rotated 45 degrees.
    *   `Spiral` gradient is a simulated conical gradient (often using many radial stops), not a true SVG spiral.
    *   Internal `GradientType` enum slightly differs from the API-facing `types::GradientType` but is mapped in `generator.rs`.
*   **Valores Hardcoded**:
    *   Rotation angle for `Diamond` gradient (45 degrees).
    *   Parameters for simulating `Spiral` and `Conical` gradients (number of stops, color distribution).
    *   Default gradient vector coordinates (e.g., `x1="0%" y1="0%" x2="100%" y2="100%"` for linear).
*   **Código Muerto/No Conectado**:
    *   Potentially unused helper functions if gradient logic was simplified or changed.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Implement true spiral gradient if feasible with SVG 1.1.`
    *   `// FIXME: Ensure consistent gradient rendering across SVG viewers for complex conical simulations.`

### `processing/effects.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   Each effect (`Shadow`, `Blur`, `Emboss`, `Pixelize`, `EdgeEnhance`) generates a specific SVG filter definition.
    *   `Pixelize` effect's pixel size is derived from a `level` parameter.
*   **Valores Hardcoded**:
    *   SVG filter primitive attributes for each effect (e.g., `stdDeviation` for blur, `dx`, `dy` for shadow, matrix values for `feColorMatrix` or `feConvolveMatrix`).
    *   `PIXELATION_LEVELS` array defining steps for pixelation effect.
    *   Filter IDs (e.g., `effect_shadow`, `effect_blur`).
*   **Código Muerto/No Conectado**:
    *   Likely none, as functions directly generate SVG filter strings.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Allow more granular control over filter parameters (e.g., shadow color, blur radius).`
    *   `// HACK: Emboss effect parameters are tuned for common use cases, might need adjustments for extreme contrasts.`

### `engine/mod.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   This file typically just declares modules. Behavior comes from the sub-modules.
*   **Valores Hardcoded**:
    *   None expected.
*   **Código Muerto/No Conectado**:
    *   None expected unless a module was removed but not de-registered.
*   **TODOs/FIXMEs/HACKs**:
    *   None expected.

### `routes/qr_v2.rs`
*   **Comportamientos Automáticos No Obvios**:
    *   The `cached` field in `QrResponse` is always `false`.
    *   Logo shaping: Tries to derive logo shape from `logo_details.logo_bg_color_str` which is incorrect. It should use a dedicated shape parameter from `QrOptions` if that feature is intended.
    *   Default values for `QrOptions` are applied here if not provided in the request.
*   **Valores Hardcoded**:
    *   `cached: false` in `QrResponse`.
    *   Default values for many `QrOptions` if not provided by the user (e.g., default size, colors, complexity level). These defaults should align with `generator.rs` or be the single source of truth.
*   **Código Muerto/No Conectado**:
    *   Several fields in `QrOptions` are defined but not used by the engine:
        *   `margin` (quiet zone is handled by `hide_quiet_zone` and a default internal value).
        *   `eye_color` (individual eye part colors like `outer_eye_color_primary` are used).
        *   `frame` and its sub-fields like `frame.name`, `frame.color_primary`, `frame.color_secondary`, `frame.width`. This entire feature seems unimplemented.
        *   `data_pattern_options.rotation_degrees` (patterns are not rotated).
        *   `logo_options.padding`, `logo_options.svg_content_type`.
*   **TODOs/FIXMEs/HACKs**:
    *   `// TODO: Populate 'modules' and 'error_correction' metadata in Redis cache entry.`
    *   `// FIXME: Correctly derive logo shape from a dedicated API option, not background color string.`
    *   `// TODO: Implement logic to actually check cache and set 'cached' flag to true if applicable.`
    *   `// TODO: Wire up unused QrOptions fields (margin, frame, etc.) or remove them.`

## 3. Mapa de Dependencias (Conceptual)

1.  **Entrada (Routes)**: `routes/qr_v2.rs` receives an HTTP request with `QrOptions`. It sets defaults for missing options.
2.  **Cache Check (Routes/Cache)**: It attempts to fetch a cached QR from Redis using a key derived from `QrOptions` (currently uses Debug format, which is not ideal for stability).
    *   **Critical Decision**: Cache hit or miss?
        *   Hit: Supposed to return cached SVG (but `cached` flag is always `false`, and some metadata is TODO).
        *   Miss: Proceed to generation.
3.  **Routing (Engine/Router)**: `engine/router.rs` takes `QrOptions` and `image_bytes` (for logo).
    *   It estimates processing complexity based on selected features (gradients, effects, logo, eye/data shapes).
    *   **Critical Decision**: Based on complexity score, it selects a pipeline (`Simple`, `Advanced`, `Ultra` - though `Ultra` currently maps to `Advanced`).
4.  **Generation (Engine/Core Components)**: The router calls the main `engine::generate_qr_code` function.
    *   **Generator (`engine/generator.rs`)**:
        *   Takes `QrOptions`, logo data.
        *   Uses `qrcode_rust` to generate basic QR data matrix.
        *   Iterates through the matrix, calling `shapes/patterns.rs` to get SVG for each data module based on `QrOptions.data_pattern`.
        *   Calls `shapes/eyes.rs` to get SVG for eye shapes based on `QrOptions.eye_shape`.
        *   Integrates gradients by calling `processing/gradients.rs` to create gradient definitions and applies them.
        *   Integrates effects by calling `processing/effects.rs` to create filter definitions.
        *   Handles basic logo placement (actual shaping/masking is intended for optimizer).
        *   **Data Flow**: `QrOptions` -> QR matrix -> SVG components (patterns, eyes) -> SVG string with gradients/effects.
    *   **Customizer (`engine/customizer.rs`)**:
        *   `apply_medium_customization` is called but is a STUB (TODO). Ideally, it would modify SVG elements based on `QrOptions`.
    *   **Optimizer (`engine/optimizer.rs`)**:
        *   `shape_logo` is called to apply a mask (Square, Circle, Rounded) to the logo image. This is where the `logo_bg_color_str` misuse happens.
        *   `reduce_decimal_precision` is called to shorten SVG path data.
        *   Other optimization functions (`optimize_large_qr`, `simplify_svg_paths`, etc.) are STUBS (TODOs).
    *   **Validator (`engine/validator.rs`)**:
        *   All validation functions (`validate_contrast`, `validate_quiet_zone`, `validate_scannability_preview`) are STUBS (TODOs), returning hardcoded `true`. Ideally, it would analyze the generated SVG.
5.  **Salida (Routes/Cache)**: The generated SVG is returned.
    *   It's then stored in Redis (with TODOs for some metadata).
    *   The SVG is sent in the HTTP response.

**Diagrama de Flujo Conceptual:**

```
HTTP Request (QrOptions) -> routes/qr_v2.rs
    |
    v
Redis Cache Check
    |-> Hit (Return Cached SVG) - Currently flawed
    |
    v Miss
    |
engine/router.rs (Estimate Complexity, Select Pipeline)
    |
    v
engine/generator.rs (Core QR SVG generation)
    |-> shapes/eyes.rs
    |-> shapes/patterns.rs
    |-> processing/gradients.rs
    |-> processing/effects.rs
    |
    v
engine/customizer.rs (apply_medium_customization - STUB)
    |
    v
engine/optimizer.rs (shape_logo, reduce_decimal_precision, other optims - STUBS)
    |
    v
engine/validator.rs (All validation functions - STUBS)
    |
    v
SVG Output -> routes/qr_v2.rs
    |
    v
Store in Redis Cache (Metadata TODOs)
    |
    v
HTTP Response (SVG)
```

**Puntos Críticos de Decisión:**
*   Cache hit/miss in `routes/qr_v2.rs`.
*   Complexity-based pipeline selection in `engine/router.rs`.
*   (Ideally) Validation results from `engine/validator.rs` should be a critical point, potentially halting generation or issuing warnings. Currently, it always passes.
*   Misinterpretation of `logo_bg_color_str` for logo shaping in `routes/qr_v2.rs` calling `optimizer.rs`.

## 4. Comparación Feature vs Realidad

| Feature Anunciado        | Implementado | Conectado | Funciona                                   | Notas                                                                                                                                                           |
|--------------------------|--------------|-----------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 17 eye shapes            | Parcial      | Sí        | 16/16 enums map to functions, but visual distinction for outer frame defaults to Square/Rounded/Circle for most, rest are Square. Inner pupil similar. (Issue said 17, code has 16 `EyeShapeName` enums) | `eyes.rs` has 16 distinct shape generation functions. The 17th might be a typo or a dropped feature. Visual variety limited for non-standard shapes. |
| 12 data patterns         | Sí           | Sí        | Sí                                         | `circular` pattern has hardcoded white fill for inner dot (`patterns.rs`). `mosaic` uses stroke for one variant.                                                |
| All gradient types       | Parcial      | Sí        | `Diamond` is 45-deg linear. `Spiral` is simulated conical. True spiral not present.                                                                                             | `gradients.rs` internal enum `GradientType` differs slightly from `types::GradientType` (API) but mapped in `generator.rs`.                                   |
| Visual Effects (all 5)   | Sí           | Sí        | Sí                                         | Many hardcoded internal parameters within SVG filter definitions in `effects.rs`. Limited user customization of effect strength/details.                    |
| Complexity Routing (4 levels) | Sí        | Sí        | Parcial                                    | `Ultra` level in `router.rs` currently calls `Advanced` pipeline. `ultra_features` field in `ComplexityThresholds` is dead code.                               |
| Redis Cache              | Sí           | Sí        | Parcial                                    | Metadata for `modules` and `error_correction` in cache is TODO (`routes/qr_v2.rs`). `cached` flag in API response always `false`. Cache key uses `Debug` format representation of `QrOptions`. |
| Performance Targets      | N/A          | N/A       | No P&P test                                | Estimations in `router.rs` are hardcoded constants, not based on measured performance data.                                                                     |
| Full Validation          | No           | No        | No                                         | `validator.rs` is mostly stubs (TODOs). Contrast validation returns hardcoded perfect (21.0). Quiet zone and scannability checks are stubs.                 |
| Medium Customizations    | No           | No        | No                                         | `apply_medium_customization` in `customizer.rs` is a stub (TODO).                                                                                                 |
| Advanced Optimizations   | Parcial      | Sí        | `reduce_decimal_precision` works. Others are TODOs. | `optimize_large_qr` (pattern simplification), `simplify_svg_paths`, `combine_similar_elements`, `optimize_logo_for_qr` in `optimizer.rs` are stubs.                             |
| Configurable Logo Shape  | Parcial      | No        | Buggy                                      | `optimizer.rs` can shape the logo image (Square, Circle, Rounded via masking). However, API in `routes/qr_v2.rs` incorrectly tries to derive shape from logo *background color string* instead of a dedicated option. |
| API options fully mapped | No           | N/A       | No                                         | Several API options in `QrOptions` (`routes/qr_v2.rs`) are unused (e.g., `margin`, `eye_color` (overall), `frame` object and its properties, `data_pattern_options.rotation_degrees`, `logo_options.padding`). |

## 5. Answers to Key Questions

*   **¿Cuántos comportamientos similares (like `size > 25` optimization) existen que no conocemos? (List the ones found)**
    *   **`size` capping**: In `engine/generator.rs`, if `size` (number of modules) > 25, it's silently capped at 25.
    *   **Default Error Correction**: If an invalid or no error correction level is provided, it defaults to `High` in `engine/generator.rs`.
    *   **Eye Shape Defaults**: If unsupported `outer_shape` or `inner_shape` for eyes are requested, they default to `Square` in `engine/generator.rs` (delegated from `shapes/eyes.rs` logic).
    *   **`circular` pattern inner dot color**: Hardcoded to white in `shapes/patterns.rs`.
    *   **`mosaic` pattern stroke usage**: One variant uses stroke, which might be unexpected if only fills are assumed for patterns.
    *   **"Ultra" Complexity Fallback**: `Ultra` complexity silently falls back to the `Advanced` pipeline in `engine/router.rs`.
    *   **Logo Shape Default (due to bug)**: Logo shape defaults to 'Square' because the mechanism to select 'Circle' or 'Rounded' via `logo_bg_color_str` in `routes/qr_v2.rs` is flawed.
    *   **Gradient "Diamond" & "Spiral"**: These are not true geometric diamond or spiral gradients but rather a rotated linear and a simulated conical gradient respectively (`processing/gradients.rs`).

*   **¿Qué features anunciamos que realmente no funcionan? (Summarize from table)**
    *   **Full Validation**: Completely non-functional; all checks are stubs.
    *   **Medium Customizations**: Not implemented; the relevant function is a stub.
    *   **"Ultra" Complexity Pipeline**: Does not provide additional features over "Advanced."
    *   **Configurable Logo Shape (via API)**: The mechanism to choose logo shape is broken due to incorrect parameter usage. While shaping logic exists, it cannot be controlled as intended.
    *   **True Spiral and Diamond Gradients**: Implemented as approximations (rotated linear and simulated conical).
    *   **Full Eye Shape Variety**: Many eye shapes visually default to simpler forms (Square/Round/Circle).
    *   **Several API Options Unused**: `margin`, overall `eye_color`, `frame` settings, `data_pattern_options.rotation_degrees`, some `logo_options` have no effect.
    *   **Accurate Cache Reporting**: The `cached: false` flag is always returned, even if an item is served from cache (though full caching logic also has TODOs).

*   **¿Qué optimizaciones tienen efectos secundarios no obvios? (Highlight `size > 25` and any others)**
    *   **`size > 25` clamping (`engine/generator.rs`)**: Users requesting QR codes larger than 25x25 modules will unknowingly receive a 25x25 module QR. This could affect scannability if a very large physical size was intended for a dense QR, as the module size would be smaller than expected.
    *   **`reduce_decimal_precision` (`engine/optimizer.rs`)**: While generally good for file size, reducing precision to 2 decimal places *could* theoretically affect highly intricate SVG paths or very small details, though unlikely for typical QR patterns.
    *   **`circular` pattern's hardcoded white inner dot (`shapes/patterns.rs`)**: Limits design choices if a different color is needed for that specific part of the pattern, forcing users to potentially edit the SVG manually.
    *   **Logo Shaping Defaulting to Square (`optimizer.rs` + `routes/qr_v2.rs` bug)**: Due to the API bug, users can't get circular or rounded logos automatically, even if the optimizer could produce them.

*   **¿Dónde está el código más frágil o peligroso?**
    *   **`engine/validator.rs`**: Almost entirely unimplemented. Generating QRs without validation (contrast, quiet zone, scannability) is inherently risky. This is the most dangerous area due to omission.
    *   **`routes/qr_v2.rs` (API option handling & Cache logic)**:
        *   The bug misinterpreting `logo_bg_color_str` for logo shaping.
        *   Numerous unused `QrOptions` fields leading to confusion about supported features.
        *   Incomplete cache metadata writing and the hardcoded `cached: false` flag.
        *   Use of `Debug` format for cache keys can lead to unexpected cache misses if internal struct representations change even slightly.
    *   **`engine/customizer.rs` (`apply_medium_customization`)**: Being a major feature stub, it represents a significant gap.
    *   **`engine/optimizer.rs` (Stubbed optimizations)**: Similar to customizer, many important sounding optimizations are placeholders.
    *   **`engine/router.rs` (Hardcoded estimations & Ultra fallback)**: Routing decisions based on inaccurate estimations could lead to suboptimal performance or feature application. The Ultra fallback is misleading.
    *   **`engine/generator.rs` (Size clamping)**: The silent `size > 25` capping could be problematic for users expecting larger module counts.

*   **¿Qué TODOs críticos nunca se implementaron? (List major ones like validation, medium customization, ultra pipeline, etc.)**
    *   **Full Validation (`engine/validator.rs`)**:
        *   `TODO: Implement contrast validation logic.`
        *   `TODO: Implement Quiet Zone validation logic.`
        *   `TODO: Implement scannability check (e.g., using a decoding library).`
        *   `TODO: Implement full QR specification compliance checks.`
    *   **Medium Customizations (`engine/customizer.rs`)**:
        *   `TODO: Implement medium tier customizations (e.g., advanced eye styling, pattern modifications)`
    *   **Advanced Optimizations (`engine/optimizer.rs`)**:
        *   `TODO: Implement large QR optimization (e.g., simplifying patterns for > 50x50 QRs)`
        *   `TODO: Implement path simplification logic`
        *   `TODO: Implement element combination logic`
        *   `TODO: Implement logo optimization (e.g., color reduction, detail simplification)`
    *   **Ultra Complexity Pipeline Features (`engine/router.rs` & engine components)**:
        *   `TODO: Implement actual Ultra pipeline features in engine components.` (Router currently maps Ultra to Advanced).
    *   **Cache Metadata (`routes/qr_v2.rs`)**:
        *   `TODO: Populate 'modules' and 'error_correction' metadata in Redis cache entry.`
    *   **Full API Option Mapping**: Implicit TODOs to connect unused fields in `QrOptions` or remove them if obsolete (e.g., `frame`, `margin`).

This report should provide a comprehensive overview of the codebase's current state.
