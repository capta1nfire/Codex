# ⚠️ WARNING: Protected Directory

## 🛡️ page.tsx is PROTECTED

The `page.tsx` file in this directory is **critically protected** and subject to strict policies.

### ❌ DO NOT:
- Add any logic to page.tsx
- Add state management
- Add event handlers
- Import additional dependencies
- Exceed 30 lines of code

### ✅ Instead:
- Add logic to `/hooks/useQRGeneratorOrchestrator.ts`
- Add UI components to `/components/generator/*`
- Add services to `/services/generatorServices.ts`

### 📋 Before Making Changes:
1. Read `/docs/policies/MAIN_PAGE_PROTECTION_POLICY.md`
2. Run `npm run check:page-health`
3. Run guardian tests: `npm test page.guardian.test.tsx`

### 🚨 Violations Will Result In:
- Automatic build failure
- PR rejection
- Performance degradation

Remember: This page receives **80%+ of all traffic**. Every millisecond counts.

---

**Refactored**: June 27, 2025  
**Protected by**: Guardian Tests & Automated Checks