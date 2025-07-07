# QR v3 Customization Options - Complete Reference

> **Last Updated**: 2025-06-28  
> **Status**: ✅ Complete and Synchronized  
> **Note**: This is the official reference for all QR v3 customization options

## 📋 Table of Contents

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Eye Styles](#eye-styles)
- [Data Patterns](#data-patterns)
- [Gradients](#gradients)
- [Effects](#effects)
- [Colors](#colors)
- [Logos](#logos)
- [Frames](#frames)
- [Complete Request Examples](#complete-request-examples)

## 🎯 Overview

QR v3 provides extensive customization options while maintaining ISO/IEC 18004 compliance and ensuring high scan rates.

### Key Principles
- **Finder patterns (eyes) MUST be closed shapes** for proper scanning
- **Data patterns** can be more creative while maintaining contrast
- **All options are validated** at the Express backend level
- **Snake_case naming** is used throughout the API

## 🔗 API Endpoints

### Primary Endpoint
```
POST /api/v3/qr/enhanced
```

### Additional Endpoints
- `POST /api/v3/qr/generate` - Basic generation (limited customization)
- `POST /api/v3/qr/batch` - Batch generation (up to 50 codes)
- `GET /api/v3/qr/preview` - Preview with GET parameters
- `POST /api/v3/qr/validate` - Validate options before generation

## 👁️ Eye Styles

Eyes (finder patterns) use a **separated style system** for maximum flexibility:

### eye_shape (LEGACY - for backward compatibility)
**16 options available:**
```
square, rounded_square, circle, dot, leaf, bars_horizontal, bars_vertical,
star, diamond, cross, hexagon, heart, shield, crystal, flower, arrow
```

### eye_border_style (Recommended)
**14 options available:**
```
square, rounded_square, circle, quarter_round, cut_corner,
thick_border, double_border, diamond, hexagon, cross,
star, leaf, arrow
```

⚠️ **Note**: Open shapes (like half circles) are not supported as they affect scanning reliability according to ISO/IEC 18004 standards.

### eye_center_style
**8 options available:**
```
square, rounded_square, circle, dot, star, diamond, cross, plus
```

### Best Practices
- Use `eye_border_style` + `eye_center_style` instead of legacy `eye_shape`
- Structural styles (square, rounded_square, circle) have best scan rates
- Ornamental styles (star, leaf) are better suited for centers than borders

## 🎨 Data Patterns

### data_pattern
**12 options available:**
```
square        - Standard square modules
dots          - Circular dots
rounded       - Rounded squares
vertical      - Vertical lines
horizontal    - Horizontal lines
diamond       - Diamond shapes
circular      - Concentric circles
star          - Star shapes
cross         - Cross patterns
random        - Random variations
wave          - Wave patterns
mosaic        - Mosaic tiles
```

### Recommendations by Use Case
- **Corporate**: square, rounded
- **Creative**: dots, diamond, star
- **Artistic**: wave, mosaic, random
- **High Contrast**: square, vertical, horizontal

## 🌈 Gradients

### gradient Options
```json
{
  "enabled": true,
  "gradient_type": "linear|radial|conic|diamond|spiral",
  "colors": ["#FF0000", "#0000FF"],  // 2-5 colors
  "angle": 45,                        // For linear gradients
  "apply_to_eyes": true,
  "apply_to_data": true,
  "stroke_style": {
    "enabled": true,
    "color": "#FFFFFF",
    "width": 0.1,
    "opacity": 0.3
  }
}
```

### Gradient Types
- **linear**: Traditional linear gradient
- **radial**: Center-out radial gradient
- **conic**: Circular sweep gradient
- **diamond**: Diamond-shaped gradient
- **spiral**: Spiral pattern gradient

### Stroke Style (Gradient Borders)
The `stroke_style` option adds subtle borders around gradient elements:

```json
{
  "stroke_style": {
    "enabled": true,
    "color": "#FFFFFF",
    "width": 0.1,
    "opacity": 0.3
  }
}
```

**Parameters:**
- `enabled`: Boolean to activate/deactivate gradient borders
- `color`: Hex color for border outline (default: `#FFFFFF`)
- `width`: Border thickness, range 0.1-2.0 (default: `0.1` for subtle effect)
- `opacity`: Border transparency, range 0.1-1.0 (default: `0.3`)

**Usage Notes:**
- Gradient borders enhance visual separation between QR modules
- Subtle widths (0.1-0.3) are recommended for optimal scannability
- White borders work well with dark gradients for contrast
- Can be controlled via "Aplicar bordes al gradiente" toggle in frontend

## ✨ Effects

### effects Array
```json
[
  {
    "type": "shadow|glow|blur|noise|vintage",
    "intensity": 50,      // 0-100
    "color": "#000000"    // For shadow/glow
  }
]
```

### Effect Types
- **shadow**: Drop shadow effect
- **glow**: Outer glow effect
- **blur**: Gaussian blur
- **noise**: Texture noise
- **vintage**: Sepia/vignette combination

## 🎨 Colors

### colors Object
```json
{
  "foreground": "#000000",  // Data and eye color
  "background": "#FFFFFF",  // Background color
  "eye_colors": {           // Independent eye colors (optional)
    "outer": "#FF0066",     // Border color for all eyes
    "inner": "#6600FF",     // Center color for all eyes
    "per_eye": {            // Different colors per eye (optional)
      "top_left": {
        "outer": "#FF0000",
        "inner": "#FF6666"
      },
      "top_right": {
        "outer": "#00FF00",
        "inner": "#66FF66"
      },
      "bottom_left": {
        "outer": "#0000FF",
        "inner": "#6666FF"
      }
    }
  }
}
```

### Eye Colors (New in v3.4)
- **eye_colors**: Optional object for independent eye coloring
- **outer**: Hex color for eye borders (applies to all eyes)
- **inner**: Hex color for eye centers (applies to all eyes)
- **per_eye**: Override colors for specific eyes
  - `top_left`: Top-left finder pattern
  - `top_right`: Top-right finder pattern
  - `bottom_left`: Bottom-left finder pattern

### Color Notes
- Must be valid hex colors (#RRGGBB)
- High contrast recommended for scanning
- Gradients override solid colors when enabled
- Eye colors override foreground color for eyes
- Per-eye colors override general eye colors

## 🖼️ Logos

### logo Options
```json
{
  "data": "base64_encoded_image",
  "size_percentage": 20,          // 5-30% of QR size
  "padding": 5,                   // Pixels
  "background": "#FFFFFF",        // Optional
  "shape": "square|circle|rounded_square"
}
```

### Logo Guidelines
- Maximum 30% of QR area
- Use high error correction (H) with logos
- White background improves scanning
- Centered automatically

## 🖽 Frames

### frame Options
```json
{
  "frame_type": "simple|rounded|bubble|speech|badge",
  "text": "Scan Me!",
  "color": "#000000",
  "text_position": "top|bottom|left|right"
}
```

### Frame Types
- **simple**: Basic rectangular frame
- **rounded**: Rounded corners
- **bubble**: Speech bubble style
- **speech**: Comic speech bubble
- **badge**: Badge/label style

## 📝 Complete Request Examples

### Basic QR with Custom Eyes
```json
{
  "data": "https://example.com",
  "options": {
    "error_correction": "H",
    "customization": {
      "eye_border_style": "rounded_square",
      "eye_center_style": "circle",
      "data_pattern": "dots",
      "colors": {
        "foreground": "#000000",
        "background": "#FFFFFF"
      }
    }
  }
}
```

### Advanced with Gradient and Effects
```json
{
  "data": "https://example.com",
  "options": {
    "error_correction": "H",
    "customization": {
      "eye_border_style": "quarter_round",
      "eye_center_style": "star",
      "data_pattern": "circular",
      "gradient": {
        "enabled": true,
        "gradient_type": "radial",
        "colors": ["#FF0066", "#6600FF", "#0066FF"],
        "apply_to_eyes": true,
        "apply_to_data": true,
        "stroke_style": {
          "enabled": true,
          "color": "#FFFFFF",
          "width": 0.1,
          "opacity": 0.3
        }
      },
      "effects": [
        {
          "type": "glow",
          "intensity": 30,
          "color": "#0066FF"
        }
      ]
    }
  }
}
```

### Complete with Logo and Frame
```json
{
  "data": "https://example.com",
  "options": {
    "error_correction": "H",
    "customization": {
      "eye_border_style": "thick_border",
      "eye_center_style": "diamond",
      "data_pattern": "rounded",
      "colors": {
        "foreground": "#1A1A1A",
        "background": "#FFFFFF"
      },
      "logo": {
        "data": "data:image/png;base64,iVBORw0KG...",
        "size_percentage": 25,
        "padding": 8,
        "shape": "circle"
      },
      "frame": {
        "frame_type": "badge",
        "text": "SCAN FOR MENU",
        "color": "#1A1A1A",
        "text_position": "bottom"
      }
    }
  }
}
```

### Instagram Style with Purple Eyes
```json
{
  "data": "https://instagram.com/myprofile",
  "options": {
    "error_correction": "M",
    "customization": {
      "eye_border_style": "rounded_square",
      "eye_center_style": "rounded_square",
      "data_pattern": "dots",
      "colors": {
        "foreground": "#000000",
        "background": "#FFFFFF",
        "eye_colors": {
          "outer": "#833AB4",  // Instagram purple
          "inner": "#833AB4"   // Instagram purple
        }
      }
    }
  }
}
```

### Rainbow Eyes Example
```json
{
  "data": "https://pride.example.com",
  "options": {
    "error_correction": "H",
    "customization": {
      "eye_shape": "circle",
      "data_pattern": "dots",
      "colors": {
        "foreground": "#000000",
        "background": "#FFFFFF",
        "eye_colors": {
          "per_eye": {
            "top_left": {
              "outer": "#FF0000",    // Red
              "inner": "#FF6666"
            },
            "top_right": {
              "outer": "#00FF00",    // Green
              "inner": "#66FF66"
            },
            "bottom_left": {
              "outer": "#0000FF",    // Blue
              "inner": "#6666FF"
            }
          }
        }
      }
    }
  }
}
```

## 💡 Best Practices

### Gradient Borders Usage
- **When to enable**: Complex gradients with multiple colors or low contrast
- **When to disable**: Simple gradients or high contrast designs
- **Optimal settings**: `width: 0.1-0.2`, `opacity: 0.3-0.5` for balance between visibility and scannability
- **Color choice**: White (`#FFFFFF`) for dark gradients, black (`#000000`) for light gradients

### Scannability Guidelines
- Test QR codes with different devices and lighting conditions
- Gradients with borders maintain better scannability on mobile devices
- Avoid excessive width values (`>0.5`) which can interfere with scanning
- Consider error correction level 'H' when using gradient borders with complex designs

## 🔍 Validation Notes

1. **Backend Validation**: All options are validated using Zod schemas
2. **Case Sensitivity**: Use snake_case (not camelCase)
3. **Enum Values**: Must match exactly as listed above
4. **Color Format**: Hex colors must include # and be 6 characters
5. **Percentages**: Logo size 5-30%, effect intensity 0-100
6. **Stroke Style**: Width range 0.1-2.0, opacity range 0.1-1.0

## 🚀 Performance Considerations

- Basic QR: ~1ms generation time
- With gradients: ~2-3ms
- With effects: ~3-5ms
- With logo: ~5-10ms (depending on size)
- Full customization: ~10-15ms

## 📊 Response Structure

### Enhanced Endpoint Response
```json
{
  "success": true,
  "data": {
    "paths": {
      "data": "M13 4h7v1H13z...",
      "eyes": [
        {
          "type": "top_left",
          "border_path": "M4 4h7v7H4z...",  // Outer frame
          "center_path": "M5 5h5v5H5z...",  // Inner center
          "border_shape": "rounded_square",
          "center_shape": "circle"
        }
      ]
    },
    "styles": {
      "data": {
        "fill": "url(#gradient_data)",
        "effects": ["shadow_1"],
        "stroke": { /* if enabled */ }
      },
      "eyes": {
        "fill": "url(#gradient_eyes)",
        "effects": []
      }
    },
    "definitions": [
      /* Gradient and effect definitions */
    ],
    "overlays": {
      "logo": { /* if present */ },
      "frame": { /* if present */ }
    },
    "metadata": {
      "generation_time_ms": 12,
      "quiet_zone": 4,
      "total_modules": 45,
      "data_modules": 37,
      "version": 5,
      "error_correction": "H"
    }
  }
}
```

## 🔄 Migration from v2

Key differences from v2:
1. Use `eye_border_style` + `eye_center_style` instead of `eye_shape`
2. All options use snake_case (not camelCase)
3. Response is structured JSON, not SVG string
4. Enhanced endpoint supports all advanced features
5. No authentication required (v3 is free)

---

**Note**: This document is the authoritative source for QR v3 customization options. Always refer to this when implementing or documenting QR features.