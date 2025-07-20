import axios, { AxiosError } from 'axios';

import { config } from '../config.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

const QR_ENGINE_URL = process.env.RUST_SERVICE_URL || 'http://localhost:3002';
const QR_ENGINE_TIMEOUT = parseInt(process.env.QR_ENGINE_TIMEOUT || '10000', 10);

// Unified interfaces supporting both v1 and v2 formats
export interface QrOptions {
  // Common options
  size?: number;
  margin?: number;
  errorCorrection?: string;
  error_correction?: string; // snake_case variant

  // Color options
  foregroundColor?: string;
  foreground_color?: string;
  backgroundColor?: string;
  background_color?: string;
  eyeColor?: string;
  eye_color?: string;

  // Shape options
  eyeShape?: string;
  eye_shape?: string;
  dataPattern?: string;
  data_pattern?: string;

  // Advanced features
  gradient?: {
    type: string;
    colors: string[];
    angle?: number;
    enabled?: boolean;
    applyToEyes?: boolean;
    apply_to_eyes?: boolean;
    applyToData?: boolean;
    apply_to_data?: boolean;
    strokeStyle?: {
      enabled: boolean;
      color?: string;
      width?: number;
      opacity?: number;
    };
    stroke_style?: any; // snake_case variant
  };

  logo?: {
    data: string;
    size?: number;
    padding?: number;
    backgroundColor?: string;
    background_color?: string;
    shape?: string;
  };

  frame?: {
    style: string;
    color?: string;
    width?: number;
    text?: string;
    textPosition?: string;
    text_position?: string;
  };

  effects?: Array<{
    type: string;
    intensity?: number;
    color?: string;
    offsetX?: number;
    offset_x?: number;
    offsetY?: number;
    offset_y?: number;
    blurRadius?: number;
    blur_radius?: number;
  }>;

  // Other options
  optimizeForSize?: boolean;
  optimize_for_size?: boolean;
  enableCache?: boolean;
  enable_cache?: boolean;
}

export interface QrGenerateRequest {
  data: string;
  options?: QrOptions;
}

export interface QrGenerateResponse {
  svg: string;
  metadata: {
    version: number;
    modules: number;
    errorCorrection: string;
    dataCapacity: number;
    processingTimeMs: number;
    complexityLevel?: string;
    qualityScore?: number;
  };
  cached: boolean;
}

export interface QrBatchRequest {
  items: Array<{
    id?: string;
    data: string;
    options?: QrOptions;
  }>;
}

export interface QrBatchResponse {
  success: boolean;
  results: Array<{
    id?: string;
    success: boolean;
    svg?: string;
    error?: string;
    metadata?: any;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTimeMs: number;
    averageTimeMs: number;
  };
}

export interface QrValidateRequest {
  data: string;
  options?: QrOptions;
}

export interface QrValidateResponse {
  valid: boolean;
  details: {
    dataLength: number;
    estimatedVersion: number;
    errorCorrectionCapacity: number;
    logoImpact?: number;
  };
  suggestions: string[];
}

export interface QrCacheStats {
  hits: number;
  misses: number;
  hitRate: string;
  totalRequests: number;
  cacheSize: number;
  evictions: number;
}

export interface QrAnalytics {
  totalGenerated: number;
  averageGenerationTime: number;
  popularOptions: {
    eyeShapes: Record<string, number>;
    dataPatterns: Record<string, number>;
    errorCorrection: Record<string, number>;
  };
  cacheStats: QrCacheStats;
}

class QrServiceUnified {
  private axiosClient;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: QR_ENGINE_URL,
      timeout: QR_ENGINE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      this.axiosClient.interceptors.request.use((request) => {
        logger.debug(`[QR Engine] Request: ${request.method?.toUpperCase()} ${request.url}`);
        return request;
      });
    }
  }

  /**
   * Transform camelCase options to snake_case for Rust API
   */
  private transformToSnakeCase(options: QrOptions): any {
    if (!options) return undefined;

    const transformed: any = {
      size: options.size,
      margin: options.margin,
      error_correction: options.errorCorrection || options.error_correction,
      eye_shape: options.eyeShape || options.eye_shape,
      data_pattern: options.dataPattern || options.data_pattern,
      foreground_color: options.foregroundColor || options.foreground_color,
      eye_color: options.eyeColor || options.eye_color,
      optimize_for_size: options.optimizeForSize || options.optimize_for_size,
      enable_cache: options.enableCache || options.enable_cache,
    };

    // Handle gradient with detailed logging
    if (options.gradient) {
      logger.info('[QR Service] Processing gradient:', {
        gradient: options.gradient,
        hasStrokeStyle: !!options.gradient.strokeStyle,
        type: options.gradient.type,
        gradient_type: options.gradient.gradient_type,
      });

      transformed.gradient = {
        gradient_type: options.gradient.type || options.gradient.gradient_type,
        colors: options.gradient.colors,
        angle: options.gradient.angle,
        enabled: options.gradient.enabled !== false,
        apply_to_data:
          options.gradient.applyToData !== false || options.gradient.apply_to_data !== false,
        apply_to_eyes: options.gradient.applyToEyes || options.gradient.apply_to_eyes || false,
      };
      
      logger.info('[QR Service] Transformed gradient:', transformed.gradient);

      // Handle stroke_style (support both camelCase and snake_case)
      if (options.gradient.strokeStyle || options.gradient.stroke_style) {
        const strokeStyle = options.gradient.strokeStyle || options.gradient.stroke_style;
        transformed.gradient.stroke_style = {
          enabled: strokeStyle.enabled,
          color: strokeStyle.color,
          width: strokeStyle.width,
          opacity: strokeStyle.opacity,
        };
        logger.info(
          '[QR Service] Added stroke_style to gradient:',
          transformed.gradient.stroke_style
        );
      }
    }

    // Handle logo
    if (options.logo) {
      transformed.logo = {
        data: options.logo.data,
        size: options.logo.size,
        padding: options.logo.padding,
        background_color: options.logo.backgroundColor || options.logo.background_color,
        shape: options.logo.shape,
      };
    }

    // Handle frame
    if (options.frame) {
      transformed.frame = {
        style: options.frame.style,
        color: options.frame.color,
        width: options.frame.width,
        text: options.frame.text,
        text_position: options.frame.textPosition || options.frame.text_position,
      };
    }

    // Handle effects
    if (options.effects) {
      transformed.effects = options.effects.map((effect) => ({
        type: effect.type,
        intensity: effect.intensity,
        color: effect.color,
        offset_x: effect.offsetX || effect.offset_x,
        offset_y: effect.offsetY || effect.offset_y,
        blur_radius: effect.blurRadius || effect.blur_radius,
      }));
    }

    return transformed;
  }

  /**
   * Generate a QR code
   */
  async generate(request: QrGenerateRequest): Promise<QrGenerateResponse> {
    try {
      logger.info('QR generation request', {
        dataLength: request.data.length,
        hasOptions: !!request.options,
      });

      const transformedRequest = {
        data: request.data,
        options: this.transformToSnakeCase(request.options),
      };

      logger.info('[QR Service] Sending to Rust:', {
        request: transformedRequest,
      });

      const response = await this.axiosClient.post<any>('/api/qr/generate', transformedRequest);

      // Handle both v1 and v2 response formats
      if (response.data.qr_code) {
        // v1 format
        return {
          svg: response.data.qr_code,
          metadata: response.data.metadata || {
            version: 1,
            modules: 0,
            errorCorrection: 'M',
            dataCapacity: 0,
            processingTimeMs: 0,
          },
          cached: response.data.cached || false,
        };
      } else if (response.data.svg) {
        // v2 format
        return {
          svg: response.data.svg,
          metadata: response.data.metadata,
          cached: response.data.cached || false,
        };
      } else {
        throw new AppError('Invalid response format from QR engine', ErrorCode.INTERNAL_ERROR);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error('QR generation error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        if (axiosError.response?.status === 400) {
          throw new AppError(
            axiosError.response.data?.message || 'Invalid QR code parameters',
            ErrorCode.VALIDATION_ERROR
          );
        }

        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          throw new AppError('QR generation timeout', ErrorCode.TIMEOUT_ERROR);
        }

        if (axiosError.code === 'ECONNREFUSED') {
          throw new AppError('QR engine service unavailable', ErrorCode.SERVICE_UNAVAILABLE);
        }
      }

      throw new AppError('Failed to generate QR code', ErrorCode.INTERNAL_ERROR);
    }
  }

  /**
   * Generate multiple QR codes in batch
   */
  async batch(request: QrBatchRequest): Promise<QrBatchResponse> {
    try {
      logger.info('QR batch generation request', {
        itemCount: request.items.length,
      });

      const transformedItems = request.items.map((item) => ({
        id: item.id,
        data: item.data,
        options: this.transformToSnakeCase(item.options),
      }));

      const response = await this.axiosClient.post<QrBatchResponse>('/api/qr/batch', {
        items: transformedItems,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error('QR batch generation error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        });

        if (axiosError.response?.status === 400) {
          throw new AppError('Invalid batch parameters', ErrorCode.VALIDATION_ERROR);
        }

        if (axiosError.code === 'ECONNREFUSED') {
          throw new AppError('QR engine service unavailable', ErrorCode.SERVICE_UNAVAILABLE);
        }
      }

      throw new AppError('Failed to generate QR codes in batch', ErrorCode.INTERNAL_ERROR);
    }
  }

  /**
   * Validate QR code data and options
   */
  async validate(request: QrValidateRequest): Promise<QrValidateResponse> {
    try {
      const transformedRequest = {
        data: request.data,
        options: this.transformToSnakeCase(request.options),
      };

      const response = await this.axiosClient.post<QrValidateResponse>(
        '/api/qr/validate',
        transformedRequest
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 400) {
          return axiosError.response.data as QrValidateResponse;
        }
      }

      throw new AppError('Failed to validate QR code', ErrorCode.INTERNAL_ERROR);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<QrCacheStats> {
    try {
      const response = await this.axiosClient.get<QrCacheStats>('/api/qr/cache/stats');
      return response.data;
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      throw new AppError('Failed to get cache statistics', ErrorCode.INTERNAL_ERROR);
    }
  }

  /**
   * Clear the QR cache
   */
  async clearCache(): Promise<{ cleared: number }> {
    try {
      const response = await this.axiosClient.post<{ cleared: number }>('/api/qr/cache/clear');
      return response.data;
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      throw new AppError('Failed to clear cache', ErrorCode.INTERNAL_ERROR);
    }
  }

  // Analytics method removed - v2 analytics deprecated in favor of v3

  /**
   * Health check for QR engine
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await this.axiosClient.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  /**
   * Get preview URL for QR code
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
      ...(params.eyeShape && { eye_shape: params.eyeShape }),
      ...(params.dataPattern && { data_pattern: params.dataPattern }),
      ...(params.fgColor && { fg_color: params.fgColor }),
      ...(params.bgColor && { bg_color: params.bgColor }),
      ...(params.size && { size: params.size.toString() }),
    });

    return `${QR_ENGINE_URL}/api/qr/preview?${queryParams.toString()}`;
  }

  /**
   * Convert old API format to v2 format
   */
  convertFromOldFormat(oldRequest: any): QrGenerateRequest {
    const options: QrOptions = {};

    if (oldRequest.options) {
      const oldOpts = oldRequest.options;

      // Size conversion (scale to pixels)
      if (oldOpts.scale) {
        options.size = oldOpts.scale * 100; // Approximate conversion
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
      data: oldRequest.data,
      options,
    };
  }

  /**
   * Convert v2 response to old format for backward compatibility
   */
  convertToOldFormat(v2Response: QrGenerateResponse): any {
    return {
      success: true,
      svgString: v2Response.svg,
      svg: v2Response.svg,
      cached: v2Response.cached,
      metadata: {
        generation_time_ms: v2Response.metadata.processingTimeMs,
        from_cache: v2Response.cached,
        barcode_type: 'qrcode',
        data_size: v2Response.metadata.dataCapacity,
      },
    };
  }
}

// Export singleton instance
export const qrService = new QrServiceUnified();

// Also export individual functions for backward compatibility
export const generateQRv2 = (request: QrGenerateRequest) => qrService.generate(request);
export const batchGenerateQRv2 = (request: QrBatchRequest) => qrService.batch(request);
export const validateQRv2 = (request: QrValidateRequest) => qrService.validate(request);
export const getQRv2CacheStats = () => qrService.getCacheStats();
export const clearQRv2Cache = () => qrService.clearCache();
// Analytics export removed - v2 analytics deprecated in favor of v3
export const checkQREngineHealth = () => qrService.healthCheck();

// Additional function for preview
export async function getQRPreview(params: any): Promise<{ svg: string }> {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await qrService.axiosClient.get(`/api/qr/preview?${queryString}`);
    return { svg: response.data };
  } catch (error) {
    logger.error('[QR Service] Preview failed:', error);
    throw new AppError('Failed to generate preview', ErrorCode.INTERNAL_ERROR);
  }
}

export default qrService;
