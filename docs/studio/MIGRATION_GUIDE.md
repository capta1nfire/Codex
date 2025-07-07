# 🔄 QR Studio Migration Guide

This guide helps you migrate from the existing QR generation system to the new QR Studio configuration system.

## Overview

QR Studio introduces a centralized configuration management system that provides:
- Consistent QR code styling across your application
- Template-based configurations for different QR code types
- Real-time synchronization of configuration changes
- Gradual rollout from SUPERADMIN to Premium users

## Migration Timeline

### Phase 1: SUPERADMIN Only (Current)
- Full access to Studio features
- Testing and refinement of the system
- No impact on existing users

### Phase 2: Premium Users (Future)
- Read-only access to templates
- Limited customization options
- Gradual feature rollout

### Phase 3: General Availability (Future)
- Basic template access for all users
- Premium features remain exclusive
- Full deprecation of old system

## Before You Begin

1. **Backup your data**: Export your existing QR configurations
2. **Test in development**: Verify migrations in a non-production environment
3. **Review permissions**: Ensure proper role assignments

## Migration Steps

### Step 1: Update Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Step 2: Run Database Migrations

```bash
cd backend
npx prisma migrate deploy
```

This creates the new `StudioConfig` table and enum types.

### Step 3: Import Existing Configurations

If you have existing QR configurations, use this script to migrate them:

```javascript
// backend/src/scripts/migrateToStudio.ts
import prisma from '../lib/prisma.js';
import { StudioConfigType } from '@prisma/client';

async function migrateExistingConfigs() {
  // Example: Migrate existing placeholder config
  const existingPlaceholder = {
    eye_shape: 'square',
    data_pattern: 'dots',
    colors: {
      foreground: '#000000',
      background: '#FFFFFF',
    },
  };

  await prisma.studioConfig.create({
    data: {
      type: StudioConfigType.PLACEHOLDER,
      name: 'Legacy Placeholder',
      description: 'Migrated from old system',
      config: existingPlaceholder,
      createdById: 'system-migration',
    },
  });

  console.log('Migration completed');
}

migrateExistingConfigs().catch(console.error);
```

### Step 4: Update API Calls

#### Old System
```typescript
// Direct QR generation
const response = await fetch('/api/v3/qr/generate', {
  method: 'POST',
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      error_correction: 'H',
      customization: {
        eye_shape: 'circle',
        data_pattern: 'dots',
      },
    },
  }),
});
```

#### New System with Studio
```typescript
// Get effective configuration first
const configResponse = await fetch('/api/studio/effective-config/url');
const { config } = await configResponse.json();

// Generate QR with Studio config
const response = await fetch('/api/v3/qr/generate', {
  method: 'POST',
  body: JSON.stringify({
    data: 'https://example.com',
    options: {
      error_correction: config.error_correction || 'H',
      customization: config,
    },
  }),
});
```

### Step 5: Update Frontend Components

#### Using StudioProvider
```tsx
// Wrap your app with StudioProvider
import { StudioProvider } from '@/components/studio/StudioProvider';

export default function App() {
  return (
    <StudioProvider>
      <YourApp />
    </StudioProvider>
  );
}
```

#### Accessing Studio Configurations
```tsx
import { useStudio } from '@/components/studio/StudioProvider';

function QRGenerator() {
  const { getConfigByType } = useStudio();
  
  const generateQR = async (templateType: string) => {
    // Get template-specific config
    const config = getConfigByType('TEMPLATE', templateType);
    
    // Use config for generation
    // ...
  };
}
```

### Step 6: Enable WebSocket Synchronization

```typescript
import { useStudioWebSocket } from '@/hooks/useStudioWebSocket';

function StudioEnabledComponent() {
  const { isConnected } = useStudioWebSocket({
    onConfigUpdate: (update) => {
      console.log('Config updated:', update);
      // Refresh your UI
    },
  });
  
  return (
    <div>
      {isConnected && <span>Studio Sync Active</span>}
    </div>
  );
}
```

## Configuration Mapping

### Old Format → New Format

```javascript
// Old customization format
{
  error_correction: 'H',
  customization: {
    eye_shape: 'circle',
    data_pattern: 'dots',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
    },
  },
}

// New Studio format
{
  error_correction: 'H',
  eye_shape: 'circle',
  data_pattern: 'dots',
  colors: {
    foreground: '#000000', // was 'primary'
    background: '#FFFFFF', // was 'secondary'
  },
}
```

## Permission System Migration

### Current System
```typescript
// Simple role check
if (user.role === 'WEBADMIN' || user.role === 'SUPERADMIN') {
  // Allow access
}
```

### Studio System
```typescript
// Extensible permission system
const studioPermissions = {
  SUPERADMIN: {
    read: true,
    write: true,
    delete: true,
    reset: true,
  },
  PREMIUM: {
    read: true,
    write: false, // Will be true in Phase 2
    delete: false,
    reset: false,
  },
  USER: {
    read: false,
    write: false,
    delete: false,
    reset: false,
  },
};

function hasStudioAccess(user: User, action: string) {
  return studioPermissions[user.role]?.[action] || false;
}
```

## Testing Your Migration

### 1. Verify Database Schema
```sql
-- Check if StudioConfig table exists
SELECT * FROM "StudioConfig" LIMIT 1;

-- Check enum types
SELECT unnest(enum_range(NULL::StudioConfigType));
```

### 2. Test API Endpoints
```bash
# Test configuration retrieval
curl -X GET http://localhost:3004/api/studio/configs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test configuration creation
curl -X POST http://localhost:3004/api/studio/configs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PLACEHOLDER",
    "name": "Test Migration",
    "config": {
      "eye_shape": "square",
      "data_pattern": "dots"
    }
  }'
```

### 3. Verify WebSocket Connection
```javascript
// Test WebSocket in browser console
const socket = io('/studio', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connected', (data) => {
  console.log('WebSocket connected:', data);
});

socket.emit('request:sync');
socket.on('sync:complete', (data) => {
  console.log('Configs synced:', data.configs);
});
```

## Rollback Plan

If you need to rollback:

1. **Disable Studio routes**:
```javascript
// Temporarily comment out in backend/src/app.ts
// app.use('/api/studio', studioRoutes);
```

2. **Revert database**:
```bash
npx prisma migrate reset --to [previous-migration]
```

3. **Restore old configuration**:
Revert to your backed-up configuration system.

## Common Issues

### Issue: "StudioConfig table not found"
**Solution**: Run database migrations
```bash
npx prisma migrate deploy
```

### Issue: "Unauthorized" errors
**Solution**: Ensure user has SUPERADMIN role
```sql
UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'admin@example.com';
```

### Issue: WebSocket not connecting
**Solution**: Check CORS and authentication
```javascript
// Verify JWT token is valid
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
```

### Issue: Configurations not persisting
**Solution**: Check Redis connection
```bash
redis-cli ping
# Should return: PONG
```

## Best Practices

1. **Gradual Migration**: Don't migrate all configs at once
2. **Test Thoroughly**: Verify each template type works correctly
3. **Monitor Performance**: Watch for any degradation
4. **Keep Backups**: Always backup before major changes
5. **Document Changes**: Track what was migrated and when

## Support

For migration assistance:
- Check `/docs/studio/TROUBLESHOOTING.md`
- Review API documentation: `/docs/studio/API_DOCUMENTATION.md`
- Contact: studio-support@codex.com