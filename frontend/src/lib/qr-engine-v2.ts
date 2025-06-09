/**
 * QR Engine v2 API Client
 * Provides a clean interface to interact with the new high-performance QR generation engine
 */

import { env } from '@/config/env';

// Types matching the backend API
export interface QRv2Options {
  // Size and quality
  size?: number;
  margin?: number;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  
  // Basic customization
  eyeShape?: 'square' | 'circle' | 'rounded' | 'dot' | 'leaf' | 'star' | 'diamond';
  dataPattern?: 'square' | 'dots' | 'rounded' | 'vertical' | 'horizontal' | 'diamond';
  
  // Colors
  foregroundColor?: string;
  backgroundColor?: string;
  eyeColor?: string;
  
  // Advanced features
  gradient?: {
    type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[];
    angle?: number;
    applyToEyes?: boolean;
    applyToData?: boolean;
  };
  logo?: {
    data: string; // Base64
    size?: number;
    padding?: number;
    backgroundColor?: string;
    shape?: 'square' | 'circle' | 'rounded';
  };
  frame?: {
    style: 'simple' | 'rounded' | 'bubble' | 'speech' | 'badge';
    color?: string;
    width?: number;
    text?: string;
    textPosition?: 'top' | 'bottom' | 'left' | 'right';
  };
  effects?: Array<{
    type: 'shadow' | 'glow' | 'blur' | 'noise' | 'vintage';
    intensity?: number;
    color?: string;
    offsetX?: number;
    offsetY?: number;
    blurRadius?: number;
  }>;
  
  // Performance options
  optimizeForSize?: boolean;
  enableCache?: boolean;
}

export interface QRv2GenerateRequest {
  data: string;
  options?: QRv2Options;
}

export interface QRv2GenerateResponse {
  success: boolean;
  svg: string;
  metadata: {
    version: number;
    modules: number;
    errorCorrection: string;
    dataCapacity: number;
    processingTimeMs: number;
    complexityLevel: string;
    qualityScore: number;
  };
  cached?: boolean;
  performance?: {
    processingTimeMs: number;
    engineVersion: string;
    cached: boolean;
  };
}

export interface QRv2ValidateResponse {
  success: boolean;
  valid: boolean;
  details: {
    dataLength: number;
    estimatedVersion: number;
    errorCorrectionCapacity: number;
    logoImpact?: number;
  };
  suggestions: string[];
}

export interface QRv2BatchRequest {
  codes: QRv2GenerateRequest[];
  options?: {
    maxConcurrent?: number;
    includeMetadata?: boolean;
  };
}

export interface QRv2BatchResponse {
  success: boolean;
  results: Array<{
    id?: string;
    success: boolean;
    svg?: string;
    error?: string;
    metadata?: QRv2GenerateResponse['metadata'];
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTimeMs: number;
    averageTimeMs: number;
  };
}

/**
 * QR Engine v2 API Client
 */
export class QREngineV2Client {
  private baseURL: string;
  private authToken?: string;

  constructor(authToken?: string) {
    this.baseURL = env.backendUrl || 'http://localhost:3004';
    this.authToken = authToken;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Generate a QR code with v2 engine
   */
  async generate(request: QRv2GenerateRequest): Promise<QRv2GenerateResponse> {
    const response = await fetch(`${this.baseURL}/api/qr/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate QR code');
    }

    return response.json();
  }

  /**
   * Validate QR data and options
   */
  async validate(request: QRv2GenerateRequest): Promise<QRv2ValidateResponse> {
    const response = await fetch(`${this.baseURL}/api/qr/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to validate QR data');
    }

    return response.json();
  }

  /**
   * Generate multiple QR codes in batch
   */
  async batch(request: QRv2BatchRequest): Promise<QRv2BatchResponse> {
    const response = await fetch(`${this.baseURL}/api/qr/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to process batch');
    }

    return response.json();
  }

  /**
   * Get preview URL for real-time QR generation
   */
  getPreviewUrl(params: {
    data: string;
    eyeShape?: string;
    dataPattern?: string;
    fgColor?: string;
    bgColor?: string;
    size?: number;
  }): string {
    const queryParams = new URLSearchParams({
      data: params.data,
      ...(params.eyeShape && { eyeShape: params.eyeShape }),
      ...(params.dataPattern && { dataPattern: params.dataPattern }),
      ...(params.fgColor && { fgColor: params.fgColor }),
      ...(params.bgColor && { bgColor: params.bgColor }),
      ...(params.size && { size: params.size.toString() }),
    });

    return `${this.baseURL}/api/qr/preview?${queryParams.toString()}`;
  }

  /**
   * Get cache statistics (admin only)
   */
  async getCacheStats(): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/qr/cache/stats`, {
      headers: {
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get cache stats');
    }

    return response.json();
  }

  /**
   * Clear cache (admin only)
   */
  async clearCache(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/api/qr/cache/clear`, {
      method: 'POST',
      headers: {
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to clear cache');
    }

    return response.json();
  }
}

// Singleton instance
let qrEngineV2Instance: QREngineV2Client | null = null;

/**
 * Get QR Engine v2 client instance
 */
export function getQREngineV2(authToken?: string): QREngineV2Client {
  if (!qrEngineV2Instance) {
    qrEngineV2Instance = new QREngineV2Client(authToken);
  } else if (authToken) {
    qrEngineV2Instance.setAuthToken(authToken);
  }
  
  return qrEngineV2Instance;
}

/**
 * Convert old API format to v2 format
 */
export function convertToV2Format(oldRequest: any): QRv2GenerateRequest {
  const options: QRv2Options = {};

  if (oldRequest.options) {
    const oldOpts = oldRequest.options;

    // Size conversion
    if (oldOpts.scale) {
      options.size = oldOpts.scale * 100;
    }

    // Colors
    if (oldOpts.fgcolor) {
      options.foregroundColor = oldOpts.fgcolor;
    }
    if (oldOpts.bgcolor) {
      options.backgroundColor = oldOpts.bgcolor;
    }

    // Error correction
    if (oldOpts.ecl) {
      options.errorCorrection = oldOpts.ecl;
    }

    // Gradient
    if (oldOpts.gradient_enabled && oldOpts.gradient_colors) {
      options.gradient = {
        type: oldOpts.gradient_type || 'linear',
        colors: oldOpts.gradient_colors,
        angle: oldOpts.gradient_direction === 'horizontal' ? 0 : 90,
      };
    }
  }

  return {
    data: oldRequest.data || oldRequest.text || '',
    options,
  };
}

/**
 * Default v2 options
 */
export const defaultV2Options: QRv2Options = {
  size: 300,
  margin: 4,
  errorCorrection: 'M',
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  enableCache: true,
  optimizeForSize: false,
};