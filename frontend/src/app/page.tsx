/**
 * ⚠️ PROTECTED FILE - CRITICAL PATH COMPONENT ⚠️
 * 
 * Main QR/Barcode Generator Page - Refactored June 27, 2025
 * Reduced from 1,154 lines to 27 lines (97.6% reduction)
 * 
 * 🛡️ PROTECTION RULES FOR DEVELOPERS & AI AGENTS:
 * 
 * 1. ❌ DO NOT add ANY logic to this file
 * 2. ❌ DO NOT add state management (useState, useEffect, etc.)
 * 3. ❌ DO NOT add event handlers or callbacks
 * 4. ❌ DO NOT import additional components or hooks
 * 5. ✅ ONLY render QRGeneratorContainer
 * 
 * 📊 METRICS TO MAINTAIN:
 * - Lines of code: < 30
 * - Imports: 2 only (React + QRGeneratorContainer)
 * - Complexity: 0 (pure presentation)
 * - Re-renders: Minimal
 * 
 * 🔧 WHERE TO ADD FEATURES:
 * - Business logic → useQRGeneratorOrchestrator
 * - UI components → components/generator/*
 * - Services → services/generatorServices.ts
 * - State management → State machine only
 * 
 * 📈 This page receives 80%+ of traffic. Performance is CRITICAL.
 * 
 * @protected
 * @performance-critical
 * @max-lines 30
 */

'use client';

import React from 'react';
import { QRGeneratorContainer } from '@/components/generator/QRGeneratorContainer';

export default function Home() {
  return <QRGeneratorContainer />;
}