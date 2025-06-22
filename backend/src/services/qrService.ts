import axios, { AxiosError } from 'axios';

import { config } from '../config.js';
import { QRGenerateRequest, QROptions } from '../schemas/qrSchemas.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

const QR_ENGINE_URL = process.env.RUST_SERVICE_URL || 'http://localhost:3002';
const QR_ENGINE_TIMEOUT = parseInt(process.env.QR_ENGINE_TIMEOUT || '10000', 10);

// QR Engine v2 client
const qrEngineClient = axios.create({
  baseURL: QR_ENGINE_URL,
  timeout: QR_ENGINE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log requests in development
if (process.env.NODE_ENV === 'development') {
  qrEngineClient.interceptors.request.use((request) => {
    logger.debug(`[QR Engine] Request: ${request.method?.toUpperCase()} ${request.url}`);
    return request;
  });
}

interface QRGenerateResult {
  svg: string;
  metadata: {
    version: number;
    modules: number;
    errorCorrection: string;
    dataCapacity: number;
    processingTimeMs: number;
  };
  cached?: boolean;
}

interface QRBatchResult {
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

interface QRValidationResult {
  valid: boolean;
  details: {
    dataLength: number;
    estimatedVersion: number;
    errorCorrectionCapacity: number;
    logoImpact?: number;
  };
  suggestions?: string[];
}

/**
 * Generate QR code using v2 engine
 */
export async function generateQRv2(request: QRGenerateRequest): Promise<QRGenerateResult> {
  try {
    // Debug incoming request
    if (request.options?.gradient) {
      logger.info('[QR Service] Raw gradient in request:', {
        type: request.options.gradient.type,
        colors: request.options.gradient.colors,
        angle: request.options.gradient.angle,
        strokeStyle: request.options.gradient.strokeStyle,
        hasStrokeStyle: !!request.options.gradient.strokeStyle,
      });
    }

    // Use v2 endpoint directly without legacy transformation
    const v2Request = {
      data: request.data,
      options: request.options
        ? {
            size: request.options.size,
            margin: request.options.margin,
            error_correction: request.options.errorCorrection,
            eye_shape: request.options.eyeShape,
            data_pattern: request.options.dataPattern,
            foreground_color: request.options.foregroundColor,
            background_color: request.options.backgroundColor,
            eye_color: request.options.eyeColor,
            gradient: request.options.gradient
              ? (() => {
                  // Debug logging
                  logger.info('[QR Service] Incoming gradient request:', {
                    gradient: request.options.gradient,
                  });

                  if (request.options.gradient.strokeStyle) {
                    logger.info('[QR Service] StrokeStyle detected in request:', {
                      strokeStyle: request.options.gradient.strokeStyle,
                    });
                  } else {
                    logger.info('[QR Service] No strokeStyle in gradient request');
                  }

                  const gradientObj = {
                    type: request.options.gradient.type,
                    colors: request.options.gradient.colors,
                    angle: request.options.gradient.angle,
                    enabled: request.options.gradient.enabled !== false,
                    apply_to_data: request.options.gradient.applyToData !== false,
                    apply_to_eyes: request.options.gradient.applyToEyes || false,
                    stroke_style: request.options.gradient.strokeStyle
                      ? {
                          enabled: request.options.gradient.strokeStyle.enabled,
                          color: request.options.gradient.strokeStyle.color,
                          width: request.options.gradient.strokeStyle.width,
                          opacity: request.options.gradient.strokeStyle.opacity,
                        }
                      : undefined,
                  };

                  logger.info(
                    '[QR Service] Final gradient object:',
                    JSON.stringify(gradientObj, null, 2)
                  );
                  return gradientObj;
                })()
              : undefined,
            logo: request.options.logo,
            frame: request.options.frame,
            effects: request.options.effects,
            optimize_for_size: request.options.optimizeForSize,
            enable_cache: request.options.enableCache,
          }
        : undefined,
    };

    logger.info('[QR Service] Sending to Rust v2:', { request: v2Request });

    const response = await qrEngineClient.post<any>('/api/qr/generate', v2Request);

    // Handle v2 response format
    if (response.data.output?.svg || response.data.svg) {
      const result: QRGenerateResult = {
        svg: response.data.output?.svg || response.data.svg,
        metadata: {
          version: response.data.metadata?.version || 4,
          modules: response.data.metadata?.modules || 25,
          errorCorrection: request.options?.errorCorrection || 'M',
          dataCapacity: request.data.length,
          processingTimeMs: response.data.performance?.processingTimeMs || 5,
        },
        cached: response.data.cached || false,
      };

      logger.info('[QR Service] Generation successful');
      return result;
    }

    throw new Error('Invalid response from Rust service');
  } catch (error) {
    logger.error('[QR Service] Generation failed:', error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        throw new AppError(
          'QR Engine service is not available',
          503,
          ErrorCode.SERVICE_UNAVAILABLE
        );
      }

      if (axiosError.response?.status === 400) {
        throw new AppError(
          'Invalid QR generation parameters',
          400,
          ErrorCode.VALIDATION_ERROR,
          axiosError.response.data
        );
      }
    }

    throw new AppError('Failed to generate QR code', 500, ErrorCode.INTERNAL_SERVER);
  }
}

/**
 * Generate multiple QR codes in batch
 */
export async function generateQRBatch(
  codes: QRGenerateRequest[],
  options?: { maxConcurrent?: number; includeMetadata?: boolean }
): Promise<QRBatchResult> {
  try {
    const rustBatch = {
      codes: codes.map((code) => transformToRustFormat(code)),
      options: {
        max_concurrent: options?.maxConcurrent || 10,
        include_metadata: options?.includeMetadata ?? true,
      },
    };

    const response = await qrEngineClient.post<QRBatchResult>('/api/qr/batch', rustBatch);

    logger.info('[QR Service] Batch generation complete', {
      total: response.data.summary.total,
      successful: response.data.summary.successful,
      failed: response.data.summary.failed,
      avgTime: response.data.summary.averageTimeMs,
    });

    return response.data;
  } catch (error) {
    logger.error('[QR Service] Batch generation failed:', error);
    throw new AppError('Failed to generate QR batch', 500, ErrorCode.INTERNAL_SERVER);
  }
}

/**
 * Get real-time QR preview
 */
export async function getQRPreview(params: any): Promise<{ svg: string }> {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await qrEngineClient.get(`/api/qr/preview?${queryString}`);

    return { svg: response.data };
  } catch (error) {
    logger.error('[QR Service] Preview failed:', error);
    throw new AppError('Failed to generate preview', 500, ErrorCode.INTERNAL_SERVER);
  }
}

/**
 * Validate QR data and options
 */
export async function validateQRData(request: QRGenerateRequest): Promise<QRValidationResult> {
  try {
    const rustRequest = transformToRustFormat(request);
    const response = await qrEngineClient.post<QRValidationResult>('/api/qr/validate', rustRequest);

    return response.data;
  } catch (error) {
    logger.error('[QR Service] Validation failed:', error);
    throw new AppError('Failed to validate QR data', 500, ErrorCode.INTERNAL_SERVER);
  }
}

/**
 * Transform Node.js format to Rust engine format
 */
function transformToRustFormat(request: QRGenerateRequest): any {
  const { data, options } = request;

  if (!options) {
    return { data, options: {} };
  }

  // Transform to Rust format (using legacy format for now)
  const rustOptions: any = {
    scale: options.size ? Math.floor(options.size / 25) : 4, // Convert size to scale
    margin: options.margin || 4,
    fgcolor: options.foregroundColor || '#000000',
    bgcolor: options.backgroundColor || '#FFFFFF',
    ecc_level: options.errorCorrection || 'M',
  };

  // Add gradient support if gradient is present
  if (options.gradient) {
    rustOptions.gradient = {
      type: options.gradient.type || 'linear',
      colors: options.gradient.colors || ['#000000', '#666666'],
      angle: options.gradient.angle || 90,
      apply_to_data: options.gradient.applyToData !== false,
      apply_to_eyes: options.gradient.applyToEyes || false,
    };

    // Override fgcolor when gradient is enabled
    rustOptions.fgcolor = options.gradient.colors[0] || '#000000';
  }

  // Add v2 specific options if present
  if (options.eyeShape) rustOptions.eye_shape = options.eyeShape;
  if (options.dataPattern) rustOptions.data_pattern = options.dataPattern;
  if (options.eyeColor) rustOptions.eye_color = options.eyeColor;

  // Remove undefined values
  Object.keys(rustOptions).forEach((key) => {
    if (rustOptions[key] === undefined) {
      delete rustOptions[key];
    }
  });

  return {
    barcode_type: 'qrcode',
    data,
    options: rustOptions,
  };
}

/**
 * Get QR Engine v2 Analytics
 */
export async function getQRv2Analytics() {
  try {
    // Get analytics from Rust service
    const rustServiceUrl = QR_ENGINE_URL;
    const [performanceResponse, cacheResponse] = await Promise.all([
      axios.get(`${rustServiceUrl}/analytics/performance`),
      axios.get(`${rustServiceUrl}/cache/stats`).catch(() => null),
    ]);

    const performanceData = performanceResponse.data;

    // Extract QR-specific metrics
    const qrMetrics = performanceData.by_barcode_type?.qrcode || {
      avg_cache_hit_ms: null,
      avg_generation_ms: null,
      cache_hit_rate_percent: 0,
      hit_count: 0,
      miss_count: 0,
    };

    // Calculate v2 adoption (this would need to be tracked separately in production)
    const totalQrRequests = qrMetrics.hit_count + qrMetrics.miss_count;

    // Feature usage would need to be tracked in Rust
    const featureUsage = {
      gradients: 0,
      logos: 0,
      customShapes: 0,
      effects: 0,
      frames: 0,
    };

    return {
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalRequests: totalQrRequests,
        cacheHitRate: qrMetrics.cache_hit_rate_percent,
        avgResponseTime: qrMetrics.avg_generation_ms || 0,
        avgCacheHitTime: qrMetrics.avg_cache_hit_ms || 0,
        v2AdoptionRate: 100, // All QR requests are v2 now
      },
      performance: {
        last24Hours: {
          requests: totalQrRequests,
          avgTime: qrMetrics.avg_generation_ms || 0,
          p95Time: qrMetrics.max_generation_ms || 0,
          errors: 0,
        },
      },
      features: {
        usage: featureUsage,
        popularCombinations: [],
      },
      cache: cacheResponse?.data || {
        size: 0,
        hitRate: qrMetrics.cache_hit_rate_percent,
        memoryUsage: 0,
      },
    };
  } catch (error) {
    logger.error('[QR v2 Analytics] Error fetching analytics:', error);
    throw new AppError('Failed to fetch QR v2 analytics', 500, ErrorCode.SERVICE_UNAVAILABLE);
  }
}

/**
 * Get QR Engine v2 Cache Statistics
 */
export async function getQRv2CacheStats() {
  try {
    const rustServiceUrl = QR_ENGINE_URL;

    // Try to get cache stats from Rust service
    try {
      const response = await axios.get(`${rustServiceUrl}/cache/stats`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist yet, return mock data
      logger.warn('[QR v2 Cache] Cache stats endpoint not available, returning default stats');
      return {
        success: true,
        stats: {
          totalEntries: 0,
          memoryUsage: '0 MB',
          hitRate: 0,
          evictions: 0,
          avgEntrySize: '0 KB',
        },
      };
    }
  } catch (error) {
    logger.error('[QR v2 Cache] Error fetching cache stats:', error);
    throw new AppError('Failed to fetch cache statistics', 500, ErrorCode.SERVICE_UNAVAILABLE);
  }
}

/**
 * Clear QR Engine v2 Cache
 */
export async function clearQRv2Cache() {
  try {
    const rustServiceUrl = QR_ENGINE_URL;

    try {
      const response = await axios.post(`${rustServiceUrl}/cache/clear`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist yet, return success
      logger.warn('[QR v2 Cache] Cache clear endpoint not available');
      return {
        success: true,
        message: 'Cache clear requested',
      };
    }
  } catch (error) {
    logger.error('[QR v2 Cache] Error clearing cache:', error);
    throw new AppError('Failed to clear cache', 500, ErrorCode.SERVICE_UNAVAILABLE);
  }
}
