# QR Engine v2 API Reference

## Base URL

```
Production: https://api.codexqr.com
Development: http://localhost:3004
```

## Authentication

All endpoints require authentication via Bearer token or API key:

```http
Authorization: Bearer <token>
X-API-Key: <api-key>
```

## Endpoints

### Generate QR Code

```http
POST /api/qr/generate
```

Generate a QR code with advanced customization options.

#### Request Body

```json
{
  "data": "string",
  "options": {
    "size": 300,
    "margin": 4,
    "errorCorrection": "M",
    "eyeShape": "rounded-square",
    "dataPattern": "dots",
    "foregroundColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "eyeColor": "#000000",
    "gradient": {
      "type": "linear",
      "colors": ["#000000", "#0000FF"],
      "angle": 45,
      "stroke_style": {
        "enabled": true,
        "color": "#FFFFFF",
        "width": 0.1,
        "opacity": 0.3
      }
    },
    "logo": {
      "data": "base64string",
      "size": 20,
      "padding": 2,
      "backgroundColor": "#FFFFFF"
    },
    "frame": {
      "style": "rounded",
      "color": "#000000",
      "width": 2,
      "text": "Scan Me",
      "textPosition": "bottom"
    },
    "effects": [
      {
        "type": "shadow",
        "intensity": 50,
        "color": "#000000"
      }
    ],
    "optimizeForSize": false,
    "enableCache": true
  }
}
```

#### Response

```json
{
  "success": true,
  "svg": "<svg>...</svg>",
  "metadata": {
    "version": 3,
    "modules": 29,
    "errorCorrection": "M",
    "dataCapacity": 19,
    "processingTimeMs": 3
  },
  "performance": {
    "processingTimeMs": 3,
    "engineVersion": "2.0.0",
    "cached": false
  }
}
```

### Batch Generation

```http
POST /api/qr/batch
```

Generate multiple QR codes in a single request.

#### Request Body

```json
{
  "codes": [
    {
      "data": "https://example1.com",
      "options": { "eyeShape": "circle" }
    },
    {
      "data": "https://example2.com",
      "options": { "eyeShape": "dot" }
    }
  ],
  "options": {
    "maxConcurrent": 10,
    "includeMetadata": true,
    "stopOnError": false
  }
}
```

#### Response

```json
{
  "success": true,
  "results": [
    {
      "id": "0",
      "success": true,
      "svg": "<svg>...</svg>",
      "metadata": { ... }
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "totalTimeMs": 15,
    "averageTimeMs": 7.5
  }
}
```

### Preview QR Code

```http
GET /api/qr/preview
```

Generate a preview QR code without authentication.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| data | string | Required. The data to encode |
| eyeShape | string | Eye shape style |
| dataPattern | string | Data module pattern |
| fgColor | string | Foreground color (hex) |
| bgColor | string | Background color (hex) |
| size | number | Size in pixels (100-500) |

#### Response

Returns SVG image directly with `Content-Type: image/svg+xml`

### Validate QR Data

```http
POST /api/qr/validate
```

Validate QR data and options before generation.

#### Request Body

Same as generate endpoint.

#### Response

```json
{
  "success": true,
  "valid": true,
  "details": {
    "dataLength": 19,
    "estimatedVersion": 3,
    "errorCorrectionCapacity": 0.15,
    "logoImpact": 0.2
  },
  "suggestions": [
    "Consider using error correction level 'H' with logo",
    "Data length is optimal for version 3"
  ]
}
```

## Options Reference

### Eye Shapes
- `square` - Classic square eyes
- `rounded-square` - Rounded square corners
- `circle` - Circular eyes
- `dot` - Single dot eyes
- `leaf` - Leaf-shaped eyes
- `bars-horizontal` - Horizontal bars
- `bars-vertical` - Vertical bars
- `star` - Star-shaped eyes
- `diamond` - Diamond eyes
- `cross` - Cross pattern
- `hexagon` - Hexagonal eyes
- `heart` - Heart-shaped eyes
- `shield` - Shield pattern
- `crystal` - Crystal pattern
- `flower` - Flower pattern
- `arrow` - Arrow indicators
- `custom` - Custom SVG path

### Data Patterns
- `square` - Classic squares
- `dots` - Circular dots
- `rounded` - Rounded squares
- `vertical` - Vertical lines
- `horizontal` - Horizontal lines
- `diamond` - Diamond shapes
- `circular` - Circular pattern
- `star` - Star pattern
- `cross` - Cross pattern
- `random` - Random variations
- `wave` - Wave pattern
- `mosaic` - Mosaic tiles

### Frame Styles
- `simple` - Basic frame
- `rounded` - Rounded corners
- `bubble` - Speech bubble
- `speech` - Speech balloon
- `badge` - Badge style

### Visual Effects
- `shadow` - Drop shadow
- `glow` - Glow effect
- `blur` - Background blur
- `noise` - Texture noise
- `vintage` - Vintage filter

### Gradient Types
- `linear` - Linear gradient
- `radial` - Radial gradient
- `diagonal` - Diagonal gradient
- `conical` - Conical gradient

### Error Correction Levels
- `L` - Low (7% recovery)
- `M` - Medium (15% recovery)
- `Q` - Quartile (25% recovery)
- `H` - High (30% recovery)

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid input parameters |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 413 | Data too long for QR code |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | QR Engine service unavailable |

## Rate Limits

| Plan | Limit |
|------|-------|
| Free | 100 requests/hour |
| Premium | 1,000 requests/hour |
| Enterprise | 10,000 requests/hour |

## Code Examples

### JavaScript/TypeScript

```typescript
// Basic generation
const response = await fetch('https://api.codexqr.com/api/qr/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      eyeShape: 'rounded-square',
      gradient: {
        type: 'linear',
        colors: ['#000000', '#0000FF']
      }
    }
  })
});

const result = await response.json();
console.log(result.svg);
```

### Python

```python
import requests

response = requests.post(
    'https://api.codexqr.com/api/qr/generate',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'data': 'https://example.com',
        'options': {
            'eyeShape': 'circle',
            'dataPattern': 'dots'
        }
    }
)

result = response.json()
print(result['svg'])
```

### cURL

```bash
curl -X POST https://api.codexqr.com/api/qr/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://example.com",
    "options": {
      "size": 400,
      "eyeShape": "rounded-square"
    }
  }'
```

## QR v3 API (New)

### Generate QR Code (Structured Data)

```http
POST /api/v3/qr/generate
```

Generate a QR code returning structured JSON data for secure frontend rendering.

#### Request Body

```json
{
  "data": "string",           // Required: Data to encode
  "options": {
    "error_correction": "L"   // Optional: L, M, Q, H (default: M)
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "path_data": "M4 4h1v1H4z...",     // SVG path commands
    "total_modules": 45,               // Total size including quiet zone
    "data_modules": 37,                // QR data matrix size
    "version": 5,                      // QR version (1-40)
    "error_correction": "M",           // Error correction level
    "metadata": {
      "generation_time_ms": 1,
      "quiet_zone": 4,
      "content_hash": "sha256..."
    }
  },
  "metadata": {
    "engine_version": "3.0.0",
    "cached": false,
    "processing_time_ms": 14
  }
}
```

#### Key Differences from v2

- Returns JSON data instead of SVG string
- No `dangerouslySetInnerHTML` required
- 50% smaller response size
- Perfect dynamic scaling with viewBox
- Enhanced security (no XSS risk)

#### Example Usage

```javascript
const response = await fetch('/api/v3/qr/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      error_correction: 'H'
    }
  })
});

const result = await response.json();

// Render securely in React
<svg viewBox={`4 4 ${result.data.data_modules} ${result.data.data_modules}`} 
     width="300" height="300">
  <path d={result.data.path_data} fill="#000000" />
</svg>
```

## Enterprise URL Validation API

### Validate URL (Enterprise-Grade)

```http
POST /api/validate
```

Enterprise-grade URL validation that can bypass advanced anti-bot systems like CloudFlare, Amazon, and Shopify. Features multi-layer validation with realistic browser fingerprinting.

#### Request Body

```json
{
  "url": "string",              // Required: URL to validate
  "forceRefresh": false,        // Optional: Skip cache
  "timeout": 10000              // Optional: Timeout in ms (1000-30000)
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "exists": true,
    "accessible": true,
    "title": "Amazon.com. Spend less. Smile more.",
    "description": "Free shipping on millions of items...",
    "favicon": "https://amazon.com/favicon.ico",
    "statusCode": 200,
    "responseTime": 1923,
    "redirectUrl": "https://amazon.com",
    "lastModified": "Wed, 26 Jun 2025 14:20:15 GMT",
    "server": "Server",
    "cached": false,
    "validationMethod": "enhanced",
    "attempts": 1,
    "debugInfo": {}
  }
}
```

#### Validation Methods

- `stealth` - Enterprise headers with TLS fingerprinting
- `enhanced` - Multiple strategies with progressive timeouts
- `behavioral` - Real browser behavior simulation
- `dns` - DNS-only fallback validation

#### Features

- **40+ realistic browser headers** per request
- **TLS fingerprinting** matching real browsers
- **Domain-specific browser selection** (Amazon → Chrome/Edge)
- **Behavioral patterns** (DNS prefetch, favicon requests)
- **Intelligent fallbacks** with 4 escalation levels
- **Redis caching** (60-300s TTL)
- **Rate limiting bypass** capabilities

### Validation Health Check

```http
GET /api/validate/health
```

Check validation service health and capabilities.

#### Response

```json
{
  "success": true,
  "status": "healthy",
  "capabilities": {
    "enterpriseValidation": true,
    "browserFingerprinting": true,
    "tlsFingerprinting": true,
    "behavioralSimulation": true,
    "multiLayerFallbacks": true,
    "caching": true
  },
  "testResult": {
    "url": "https://google.com",
    "exists": true,
    "method": "stealth",
    "responseTime": 498
  }
}
```

### Validation Statistics

```http
GET /api/validate/stats
```

Get validation service statistics and metrics.

#### Response

```json
{
  "success": true,
  "stats": {
    "cachedUrls": 0,
    "cacheKeyPattern": "url_validation:v3:*",
    "features": {
      "browserProfiles": 5,
      "headerTemplates": "40+",
      "fallbackLayers": 4,
      "tlsFingerprints": 3,
      "maxTimeout": 30000,
      "cacheTtl": "60-300s"
    }
  }
}
```

### Clear Validation Cache

```http
DELETE /api/validate/cache
```

Clear all cached validation results.

---
*Last updated: June 29, 2025 | Version 2.0.0 (v2) / 3.0.0 (v3) + Enterprise Validator*