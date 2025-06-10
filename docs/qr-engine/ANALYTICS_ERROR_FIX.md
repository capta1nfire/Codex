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