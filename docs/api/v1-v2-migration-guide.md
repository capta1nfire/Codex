# API v1/v2 Migration Guide

## Overview
As of January 2025, CODEX has restructured its API endpoints to provide clearer versioning and better separation between legacy and new engines.

> **Technical Deep Dive**: For detailed information about the challenges and solutions during this migration, see [Endpoint Restructuring Challenges](../technical/endpoint-restructuring-challenges-20250614.md).

## New Endpoint Structure

### API v2 - QR Engine (Recommended)
High-performance QR code generation with advanced features:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/qr/generate` | POST | Generate QR code with v2 engine |
| `/api/v2/qr/batch` | POST | Batch QR generation |
| `/api/v2/qr/preview` | GET | Real-time QR preview |
| `/api/v2/qr/validate` | POST | Validate QR data |
| `/api/v2/qr/analytics` | GET | Performance analytics (auth required) |
| `/api/v2/qr/cache/stats` | GET | Cache statistics (auth required) |
| `/api/v2/qr/cache/clear` | POST | Clear cache (auth required) |

### API v1 - Legacy Barcodes
All barcode types including QR with legacy engine:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/barcode` | POST | Generate any barcode type |
| `/api/v1/barcode/batch` | POST | Batch barcode generation |

## Migration Timeline

### Phase 1 (Current - January 2025)
- New endpoints are active and recommended
- Legacy endpoints remain functional with deprecation headers
- All new implementations should use v1/v2 endpoints

### Phase 2 (March 2025)
- Legacy endpoints will log warnings
- Email notifications to API users about deprecation

### Phase 3 (June 2025)
- Legacy endpoints will be removed
- Only v1/v2 endpoints will be available

## Deprecation Headers

When using legacy endpoints, you'll receive these headers:
```
X-API-Deprecation: This endpoint is deprecated. Use /api/v2/qr instead.
X-API-Deprecation-Date: 2025-06-01
X-API-Alternative: /api/v2/qr
Sunset: Sat, 01 Jun 2025 00:00:00 GMT
```

## Migration Examples

### QR Code Generation

**Old (Deprecated):**
```javascript
// Using /api/generate
const response = await fetch('http://localhost:3004/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barcode_type: 'qrcode',
    data: 'https://example.com',
    options: { scale: 4 }
  })
});
```

**New (Recommended):**
```javascript
// Using /api/v2/qr/generate
const response = await fetch('http://localhost:3004/api/v2/qr/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      size: 400,
      errorCorrection: 'M',
      eyeShape: 'rounded',
      gradient: {
        type: 'linear',
        colors: ['#000000', '#666666']
      }
    }
  })
});
```

### Other Barcode Types

**Old (Deprecated):**
```javascript
// Using /api/generate
const response = await fetch('http://localhost:3004/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barcode_type: 'code128',
    data: '123456789',
    options: { scale: 2 }
  })
});
```

**New (Recommended):**
```javascript
// Using /api/v1/barcode
const response = await fetch('http://localhost:3004/api/v1/barcode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    barcode_type: 'code128',
    data: '123456789',
    options: { scale: 2 }
  })
});
```

## Frontend Integration

### Updated Hooks

The frontend hooks have been updated to use the new endpoints:

```typescript
// useBarcodeGenerationV2.ts
// QR codes automatically use v2 engine
// Other barcodes use v1 engine

import { useBarcodeGenerationV2 } from '@/hooks/useBarcodeGenerationV2';

const { generateBarcode } = useBarcodeGenerationV2();

// Automatically routes to correct endpoint based on type
await generateBarcode({
  barcode_type: 'qrcode',  // Goes to /api/v2/qr
  data: 'test'
});

await generateBarcode({
  barcode_type: 'code128', // Goes to /api/v1/barcode
  data: '123456'
});
```

### Direct API Usage

```typescript
import { api, generatorApi } from '@/lib/api';

// QR v2
const qrResult = await generatorApi.generateQRv2({
  data: 'https://example.com',
  options: { /* v2 options */ }
});

// Legacy barcodes
const barcodeResult = await generatorApi.generateCode({
  barcode_type: 'ean13',
  data: '1234567890123',
  options: { /* v1 options */ }
});
```

## Benefits of Migration

### For QR Codes (v2)
- 10x performance improvement (2-5ms vs 20-50ms)
- Advanced customization options
- Built-in caching
- Real-time preview
- Better error handling

### For API Structure
- Clear versioning
- Better separation of concerns
- Easier to maintain and evolve
- Gradual migration path

## Need Help?

- Check the [API Documentation](/docs/api/)
- Review the [QR Engine v2 Guide](/docs/qr-engine/)
- Contact support if you have questions

---

*Last updated: January 2025*