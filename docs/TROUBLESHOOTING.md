# QReable Troubleshooting Guide

> Common issues and their solutions

## Frontend Issues

### Initial QR Code Not Displaying
**Problem**: The default QR code with "https://tu-sitio-web.com" doesn't show on page load.

**Symptoms**:
- Empty preview area shows video placeholder instead of QR code
- QR generation logs show successful API call
- SVG content is received but not displayed

**Root Cause**: 
The `handleQRFormChange` function in `page.tsx` treats the default URL as empty and calls `clearContent()`, clearing the generated QR code immediately after generation.

**Current Status**: Under investigation (as of June 20, 2025)

**Workaround**: 
- The QR code generates correctly when user types any different URL
- No action needed from user perspective - just start typing

**Attempted Fixes**:
1. Added `isInitialMount` check to prevent clearing during initial render
2. Increased generation delay to ensure component readiness
3. Modified initial generation logic with dependencies

**Code Location**: 
- `/frontend/src/app/page.tsx` - Line 355-362
- `/frontend/src/hooks/useBarcodeGenerationV2.ts`
- `/frontend/src/components/generator/PreviewSectionV3.tsx`

---

## Backend Issues

### QR v3 Gradient Support
**Clarification**: v3 DOES support gradients, but frontend implementation is incomplete.

**Current State**:
- Backend fully supports gradients via `customization` field
- Frontend only sends `error_correction` parameter
- Gradient options are not being passed from frontend to v3 API

**To Enable Gradients in v3**:
Update `useQRGenerationV3` hook to include full customization options when calling the API.

---

## Performance Issues

### Slow QR Generation
**If QR generation is slow**:
1. Check if Redis cache is running: `docker ps | grep redis`
2. Monitor cache hit rate in backend logs
3. Verify Rust service is running: `pm2 status qreable-rust`

---

## Development Issues

### Services Won't Start
```bash
# Check port availability
lsof -i :3000  # Frontend
lsof -i :3004  # Backend  
lsof -i :3002  # Rust

# Reset all services
pm2 delete all
./pm2-start.sh
```

### TypeScript Errors After Changes
```bash
# Clear caches and rebuild
cd frontend && rm -rf .next node_modules/.cache
cd backend && rm -rf dist
npm install
pm2 restart all
```