/**
 * QR Engine Migration Utilities
 * Helps migrate from old QR generation API to QR Engine v2
 */

import { QRv2Options, QRv2GenerateRequest } from './qr-engine-v2';

// Old API types for reference
interface OldQROptions {
  scale?: number;
  margin?: number;
  ecl?: 'L' | 'M' | 'Q' | 'H';
  fgcolor?: string;
  bgcolor?: string;
  gradient_enabled?: boolean;
  gradient_type?: string;
  gradient_direction?: string;
  gradient_colors?: string[];
  logo?: string;
  logo_size?: number;
  includetext?: boolean;
}

interface OldQRRequest {
  barcode_type: string;
  data: string;
  options?: OldQROptions;
}

/**
 * Convert old QR request to v2 format
 */
export function migrateQRRequest(oldRequest: OldQRRequest): QRv2GenerateRequest {
  const options: QRv2Options = {};

  if (oldRequest.options) {
    const old = oldRequest.options;

    // Basic options
    if (old.scale) {
      // Old scale was 1-10, new size is in pixels
      options.size = Math.max(100, Math.min(1000, old.scale * 50));
    }

    if (old.margin !== undefined) {
      options.margin = old.margin;
    }

    if (old.ecl) {
      options.errorCorrection = old.ecl;
    }

    // Colors
    if (old.fgcolor) {
      options.foregroundColor = old.fgcolor;
    }

    if (old.bgcolor) {
      options.backgroundColor = old.bgcolor;
    }

    // Gradient
    if (old.gradient_enabled && old.gradient_colors && old.gradient_colors.length >= 2) {
      options.gradient = {
        type: (old.gradient_type as any) || 'linear',
        colors: old.gradient_colors,
        angle: old.gradient_direction === 'horizontal' ? 0 : 
               old.gradient_direction === 'vertical' ? 90 :
               old.gradient_direction === 'diagonal' ? 45 : 0,
        applyToData: true,
        applyToEyes: false,
      };
    }

    // Logo
    if (old.logo) {
      options.logo = {
        data: old.logo,
        size: old.logo_size || 20,
        padding: 5,
        shape: 'square',
      };
    }
  }

  return {
    data: oldRequest.data,
    options,
  };
}

/**
 * Convert v2 response to old format for backward compatibility
 */
export function convertV2ResponseToOld(v2Response: any): any {
  return {
    success: v2Response.success,
    svgString: v2Response.svg,
    svg: v2Response.svg,
    cached: v2Response.cached || false,
    metadata: {
      generation_time_ms: v2Response.metadata?.processingTimeMs || 0,
      from_cache: v2Response.cached || false,
      barcode_type: 'qrcode',
      data_size: v2Response.metadata?.dataCapacity || 0,
    },
  };
}

/**
 * Feature flags for gradual migration
 */
export const QR_MIGRATION_FLAGS = {
  // Enable v2 engine for specific features
  USE_V2_FOR_BASIC_QR: true,
  USE_V2_FOR_CUSTOMIZED_QR: true,
  USE_V2_FOR_BATCH: true,
  USE_V2_FOR_PREVIEW: true,
  
  // Enable v2 UI features
  SHOW_V2_CUSTOMIZATION: true,
  SHOW_V2_EFFECTS: false, // Gradual rollout
  SHOW_V2_FRAMES: false,  // Gradual rollout
  
  // Performance features
  ENABLE_V2_CACHE: true,
  ENABLE_V2_OPTIMIZATION: true,
};

/**
 * Check if should use v2 based on request
 */
export function shouldUseV2(request: any): boolean {
  // Always use v2 if explicitly requested
  if (request.useV2) return true;
  
  // Check barcode type
  if (request.barcode_type !== 'qrcode' && request.barcode_type !== 'qr') {
    return false; // v2 only supports QR codes
  }
  
  // Check feature flags
  const hasCustomization = request.options && (
    request.options.gradient_enabled ||
    request.options.logo ||
    request.options.eyeShape ||
    request.options.dataPattern
  );
  
  if (hasCustomization) {
    return QR_MIGRATION_FLAGS.USE_V2_FOR_CUSTOMIZED_QR;
  }
  
  return QR_MIGRATION_FLAGS.USE_V2_FOR_BASIC_QR;
}

/**
 * Migration helper for components
 */
export class QRMigrationHelper {
  private useV2: boolean;
  
  constructor(forceV2 = false) {
    this.useV2 = forceV2 || QR_MIGRATION_FLAGS.USE_V2_FOR_BASIC_QR;
  }
  
  /**
   * Get API endpoint based on migration status
   */
  getEndpoint(): string {
    return this.useV2 ? '/api/qr/generate' : '/api/generate';
  }
  
  /**
   * Transform request based on migration status
   */
  transformRequest(request: any): any {
    if (this.useV2 && request.barcode_type) {
      // Convert old format to v2
      return migrateQRRequest(request);
    }
    return request;
  }
  
  /**
   * Transform response for backward compatibility
   */
  transformResponse(response: any): any {
    if (this.useV2 && response.svg && !response.svgString) {
      // Convert v2 response to old format
      return convertV2ResponseToOld(response);
    }
    return response;
  }
}

/**
 * Get migration status for debugging
 */
export function getMigrationStatus() {
  return {
    flags: QR_MIGRATION_FLAGS,
    v2Enabled: QR_MIGRATION_FLAGS.USE_V2_FOR_BASIC_QR,
    customizationEnabled: QR_MIGRATION_FLAGS.SHOW_V2_CUSTOMIZATION,
    stats: {
      basicQR: QR_MIGRATION_FLAGS.USE_V2_FOR_BASIC_QR ? 'v2' : 'v1',
      customizedQR: QR_MIGRATION_FLAGS.USE_V2_FOR_CUSTOMIZED_QR ? 'v2' : 'v1',
      batch: QR_MIGRATION_FLAGS.USE_V2_FOR_BATCH ? 'v2' : 'v1',
      preview: QR_MIGRATION_FLAGS.USE_V2_FOR_PREVIEW ? 'v2' : 'v1',
    },
  };
}