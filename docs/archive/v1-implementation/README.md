# Archive - V1 Implementation

This directory contains code from the original frontend-based gradient implementation that has been deprecated in favor of the Rust backend implementation.

## Archived Files

### svg-gradient-processor.ts
- **Date Archived**: June 15, 2025
- **Original Location**: `/frontend/src/lib/svg-gradient-processor.ts`
- **Purpose**: Frontend SVG manipulation to apply gradients to QR codes
- **Lines of Code**: ~295
- **Reason for Deprecation**: Replaced by native gradient generation in Rust backend (QR Engine v2)

## Why This Was Deprecated

1. **Double Processing**: The backend already generates SVGs with gradients, making frontend processing redundant
2. **Performance**: Client-side DOM manipulation was slower than server-side generation
3. **Consistency**: Single source of truth (backend) ensures consistent rendering
4. **Complexity**: Removed 295 lines of complex DOM manipulation code

## Current Implementation

As of June 15, 2025, all gradient rendering is handled by the Rust backend:
- Uses SVG `<defs>` with `gradientUnits="userSpaceOnUse"`
- Generates continuous gradients across the entire QR code
- See `/docs/qr-engine/implementation/troubleshooting-fixes.md` for technical details

## Note

This code is preserved for historical reference only. Do not use in production.