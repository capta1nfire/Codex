/**
 * Placeholder Configuration Manager
 * 
 * Manages the Studio placeholder configuration across the application
 * to ensure consistency between initial display and user customization.
 */

import { api } from '@/lib/api';
import { mapStudioConfigToFormOptions } from '@/lib/studioConfigMapper';
import { QRConfig } from '@/types/studio.types';
import { GenerateFormData } from '@/schemas/generate.schema';

interface CachedPlaceholderConfig {
  config: QRConfig | null;
  timestamp: number;
  expiresAt: number;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache for placeholder configuration
let cachedPlaceholder: CachedPlaceholderConfig | null = null;

/**
 * Fetches the placeholder configuration from the public API
 * Uses caching to reduce API calls while ensuring freshness
 */
export async function fetchPlaceholderConfig(forceRefresh = false): Promise<QRConfig | null> {
  const now = Date.now();
  
  // Check cache validity
  if (!forceRefresh && cachedPlaceholder && cachedPlaceholder.expiresAt > now) {
    console.log('[PlaceholderConfigManager] Using cached config');
    return cachedPlaceholder.config;
  }
  
  try {
    console.log('[PlaceholderConfigManager] Fetching fresh config from API...');
    const response = await api.get(`/api/studio/public/placeholder?t=${now}`, false, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    if (response.config?.config) {
      const config = response.config.config as QRConfig;
      
      // Update cache
      cachedPlaceholder = {
        config,
        timestamp: now,
        expiresAt: now + CACHE_DURATION
      };
      
      console.log('[PlaceholderConfigManager] Config fetched and cached:', {
        hasConfig: true,
        updatedAt: response.config.updatedAt,
        expiresAt: new Date(cachedPlaceholder.expiresAt).toISOString()
      });
      
      return config;
    }
  } catch (error) {
    console.error('[PlaceholderConfigManager] Failed to fetch config:', error);
  }
  
  return null;
}

/**
 * Gets the placeholder configuration as form options
 * This is the primary method components should use
 */
export async function getPlaceholderFormOptions(forceRefresh = false): Promise<Partial<GenerateFormData['options']> | null> {
  const config = await fetchPlaceholderConfig(forceRefresh);
  
  if (!config) {
    return null;
  }
  
  return mapStudioConfigToFormOptions(config);
}

/**
 * Applies placeholder configuration to existing form options
 * Preserves user changes while maintaining Studio base configuration
 */
export function mergeWithPlaceholderConfig(
  userOptions: GenerateFormData['options'],
  placeholderOptions: Partial<GenerateFormData['options']> | null,
  hasUserChanges: boolean
): GenerateFormData['options'] {
  if (!placeholderOptions || hasUserChanges) {
    // If no placeholder config or user has made changes, return user options as-is
    return userOptions || {};
  }
  
  // For initial state (no user changes), use placeholder config as base
  return {
    ...placeholderOptions,
    ...userOptions,
    // Ensure critical fields from placeholder are preserved
    gradient_enabled: placeholderOptions.gradient_enabled ?? userOptions?.gradient_enabled,
    gradient_type: placeholderOptions.gradient_type ?? userOptions?.gradient_type,
    data_pattern: placeholderOptions.data_pattern ?? userOptions?.data_pattern,
    eye_border_style: placeholderOptions.eye_border_style ?? userOptions?.eye_border_style,
    eye_center_style: placeholderOptions.eye_center_style ?? userOptions?.eye_center_style,
    use_separated_eye_styles: placeholderOptions.use_separated_eye_styles ?? userOptions?.use_separated_eye_styles,
    // Logo configuration
    logo_enabled: placeholderOptions.logo_enabled ?? userOptions?.logo_enabled,
    logo_data: placeholderOptions.logo_data ?? userOptions?.logo_data,
    logo_size: placeholderOptions.logo_size ?? userOptions?.logo_size,
    logo_shape: placeholderOptions.logo_shape ?? userOptions?.logo_shape,
  };
}

/**
 * Clears the cached placeholder configuration
 * Useful when Studio config is updated
 */
export function clearPlaceholderCache(): void {
  cachedPlaceholder = null;
  console.log('[PlaceholderConfigManager] Cache cleared');
}

/**
 * Checks if the current configuration matches the placeholder
 * Used to determine if user has made customizations
 */
export function isUsingPlaceholderConfig(
  currentOptions: GenerateFormData['options'],
  placeholderOptions: Partial<GenerateFormData['options']> | null
): boolean {
  if (!placeholderOptions || !currentOptions) {
    return false;
  }
  
  // Check key visual properties
  const keysToCheck = [
    'gradient_enabled',
    'gradient_type',
    'gradient_color1',
    'gradient_color2',
    'data_pattern',
    'eye_border_style',
    'eye_center_style',
    'use_separated_eye_styles',
    'logo_enabled'
  ];
  
  return keysToCheck.every(key => {
    const currentValue = currentOptions[key as keyof typeof currentOptions];
    const placeholderValue = placeholderOptions[key as keyof typeof placeholderOptions];
    return currentValue === placeholderValue;
  });
}