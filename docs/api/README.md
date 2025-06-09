# API Documentation

## Overview

The CODEX API is a comprehensive platform for generating QR codes and barcodes, designed to be fast, scalable, and easy to use.

### Architecture
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for performance optimization
- **Generation**: High-performance Rust service
- **Authentication**: JWT + API Keys
- **Monitoring**: Prometheus + Grafana + Sentry

## Quick Links

- **[Authentication](./authentication.md)** - JWT tokens and API keys
- **[Endpoints](./endpoints.md)** - Complete API reference
- **[Examples](./examples.md)** - Code examples in multiple languages
- **[Rate Limits](./rate-limits.md)** - Usage limits and quotas
- **[Error Codes](./error-codes.md)** - Error handling guide

## Base URL

```
Production: https://api.codexqr.com
Development: http://localhost:3001
```

## Headers

### Required Headers
```http
Content-Type: application/json
```

### Authentication Headers
```http
# JWT Token
Authorization: Bearer <token>

# API Key
X-API-Key: <api-key>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid barcode type",
    "details": [
      {
        "field": "barcode_type",
        "message": "Must be one of: qr, code128, ean13"
      }
    ]
  }
}
```

## Available Services

### 1. QR Code Generation
- Multiple QR code types
- Custom styling options
- Logo embedding
- Batch processing

### 2. Barcode Generation
- Support for 15+ barcode formats
- Industrial standards compliance
- High-resolution output

### 3. User Management
- Profile management
- API key generation
- Usage tracking

### 4. Analytics
- Generation statistics
- Performance metrics
- Usage reports