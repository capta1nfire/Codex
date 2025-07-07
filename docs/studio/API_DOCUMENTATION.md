# 📚 QR Studio API Documentation

## Overview

QR Studio provides a comprehensive REST API for managing QR code configurations. This API is currently restricted to SUPERADMIN users but is designed to be extensible for Premium users in the future.

## Base URL

```
https://api.codex.com/api/studio
```

## Authentication

All endpoints require JWT Bearer token authentication with SUPERADMIN role:

```http
Authorization: Bearer <jwt-token>
```

## Endpoints

### Get All Configurations

Retrieve all Studio configurations for the authenticated user.

```http
GET /api/studio/configs
```

#### Response

```json
{
  "configs": [
    {
      "id": "uuid",
      "type": "PLACEHOLDER",
      "name": "Default Placeholder",
      "description": "Standard placeholder configuration",
      "templateType": null,
      "config": {
        "eye_shape": "square",
        "data_pattern": "dots",
        "colors": {
          "foreground": "#000000",
          "background": "#FFFFFF"
        }
      },
      "isActive": true,
      "version": 1,
      "createdById": "user-id",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Get Configuration by Type

Retrieve a specific configuration by type and optional template type.

```http
GET /api/studio/configs/:type/:templateType?
```

#### Parameters

- `type` (required): One of `PLACEHOLDER`, `TEMPLATE`, or `GLOBAL`
- `templateType` (optional): Required for TEMPLATE type (e.g., `url`, `wifi`, `vcard`)

#### Examples

```http
GET /api/studio/configs/PLACEHOLDER
GET /api/studio/configs/TEMPLATE/url
GET /api/studio/configs/GLOBAL
```

#### Response

```json
{
  "config": {
    "id": "uuid",
    "type": "TEMPLATE",
    "name": "URL Template",
    "templateType": "url",
    "config": {
      "eye_shape": "rounded_square",
      "data_pattern": "dots",
      "colors": {
        "foreground": "#0066FF",
        "background": "#FFFFFF"
      },
      "gradient": {
        "enabled": true,
        "gradient_type": "linear",
        "colors": ["#0066FF", "#00CCFF"]
      }
    }
  }
}
```

### Create/Update Configuration

Create a new configuration or update an existing one.

```http
POST /api/studio/configs
```

#### Request Body

```json
{
  "type": "PLACEHOLDER",
  "name": "Custom Placeholder",
  "description": "Custom placeholder for testing",
  "templateType": null,
  "config": {
    "eye_shape": "circle",
    "data_pattern": "dots",
    "colors": {
      "foreground": "#FF0066",
      "background": "#FFFFFF"
    },
    "error_correction": "H"
  }
}
```

#### Validation Rules

- `type` is required and must be one of: `PLACEHOLDER`, `TEMPLATE`, `GLOBAL`
- `name` is required (min 1 character)
- `templateType` is required when `type` is `TEMPLATE`
- `config` must be a valid JSON object
- Colors must be valid hex codes
- `error_correction` must be one of: `L`, `M`, `Q`, `H`

#### Response

```json
{
  "config": {
    "id": "new-uuid",
    "version": 2,
    // ... rest of config
  },
  "message": "Configuración guardada exitosamente"
}
```

### Delete Configuration

Delete a specific configuration.

```http
DELETE /api/studio/configs/:id
```

#### Response

```json
{
  "message": "Configuración eliminada exitosamente"
}
```

### Reset to Defaults

Reset all configurations to system defaults.

```http
POST /api/studio/configs/reset
```

#### Response

```json
{
  "message": "Configuraciones reseteadas a valores por defecto"
}
```

### Apply to All Templates

Apply a configuration to all template types.

```http
POST /api/studio/configs/apply-all
```

#### Request Body

```json
{
  "config": {
    "colors": {
      "foreground": "#000000",
      "background": "#FFFFFF"
    },
    "error_correction": "H"
  }
}
```

#### Response

```json
{
  "message": "Configuración aplicada a todas las plantillas exitosamente"
}
```

### Get Effective Configuration

Get the merged configuration for a specific template type.

```http
GET /api/studio/effective-config/:templateType?
```

This endpoint merges configurations in the following order:
1. System defaults
2. Global configuration
3. Placeholder configuration (if no template type specified)
4. Template-specific configuration

#### Response

```json
{
  "config": {
    "eye_shape": "square",
    "data_pattern": "dots",
    "colors": {
      "foreground": "#000000",
      "background": "#FFFFFF"
    },
    "error_correction": "H"
  },
  "templateType": "url"
}
```

## WebSocket API

### Connection

Connect to the WebSocket server for real-time updates:

```javascript
const socket = io('/studio', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Client → Server

##### subscribe:config
Subscribe to configuration updates.

```javascript
socket.emit('subscribe:config', { 
  type: 'PLACEHOLDER',
  templateType: undefined // optional
});
```

##### request:sync
Request full configuration sync.

```javascript
socket.emit('request:sync');
```

#### Server → Client

##### connected
Confirmation of successful connection.

```javascript
socket.on('connected', (data) => {
  console.log(data.message); // "Connected to Studio WebSocket"
});
```

##### config:update
Real-time configuration updates.

```javascript
socket.on('config:update', (update) => {
  console.log(update.action); // 'create' | 'update' | 'delete'
  console.log(update.config); // Configuration object
  console.log(update.userId); // User who made the change
});
```

##### sync:complete
Full configuration sync response.

```javascript
socket.on('sync:complete', (data) => {
  console.log(data.configs); // Array of all configurations
});
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": {} // Optional additional information
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- SUPERADMIN: 1000 requests per 15 minutes
- Future Premium users: 500 requests per 15 minutes

## Configuration Object Schema

```typescript
interface StudioConfig {
  // Shape configurations
  eye_shape?: 'square' | 'circle' | 'rounded_square' | 'star' | 'hexagon';
  data_pattern?: 'square' | 'dots' | 'rounded' | 'star' | 'diamond';
  
  // Colors
  colors?: {
    foreground: string; // Hex color
    background: string; // Hex color
    eye_color?: string; // Optional different eye color
  };
  
  // Gradient (v3 engine)
  gradient?: {
    enabled: boolean;
    gradient_type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[]; // Array of hex colors
    angle?: number; // For linear gradients
  };
  
  // QR Code settings
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  margin?: number; // Quiet zone size
  
  // Advanced options
  boost_ecl?: boolean;
  min_version?: number;
  mask_pattern?: number;
}
```

## Examples

### cURL Examples

#### Get all configurations
```bash
curl -X GET https://api.codex.com/api/studio/configs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create placeholder configuration
```bash
curl -X POST https://api.codex.com/api/studio/configs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PLACEHOLDER",
    "name": "Modern Placeholder",
    "config": {
      "eye_shape": "circle",
      "data_pattern": "dots",
      "colors": {
        "foreground": "#FF0066",
        "background": "#FFFFFF"
      }
    }
  }'
```

### JavaScript/TypeScript Examples

#### Using Fetch API
```typescript
async function getStudioConfigs() {
  const response = await fetch('/api/studio/configs', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch configurations');
  }
  
  return response.json();
}
```

#### Using Axios
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.codex.com',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Get configuration
const { data } = await apiClient.get('/api/studio/configs/PLACEHOLDER');

// Update configuration
const { data } = await apiClient.post('/api/studio/configs', {
  type: 'TEMPLATE',
  name: 'WiFi Template',
  templateType: 'wifi',
  config: {
    eye_shape: 'rounded_square',
    colors: {
      foreground: '#00AA00',
      background: '#FFFFFF',
    },
  },
});
```

## Changelog

### v1.0.0 (2025-01-01)
- Initial release with SUPERADMIN-only access
- Support for PLACEHOLDER, TEMPLATE, and GLOBAL configurations
- WebSocket real-time synchronization
- Redis caching for performance