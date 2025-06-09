import axios, { AxiosError } from 'axios';
import { config } from '../config.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { QRGenerateRequest, QROptions } from '../schemas/qrSchemas.js';

const QR_ENGINE_URL = process.env.RUST_SERVICE_URL || 'http://localhost:3002';
const QR_ENGINE_TIMEOUT = parseInt(process.env.QR_ENGINE_TIMEOUT || '10000', 10);

// QR Engine v2 client
const qrEngineClient = axios.create({
  baseURL: QR_ENGINE_URL,
  timeout: QR_ENGINE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log requests in development
if (process.env.NODE_ENV === 'development') {
  qrEngineClient.interceptors.request.use(request => {
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
    // Transform options to Rust format
    const rustRequest = transformToRustFormat(request);
    
    const response = await qrEngineClient.post<QRGenerateResult>('/api/qr/generate', rustRequest);
    
    logger.info('[QR Service] Generation successful', {
      modules: response.data.metadata.modules,
      version: response.data.metadata.version,
      processingTime: response.data.metadata.processingTimeMs
    });
    
    return response.data;
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
    
    throw new AppError(
      'Failed to generate QR code',
      500,
      ErrorCode.INTERNAL_ERROR
    );
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
      codes: codes.map(code => transformToRustFormat(code)),
      options: {
        max_concurrent: options?.maxConcurrent || 10,
        include_metadata: options?.includeMetadata ?? true
      }
    };
    
    const response = await qrEngineClient.post<QRBatchResult>('/api/qr/batch', rustBatch);
    
    logger.info('[QR Service] Batch generation complete', {
      total: response.data.summary.total,
      successful: response.data.summary.successful,
      failed: response.data.summary.failed,
      avgTime: response.data.summary.averageTimeMs
    });
    
    return response.data;
  } catch (error) {
    logger.error('[QR Service] Batch generation failed:', error);
    throw new AppError(
      'Failed to generate QR batch',
      500,
      ErrorCode.INTERNAL_ERROR
    );
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
    throw new AppError(
      'Failed to generate preview',
      500,
      ErrorCode.INTERNAL_ERROR
    );
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
    throw new AppError(
      'Failed to validate QR data',
      500,
      ErrorCode.INTERNAL_ERROR
    );
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
  
  // Transform camelCase to snake_case for Rust
  const rustOptions: any = {
    size: options.size,
    margin: options.margin,
    error_correction: options.errorCorrection,
    
    // Shapes
    eye_shape: options.eyeShape?.replace(/-/g, '_'),
    data_pattern: options.dataPattern,
    
    // Colors
    foreground_color: options.foregroundColor,
    background_color: options.backgroundColor,
    eye_color: options.eyeColor,
    
    // Advanced features
    gradient: options.gradient ? {
      type: options.gradient.type,
      colors: options.gradient.colors,
      angle: options.gradient.angle,
      center_x: options.gradient.centerX,
      center_y: options.gradient.centerY
    } : undefined,
    
    logo: options.logo ? {
      data: options.logo.data,
      size: options.logo.size,
      padding: options.logo.padding,
      background_color: options.logo.backgroundColor
    } : undefined,
    
    frame: options.frame ? {
      style: options.frame.style,
      color: options.frame.color,
      width: options.frame.width,
      text: options.frame.text,
      text_position: options.frame.textPosition
    } : undefined,
    
    effects: options.effects?.map(effect => ({
      type: effect.type,
      intensity: effect.intensity,
      color: effect.color
    })),
    
    // Performance
    optimize_for_size: options.optimizeForSize,
    enable_cache: options.enableCache
  };
  
  // Remove undefined values
  Object.keys(rustOptions).forEach(key => {
    if (rustOptions[key] === undefined) {
      delete rustOptions[key];
    }
  });
  
  return { data, options: rustOptions };
}