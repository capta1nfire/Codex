# 📚 **CODEX API - Documentación Completa**

## 🚀 **Introducción**

La API de Codex es una plataforma completa para la generación de códigos QR y códigos de barras, diseñada para ser rápida, escalable y fácil de usar.

### 🏗️ **Arquitectura**
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL con Prisma ORM
- **Caché**: Redis para optimización de performance
- **Generación**: Servicio Rust de alta performance
- **Autenticación**: JWT + API Keys
- **Monitoreo**: Prometheus + Grafana + Sentry

---

## 🔐 **Autenticación**

### **Métodos Soportados**

1. **JWT Bearer Token** (usuarios registrados)
2. **API Key** (integración programática)
3. **Sin autenticación** (límites restrictivos)

### **Obtener JWT Token**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "tu_contraseña"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "user"
  }
}
```

### **Generar API Key**

```bash
POST /api/auth/api-key
Authorization: Bearer YOUR_JWT_TOKEN
```

**Respuesta:**
```json
{
  "success": true,
  "apiKey": "ck_123456789abcdef..."
}
```

---

## 📱 **Generación de Códigos**

### **Endpoint Principal**

```
POST /api/generate
```

### **Parámetros**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `barcode_type` | string | ✅ | Tipo de código a generar |
| `data` | string | ✅ | Datos a codificar |
| `options` | object | ❌ | Opciones adicionales |

### **Tipos de Códigos Soportados**

- `qrcode` - Códigos QR
- `code128` - Código de barras Code 128
- `ean13` - Código de barras EAN-13
- `ean8` - Código de barras EAN-8
- `code39` - Código de barras Code 39
- `datamatrix` - DataMatrix

---

## 🎯 **Ejemplos Prácticos**

### **1. Generar QR Code Simple**

```bash
curl -X POST https://api.codex.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "qrcode",
    "data": "https://ejemplo.com"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "svgString": "<svg xmlns=\"http://www.w3.org/2000/svg\"...",
  "format": "svg",
  "size": "200x200"
}
```

### **2. QR Code con Opciones Avanzadas**

```bash
curl -X POST https://api.codex.com/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "barcode_type": "qrcode",
    "data": "https://ejemplo.com/producto/123",
    "options": {
      "scale": 8,
      "border": 2,
      "color": "#000000",
      "background": "#FFFFFF",
      "error_correction": "M"
    }
  }'
```

### **3. Código de Barras EAN-13**

```bash
curl -X POST https://api.codex.com/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "barcode_type": "ean13",
    "data": "1234567890123",
    "options": {
      "show_text": true,
      "font_size": 12
    }
  }'
```

### **4. DataMatrix para Trazabilidad**

```bash
curl -X POST https://api.codex.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "datamatrix",
    "data": "LOT:2024-001|EXP:2025-12-31|SN:ABC123",
    "options": {
      "size": 300
    }
  }'
```

---

## 👥 **Gestión de Usuarios**

### **Registro de Usuario**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "nuevo@ejemplo.com",
  "password": "contraseña_segura",
  "firstName": "María",
  "lastName": "García"
}
```

### **Obtener Perfil**

```bash
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Subir Avatar**

```bash
POST /api/avatars/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

--form 'avatar=@"/ruta/a/imagen.jpg"'
```

---

## 📊 **Rate Limiting**

### **Límites por Tipo de Usuario**

| Tipo de Usuario | Requests/15min | Generación/hora |
|-----------------|----------------|-----------------|
| **Sin autenticar** | 100 | 20 |
| **Usuario registrado** | 300 | 50 |
| **Usuario premium** | 500 | 200 |
| **Administrador** | 1000 | 1000 |
| **API Key** | 1000 | 1000 |

### **Headers de Rate Limiting**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## 🚨 **Manejo de Errores**

### **Códigos de Estado**

| Código | Descripción |
|--------|-------------|
| `200` | Éxito |
| `400` | Error en la solicitud |
| `401` | No autorizado |
| `403` | Prohibido |
| `404` | No encontrado |
| `429` | Límite de rate exceeded |
| `500` | Error del servidor |

### **Formato de Error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El tipo de código no es válido",
    "suggestion": "Usa uno de: qrcode, code128, ean13, ean8, code39, datamatrix"
  }
}
```

---

## 🌐 **SDKs y Ejemplos**

### **JavaScript/Node.js**

```javascript
import { api } from './lib/api';

// Generar QR Code
const result = await api.post('/api/generate', {
  barcode_type: 'qrcode',
  data: 'https://ejemplo.com'
});

console.log(result.svgString);
```

### **Python**

```python
import requests

response = requests.post('https://api.codex.com/api/generate', 
  headers={'Content-Type': 'application/json'},
  json={
    'barcode_type': 'qrcode',
    'data': 'https://ejemplo.com'
  }
)

result = response.json()
print(result['svgString'])
```

### **PHP**

```php
<?php
$data = [
    'barcode_type' => 'qrcode',
    'data' => 'https://ejemplo.com'
];

$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents('https://api.codex.com/api/generate', false, $context);
$response = json_decode($result, true);

echo $response['svgString'];
?>
```

---

## 📈 **Monitoreo y Métricas**

### **Health Check**

```bash
GET /health/status
```

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "rust_generator": "online"
  },
  "uptime": "72h"
}
```

### **Métricas Prometheus**

```bash
GET /metrics
```

---

## 🔧 **Casos de Uso Comunes**

### **E-commerce**
- Códigos QR para productos
- Códigos de barras para inventario
- Códigos de seguimiento

### **Eventos**
- QR codes para tickets
- Códigos de acceso
- Información de contacto

### **Restaurantes**
- Menús digitales (QR)
- Códigos de mesa
- Ofertas especiales

### **Logística**
- Etiquetas de envío
- Trazabilidad de productos
- Control de calidad

---

## 🎛️ **Configuración Avanzada**

### **Variables de Entorno**

```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/codex
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
SENTRY_DSN=https://your-sentry-dsn

# Frontend
NEXT_PUBLIC_BACKEND_URL=https://api.codex.com
```

### **Opciones de QR Code**

```json
{
  "scale": 1-40,           // Tamaño del módulo
  "border": 0-20,          // Borde en módulos
  "color": "#RRGGBB",      // Color del código
  "background": "#RRGGBB", // Color de fondo
  "error_correction": "L|M|Q|H" // Nivel de corrección
}
```

---

## 📞 **Soporte**

- **Documentación Interactiva**: `/api-docs`
- **GitHub**: https://github.com/codex-project
- **Email**: soporte@codexproject.com
- **Discord**: https://discord.gg/codex

---

## 📄 **Licencia**

MIT License - Ver `LICENSE` para más detalles. 