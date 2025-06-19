# Frontend V2 Migration Status

## Current Implementation

The frontend has been updated to use QR Engine v2 with the following changes:

### 1. Main Page (`page.tsx`)
- ✅ Using `useBarcodeGenerationV2` hook
- ✅ Imports `PreviewSectionV2` component
- ✅ Shows v2 badge when using v2 engine
- ✅ Feature flags integration
- ✅ Performance metrics display (when enabled)

### 2. API Client (`qr-engine-v2.ts`)
- ✅ Complete TypeScript client for v2 endpoints
- ✅ Fixed import to use `env` instead of `config`
- ✅ Uses correct backend URL from environment

### 3. Hooks
- ✅ `useQREngineV2.ts` - Direct v2 integration
- ✅ `useBarcodeGenerationV2.ts` - Automatic v1/v2 switching
- ✅ Migration utilities for backward compatibility

### 4. Components
- ✅ `PreviewSectionV2.tsx` - Enhanced preview with v2 indicators
- ✅ `FeatureFlagsPanel.tsx` - Dev tool for testing
- ✅ V2 badge component in main page

## How It Works

1. When generating a QR code:
   - The `useBarcodeGenerationV2` hook checks if v2 should be used
   - For QR codes, it uses the v2 engine (if enabled in feature flags)
   - For other barcode types, it uses the old API
   - Automatic format conversion between v1 and v2 APIs

2. Feature Flags control:
   - `QR_ENGINE_V2` - Main toggle for v2 engine
   - Other flags control specific features
   - Can be overridden via localStorage for testing

3. Endpoints:
   - v1: `/api/generate` (for non-QR barcodes)
   - v2: `/api/qr/generate` (for QR codes with v2 engine)

## Testing

1. Open browser console
2. Check for v2 badge next to "Generador de Códigos" title
3. Generate a QR code - should use v2 automatically
4. Look for performance metrics (if enabled in feature flags)
5. Use developer panel (gear icon) to toggle features

## Known Issues

- The 405 error was due to using the old hook
- Now using v2 hook which handles endpoint routing correctly

## Next Steps

1. Clear browser cache and reload
2. Test QR generation
3. Test other barcode types (should still work with v1)
4. Monitor console for any remaining errors