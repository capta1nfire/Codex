# QR Engine v2 Migration Guide

## Overview

This guide helps you migrate from the legacy QR generation system to the new QR Engine v2. The new engine offers significant performance improvements, advanced customization options, and better standards compliance.

## Key Differences

### Performance
- **Old**: 20-50ms per QR code
- **New**: 2-5ms per QR code (10x faster)

### Features
- **Old**: Basic QR generation with limited customization
- **New**: 17 eye shapes, 12 data patterns, gradients, logos, frames, effects

### API Changes
- **Old**: `/api/generate` with `barcode_type: "qrcode"`
- **New**: `/api/qr/generate` with dedicated QR options

## Migration Steps

### 1. Update API Endpoints

#### Basic Generation
```javascript
// Old
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barcode_type: 'qrcode',
    data: 'https://example.com',
    options: {
      scale: 4,
      margin: 2
    }
  })
});

// New
const response = await fetch('/api/qr/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      size: 400,  // pixels instead of scale
      margin: 4   // consistent margin
    }
  })
});
```

#### Advanced Customization
```javascript
// New features not available in old system
const response = await fetch('/api/qr/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      size: 400,
      eyeShape: 'rounded-square',
      dataPattern: 'dots',
      gradient: {
        type: 'linear',
        colors: ['#000000', '#0000FF'],
        angle: 45
      },
      logo: {
        data: base64Logo,
        size: 20,
        padding: 2
      },
      frame: {
        style: 'rounded',
        text: 'Scan Me!'
      }
    }
  })
});
```

### 2. Update Response Handling

#### Response Structure
```javascript
// Old response
{
  success: true,
  svgString: '<svg>...</svg>'
}

// New response
{
  success: true,
  svg: '<svg>...</svg>',
  metadata: {
    version: 3,
    modules: 29,
    errorCorrection: 'M',
    dataCapacity: 19,
    processingTimeMs: 3
  },
  performance: {
    processingTimeMs: 3,
    engineVersion: '2.0.0',
    cached: false
  }
}
```

### 3. Batch Processing

The new batch endpoint is optimized for QR codes:

```javascript
// Old batch (generic)
const response = await fetch('/api/generate/batch', {
  method: 'POST',
  body: JSON.stringify({
    barcodes: [
      { barcode_type: 'qrcode', data: 'test1' },
      { barcode_type: 'qrcode', data: 'test2' }
    ]
  })
});

// New batch (QR-specific)
const response = await fetch('/api/qr/batch', {
  method: 'POST',
  body: JSON.stringify({
    codes: [
      { data: 'test1', options: { eyeShape: 'circle' } },
      { data: 'test2', options: { eyeShape: 'dot' } }
    ],
    options: {
      maxConcurrent: 10,
      includeMetadata: true
    }
  })
});
```

### 4. Error Handling

The new engine provides more detailed error information:

```javascript
try {
  const response = await fetch('/api/qr/generate', { ... });
  const result = await response.json();
  
  if (!response.ok) {
    // New detailed error format
    console.error('QR generation failed:', result.error);
    console.error('Details:', result.details);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Feature Mapping

| Old Feature | New Feature | Notes |
|------------|-------------|-------|
| `scale` | `size` | Now in pixels for precision |
| `margin` | `margin` | Same, but more consistent |
| `fgcolor` | `foregroundColor` | Full HEX format required |
| `bgcolor` | `backgroundColor` | Full HEX format required |
| N/A | `eyeShape` | 17 new options |
| N/A | `dataPattern` | 12 new options |
| N/A | `gradient` | 4 gradient types |
| N/A | `logo` | Smart logo integration |
| N/A | `frame` | 5 frame styles |
| N/A | `effects` | Visual effects |

## Validation Endpoint

Use the new validation endpoint to check your QR data before generation:

```javascript
const validation = await fetch('/api/qr/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: yourData,
    options: yourOptions
  })
});

const result = await validation.json();
if (!result.valid) {
  console.log('Suggestions:', result.suggestions);
}
```

## Preview Endpoint

For real-time previews without authentication:

```javascript
const previewUrl = new URL('/api/qr/preview', window.location.origin);
previewUrl.searchParams.set('data', 'https://example.com');
previewUrl.searchParams.set('eyeShape', 'rounded-square');
previewUrl.searchParams.set('fgColor', '#000000');

// Use directly in img tag
<img src={previewUrl.toString()} alt="QR Preview" />
```

## Best Practices

1. **Use Validation**: Always validate complex QR configurations
2. **Cache Results**: The new engine supports caching
3. **Batch Operations**: Use batch endpoint for multiple QRs
4. **Error Correction**: Choose appropriate level (L/M/Q/H)
5. **Logo Size**: Keep logos under 30% of QR size
6. **Color Contrast**: Ensure WCAG compliance (4.5:1 ratio)

## Deprecation Timeline

- **Phase 1** (Current): Both endpoints available
- **Phase 2** (3 months): Old endpoint marked deprecated
- **Phase 3** (6 months): Old endpoint removed

## Support

For migration assistance:
- Check the [API Reference](./api-reference.md)
- Review [examples](./examples/)
- Contact support for complex migrations

---
*Last updated: June 2025*