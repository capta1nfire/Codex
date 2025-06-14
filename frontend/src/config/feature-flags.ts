/**
 * Feature flags for QR Engine v2 rollout
 * 
 * V2 ENGINE IS NOW 100% ACTIVE - All QR generation uses v2
 * Note: v1 remains functional but is disabled for QR codes
 * These flags now control UI features rather than engine selection
 */

// Check if running in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Check for feature flag overrides in localStorage
const getLocalOverride = (key: string): boolean | null => {
  if (typeof window === 'undefined') return null;
  
  const value = localStorage.getItem(`ff_${key}`);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

// Feature flag configuration
export const FEATURE_FLAGS = {
  // Core v2 engine features
  QR_ENGINE_V2: {
    enabled: getLocalOverride('qr_engine_v2') ?? true,
    description: 'Enable QR Engine v2 for QR code generation',
  },
  
  QR_ENGINE_V2_BATCH: {
    enabled: getLocalOverride('qr_engine_v2_batch') ?? true,
    description: 'Enable batch processing with QR Engine v2',
  },
  
  QR_ENGINE_V2_PREVIEW: {
    enabled: getLocalOverride('qr_engine_v2_preview') ?? true,
    description: 'Enable real-time preview with QR Engine v2',
  },
  
  // UI features
  QR_V2_CUSTOMIZATION_UI: {
    enabled: getLocalOverride('qr_v2_customization_ui') ?? true,
    description: 'Show advanced customization options in UI',
  },
  
  QR_V2_EYE_SHAPES: {
    enabled: getLocalOverride('qr_v2_eye_shapes') ?? true,
    description: 'Enable eye shape customization',
  },
  
  QR_V2_DATA_PATTERNS: {
    enabled: getLocalOverride('qr_v2_data_patterns') ?? true,
    description: 'Enable data pattern customization',
  },
  
  QR_V2_GRADIENTS: {
    enabled: getLocalOverride('qr_v2_gradients') ?? true,
    description: 'Enable gradient color options',
  },
  
  QR_V2_EFFECTS: {
    enabled: getLocalOverride('qr_v2_effects') ?? true,  // Enabled for all
    description: 'Enable visual effects (shadow, glow, etc)',
  },
  
  QR_V2_FRAMES: {
    enabled: getLocalOverride('qr_v2_frames') ?? true,   // Enabled for all
    description: 'Enable decorative frames',
  },
  
  QR_V2_LOGO: {
    enabled: getLocalOverride('qr_v2_logo') ?? true,
    description: 'Enable logo embedding',
  },
  
  // Performance features
  QR_V2_CACHE_INDICATOR: {
    enabled: getLocalOverride('qr_v2_cache_indicator') ?? true,
    description: 'Show cache hit indicator in UI',
  },
  
  QR_V2_PERFORMANCE_METRICS: {
    enabled: getLocalOverride('qr_v2_performance_metrics') ?? true,  // Enabled for all
    description: 'Show performance metrics in UI',
  },
  
  // Migration features
  QR_V2_MIGRATION_BANNER: {
    enabled: getLocalOverride('qr_v2_migration_banner') ?? false,
    description: 'Show migration information banner',
  },
  
  QR_V2_FALLBACK: {
    enabled: getLocalOverride('qr_v2_fallback') ?? false,  // No fallback - v2 only
    description: 'Enable automatic fallback to v1 on v2 errors (DISABLED - v2 mandatory)',
  },
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature]?.enabled ?? false;
}

/**
 * Override a feature flag (for testing)
 */
export function setFeatureFlag(feature: keyof typeof FEATURE_FLAGS, enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`ff_${feature}`, enabled.toString());
    // Reload to apply changes
    window.location.reload();
  }
}

/**
 * Get all feature flags status
 */
export function getFeatureFlags() {
  return Object.entries(FEATURE_FLAGS).map(([key, value]) => ({
    key,
    ...value,
  }));
}

/**
 * Reset all feature flag overrides
 */
export function resetFeatureFlags() {
  if (typeof window !== 'undefined') {
    Object.keys(FEATURE_FLAGS).forEach(key => {
      localStorage.removeItem(`ff_${key}`);
    });
    window.location.reload();
  }
}

/**
 * Feature flag React hook
 */
export function useFeatureFlag(feature: keyof typeof FEATURE_FLAGS): boolean {
  return isFeatureEnabled(feature);
}