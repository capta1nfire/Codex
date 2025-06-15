# QR Engine v2 - Troubleshooting & Fixes

> **Last Updated**: June 15, 2025  
> **Purpose**: Document critical bugs discovered and their solutions for future reference

---

# Fix: QR Gradients Rendering Per-Module Instead of Continuous

## Problem
Gradients were being applied to each individual QR module (square) independently, creating a "mosaic" effect where each module showed the full gradient, instead of one continuous gradient across the entire QR code.

### Visual Description
- **Expected**: One smooth gradient flowing across the entire QR code
- **Actual**: Each tiny square had its own complete gradient (hundreds of mini-gradients)

## Root Cause Analysis

### 1. Initial SVG Structure
```xml
<svg viewBox="0 0 330 330">
  <g fill="#000000">
    <rect x="10" y="10" width="10" height="10"/>
    <rect x="20" y="10" width="10" height="10"/>
    <!-- Hundreds more individual rectangles -->
  </g>
</svg>
```

### 2. Gradient Application Problem
When applying gradient with `fill="url(#gradient)"`, SVG's default behavior is:
- `gradientUnits="objectBoundingBox"` (default)
- Each `<rect>` calculates gradient based on its own bounds (0,0 to 10,10)
- Result: Every module shows the complete gradient scaled to its tiny size

## Solution Implemented

### 1. Changed Gradient Units
```rust
// processing/gradients.rs:75-92
if let Some(canvas_size) = canvas_size {
    // Use absolute coordinates for gradient
    gradient.set_attribute("gradientUnits", "userSpaceOnUse");
    
    // Calculate absolute positions based on total canvas
    let (x1, y1, x2, y2) = calculate_gradient_coords(
        gradient_type,
        canvas_size,
        angle
    );
    
    gradient.set_attribute("x1", &x1.to_string());
    gradient.set_attribute("y1", &y1.to_string());
    gradient.set_attribute("x2", &x2.to_string());
    gradient.set_attribute("y2", &y2.to_string());
}
```

### 2. Canvas Size Propagation
```rust
// generator.rs:295-298
// Pass canvas size to gradient processor
let gradient_svg = create_gradient_definition(
    gradient,
    Some((self.size * 10 + 20, self.size * 10 + 20)) // Canvas dimensions
);
```

### 3. Coordinate Calculation Logic
```rust
// For linear gradient at 45°:
// Instead of: x1="0%" x2="100%" (relative to each rect)
// Now: x1="0" y1="0" x2="330" y2="330" (absolute pixels)
```

## Technical Details

### gradientUnits Attribute Values
- **objectBoundingBox** (default): Coordinates relative to the element being filled (0-1 range)
- **userSpaceOnUse**: Coordinates in the current user coordinate system (absolute pixels)

### Why This Works
1. With `userSpaceOnUse`, the gradient is defined once in absolute coordinates
2. All rectangles reference the same gradient at their position in the canvas
3. Each module shows only its portion of the larger gradient
4. Result: One continuous gradient across all modules

## Files Modified
- `/rust_generator/src/processing/gradients.rs` - Added gradientUnits logic
- `/rust_generator/src/engine/generator.rs` - Pass canvas size to gradient creation
- `/rust_generator/src/routes/qr_v2.rs` - Ensure gradient colors are used

## Testing
- Linear gradient: Smooth transition from corner to corner
- Radial gradient: Circular pattern from center outward
- All gradient types now render as single continuous effect

## Connection to Other Issues
This fix was implemented alongside the stroke borders fix. The investigation into why borders weren't showing correctly led to discovering the module-level gradient rendering issue.

## Status
✅ Fixed - Gradients now render as continuous effects across the entire QR code

---

# Fix: QR Engine v2 Analytics Error

## Problem
The QR v2 analytics endpoint was returning a 500 error with the message:
```
getRustServiceUrl is not defined
```

## Root Cause
In the `qrService.ts` file, the analytics functions were trying to call a non-existent function `getRustServiceUrl()` instead of using the already defined constant `QR_ENGINE_URL`.

## Solution
Changed all occurrences of:
```typescript
const rustServiceUrl = getRustServiceUrl();
```

To:
```typescript
const rustServiceUrl = QR_ENGINE_URL;
```

Where `QR_ENGINE_URL` is already defined as:
```typescript
const QR_ENGINE_URL = process.env.RUST_SERVICE_URL || 'http://localhost:3002';
```

## Files Modified
- `/backend/src/services/qrService.ts`

## Testing
After the fix, the endpoint responds correctly but requires valid authentication. The dashboard component should automatically use the authenticated user's token when fetching analytics data.

## Status
✅ Fixed - The 500 error is resolved. The endpoint now properly connects to the Rust service to fetch analytics data.

---

# Fix: QR Gradients Missing Vertical Borders (SVG Optimization Side Effect)

## Problem
When gradient borders were enabled, some QR code types (Link, Text, Email) only showed horizontal borders while others (Call) showed both horizontal and vertical borders correctly.

## Root Cause
The Rust generator had an automatic SVG optimization that merged consecutive horizontal modules into single rectangles when the QR size exceeded 25 modules. This optimization improved performance but had the side effect of eliminating vertical borders between merged modules.

### Code Analysis
- The optimization in `generator.rs:430-486` used `render_modules_optimized()` which created rectangles like:
  - `<rect width="70" height="10">` (7 modules merged)
  - `<rect width="40" height="10">` (4 modules merged)
- This eliminated the vertical gaps where borders would appear
- Different QR types had different data patterns, causing inconsistent behavior

## Solution
Added logic to disable the optimization when stroke is enabled:

```rust
// generator.rs:162-174
let has_stroke = if let Some(custom) = customization {
    custom.gradient.as_ref()
        .and_then(|g| g.stroke_style.as_ref())
        .map(|s| s.enabled)
        .unwrap_or(false)
} else {
    false
};
let use_optimized_rendering = self.size > 25 && !has_stroke;
```

Now when `strokeStyle.enabled = true`, each module is rendered individually as `<rect width="10" height="10">`, preserving all borders.

## Files Modified
- `/rust_generator/src/engine/generator.rs`

## Testing
- QR type "Link": Now shows 576 individual rectangles (previously ~87)
- QR type "Call": Shows 309 rectangles (was already correct)
- Both types now display vertical and horizontal borders correctly

## Lesson Learned
💡 **Always document automatic optimizations and their side effects.** This optimization was not documented anywhere, leading to hours of debugging. Created `internal-capabilities-map.md` to document all such behaviors.

## Status
✅ Fixed - All QR types now show both horizontal and vertical borders when gradient stroke is enabled.

---

# Complete Gradient Implementation Timeline

## June 15, 2025 - Full Gradient System Working

### Morning: Gradient Colors Not Showing
1. **Issue**: Gradients defined but QR rendered in black
2. **Root Cause**: `to_svg()` method not passing customization object
3. **Fix**: Pass `self.customization.as_ref()` to `matrix.to_svg()`

### Afternoon: Per-Module Gradient Problem
1. **Issue**: Each module showing complete gradient (mosaic effect)
2. **Investigation**: Used browser DevTools to inspect SVG structure
3. **Discovery**: Default `objectBoundingBox` applies gradient per element
4. **Solution**: Implement `gradientUnits="userSpaceOnUse"` with absolute coordinates

### Evening: Missing Vertical Borders
1. **Issue**: Some QR types only showing horizontal borders with gradients
2. **Discovery**: Hidden SVG optimization merging modules when size > 25
3. **Side Effect**: Merged rectangles eliminated vertical gaps
4. **Solution**: Disable optimization when stroke is enabled

## Key Technical Insights

### 1. SVG Gradient Coordinate Systems
- **objectBoundingBox**: 0-1 normalized to each element's bounds
- **userSpaceOnUse**: Absolute coordinates in SVG viewport
- Critical for achieving continuous gradients across multiple elements

### 2. Hidden Optimizations
- Performance optimizations can have visual side effects
- Module merging (size > 25) broke stroke rendering
- Now documented in `internal-capabilities-map.md`

### 3. Rust-TypeScript Field Mapping
- Frontend: `gradientBorders` (toggle)
- Backend expects: `gradient.strokeStyle` (object)
- Required transformation in service layer

## Related Documentation
- [Internal Capabilities Map](../core/internal-capabilities-map.md) - All hidden behaviors
- [QR Engine v2 Reference](../QR_ENGINE_V2_REFERENCE.md) - Complete technical flow
- [Audit Action Plan](../core/audit-action-plan.md) - Future improvements

---

## ⚠️ Note on Legacy Documentation
The file `/docs/SVG_GRADIENT_SYSTEM.md` documents an older frontend-only solution that is NO LONGER USED. The current implementation is entirely in the Rust backend as documented above.