import { config } from '../config.js';
import { redis } from '../lib/redis.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rustCallDurationSeconds } from '../utils/metrics.js';
import { fetchWithPool } from '../lib/httpClient.js';

// Mapeo de tipos de códigos de barras (movido desde index.ts)
const barcodeTypeMapping: Record<string, string> = {
  qrcode: 'qr',
  code128: 'code128',
  pdf417: 'pdf417',
  ean13: 'ean13',
  upca: 'upca',
  code39: 'code39',
  datamatrix: 'datamatrix',
};

// Tiempo de expiración para las claves en Redis (en segundos)
const REDIS_CACHE_EXPIRATION_SECONDS = config.CACHE_MAX_AGE; // Usar el mismo valor de config

// Interfaces para batch processing
interface BatchBarcodeRequest {
  barcodes: SingleBarcodeRequest[];
  options?: BatchOptions;
}

interface SingleBarcodeRequest {
  id?: string;
  barcode_type: string;
  data: string;
  options?: Record<string, unknown>;
}

interface BatchOptions {
  max_concurrent?: number;
  fail_fast?: boolean;
  include_metadata?: boolean;
}

interface BatchResult {
  id: string;
  success: boolean;
  svgString?: string;
  error?: string;
  metadata?: BatchResultMetadata;
}

interface BatchResultMetadata {
  generation_time_ms: number;
  from_cache: boolean;
  barcode_type: string;
  data_size: number;
}

interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  total_time_ms: number;
  cache_hits: number;
  cache_misses: number;
}

interface BatchResponse {
  success: boolean;
  results: BatchResult[];
  summary: BatchSummary;
}

/**
 * Genera un código de barras SVG, utilizando caché Redis y llamando al servicio Rust.
 * @param frontendBarcodeType - El tipo de código solicitado por el frontend.
 * @param data - Los datos a codificar.
 * @param options - Opciones de generación.
 * @returns El string SVG del código generado.
 * @throws {AppError} Si ocurre un error durante la generación o llamada al servicio.
 */
export const generateBarcode = async (
  frontendBarcodeType: string,
  data: string,
  options?: Record<string, unknown>
): Promise<string> => {
  const rustBarcodeType = barcodeTypeMapping[frontendBarcodeType] || frontendBarcodeType;
  logger.debug(
    `[BarcodeService] Tipo recibido: ${frontendBarcodeType}, convertido a: ${rustBarcodeType}`
  );

  // Crear clave para caché Redis (consistente con lo enviado a Rust)
  const cacheKey = `barcode:${JSON.stringify({
    barcode_type: rustBarcodeType,
    data,
    options: options || null, // Usar null si options es falsy, igual que en requestBody
  })}`;

  // 1. Verificar caché Redis
  try {
    const cachedSvg = await redis.get(cacheKey);
    if (cachedSvg) {
      logger.info(`[BarcodeService] Cache HIT en Redis para tipo: ${frontendBarcodeType}`);
      // Aquí podríamos incrementar contadores en Redis si quisiéramos stats
      // await redis.incr('cache_hits');
      // await redis.incr(`cache_hits:${frontendBarcodeType}`);
      return cachedSvg; // Devolver SVG desde Redis
    }
  } catch (redisError) {
    logger.error('[BarcodeService] Error al leer de Redis cache:', redisError);
    // No lanzar error aquí, simplemente continuar como si fuera un cache miss
  }

  // 2. Cache MISS: Llamar al servicio Rust
  logger.info(
    `[BarcodeService] Cache MISS en Redis para tipo: ${frontendBarcodeType}. Llamando a Rust...`
  );
  // Podríamos incrementar contador de misses si quisiéramos stats
  // await redis.incr('cache_misses');
  // await redis.incr(`cache_misses:${frontendBarcodeType}`);

  // Registrar inicio de llamada a Rust para métricas
  const endRustCallTimer = rustCallDurationSeconds.startTimer({ barcode_type: rustBarcodeType });

  const requestBody = {
    barcode_type: rustBarcodeType,
    data: data,
    options: options || null,
  };

  try {
    // --- Llamada HTTP al Microservicio Rust ---
    const rustUrl = config.RUST_SERVICE_URL.endsWith('/generate') 
      ? config.RUST_SERVICE_URL 
      : `${config.RUST_SERVICE_URL}/generate`;
    const rustResponse = await fetchWithPool(rustUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config.RUST_SERVICE_TIMEOUT_MS || 5000),
    });
    // ---------------------------------------

    // Registrar fin de llamada (éxito o error manejado después)
    endRustCallTimer();

    // 3. Manejar respuesta de Rust
    if (!rustResponse.ok) {
      let errorBody = {
        error: `Servicio Rust devolvió error ${rustResponse.status}`,
        suggestion: 'Verifica los logs del servicio Rust.',
      };
      try {
        const rustErrorData = await rustResponse.json();
        errorBody = {
          error: rustErrorData.error || `Servicio Rust devolvió error ${rustResponse.status}`,
          suggestion: rustErrorData.suggestion,
        };
      } catch (e) {
        logger.warn('[BarcodeService] No se pudo parsear error JSON de Rust', e);
        try {
          const textError = await rustResponse.text();
          errorBody.error = textError || errorBody.error;
        } catch {
          /* Ignorar si tampoco es texto */
        }
      }
      logger.error(
        `[BarcodeService] Error desde servicio Rust: Status ${rustResponse.status}`,
        errorBody
      );
      throw new AppError(errorBody.error, rustResponse.status, ErrorCode.SERVICE_UNAVAILABLE, {
        suggestion: errorBody.suggestion,
      });
    }

    // 4. Procesar respuesta exitosa de Rust
    let rustResult;
    try {
      rustResult = await rustResponse.json();
    } catch (parseError) {
      logger.error('[BarcodeService] Error al parsear JSON de Rust:', parseError);
      throw new AppError(
        'Respuesta inválida del servicio de generación',
        500,
        ErrorCode.INTERNAL_SERVER
      );
    }

    if (rustResult.success && typeof rustResult.svgString === 'string') {
      logger.info('[BarcodeService] Respuesta SVG exitosa recibida desde Rust.');

      // 5. Guardar resultado en caché Redis CON EXPIRACIÓN
      try {
        await redis.set(cacheKey, rustResult.svgString, {
          EX: REDIS_CACHE_EXPIRATION_SECONDS, // Establecer expiración en segundos
        });
        logger.info(
          `[BarcodeService] Resultado guardado en Redis cache (Key: ${cacheKey.substring(0, 50)}...)`
        );
      } catch (redisSetError) {
        logger.error('[BarcodeService] Error al escribir en Redis cache:', redisSetError);
        // No lanzar error aquí, la solicitud principal tuvo éxito
      }

      // Devolver el SVG
      return rustResult.svgString;
    } else {
      logger.error('[BarcodeService] Respuesta inesperada o inválida desde Rust:', rustResult);
      throw new AppError(
        rustResult.error || 'Respuesta inválida del servicio de generación',
        400,
        ErrorCode.VALIDATION_ERROR,
        { suggestion: rustResult.suggestion }
      );
    }
  } catch (error) {
    // Relanzar errores AppError o crear uno nuevo (igual que antes)
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('[BarcodeService] Error durante llamada a Rust o procesamiento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new AppError(
      `Error contactando servicio de generación: ${errorMessage}`,
      503,
      ErrorCode.SERVICE_UNAVAILABLE
    );
  }
};

/**
 * Genera múltiples códigos de barras en batch utilizando el servicio Rust
 * @param barcodes - Array de códigos a generar
 * @param options - Opciones de batch processing
 * @returns Respuesta con todos los resultados y resumen
 */
export const generateBarcodesBatch = async (
  barcodes: SingleBarcodeRequest[],
  options?: BatchOptions
): Promise<BatchResponse> => {
  const startTime = Date.now();
  logger.info(`[BarcodeService] Iniciando batch processing con ${barcodes.length} códigos`);

  // Convertir tipos de códigos de barras
  const convertedBarcodes = barcodes.map((barcode, index) => ({
    ...barcode,
    id: barcode.id || `batch_${index + 1}`,
    barcode_type: barcodeTypeMapping[barcode.barcode_type] || barcode.barcode_type,
  }));

  const requestBody: BatchBarcodeRequest = {
    barcodes: convertedBarcodes,
    options: {
      max_concurrent: options?.max_concurrent || 10,
      fail_fast: options?.fail_fast || false,
      include_metadata: options?.include_metadata || true,
    },
  };

  try {
    // Llamada HTTP al microservicio Rust
    const rustResponse = await fetchWithPool(`${config.RUST_SERVICE_URL.replace('/generate', '/batch')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout((config.RUST_SERVICE_TIMEOUT_MS || 5000) * 2), // Timeout más largo para batch
    });

    if (!rustResponse.ok) {
      let errorBody = {
        error: `Servicio Rust devolvió error ${rustResponse.status}`,
        suggestion: 'Verifica los logs del servicio Rust.',
      };

      try {
        const rustErrorData = await rustResponse.json();
        errorBody = {
          error: rustErrorData.error || errorBody.error,
          suggestion: rustErrorData.suggestion || errorBody.suggestion,
        };
      } catch (e) {
        logger.warn('[BarcodeService] No se pudo parsear error JSON de Rust para batch', e);
      }

      logger.error(
        `[BarcodeService] Error en batch desde servicio Rust: Status ${rustResponse.status}`,
        errorBody
      );
      throw new AppError(errorBody.error, rustResponse.status, ErrorCode.SERVICE_UNAVAILABLE, {
        suggestion: errorBody.suggestion,
      });
    }

    // Procesar respuesta exitosa
    const rustResult = await rustResponse.json();

    if (rustResult.success && Array.isArray(rustResult.results)) {
      const totalTime = Date.now() - startTime;

      logger.info(`[BarcodeService] Batch processing completado en ${totalTime}ms`, {
        total: rustResult.summary.total,
        successful: rustResult.summary.successful,
        failed: rustResult.summary.failed,
        cache_hits: rustResult.summary.cache_hits,
        cache_misses: rustResult.summary.cache_misses,
      });

      // Actualizar tiempos con el tiempo total del backend
      const updatedSummary = {
        ...rustResult.summary,
        total_time_ms: totalTime,
      };

      return {
        success: true,
        results: rustResult.results,
        summary: updatedSummary,
      };
    } else {
      logger.error('[BarcodeService] Respuesta inválida en batch desde Rust:', rustResult);
      throw new AppError(
        rustResult.error || 'Respuesta inválida del servicio de generación batch',
        400,
        ErrorCode.VALIDATION_ERROR,
        { suggestion: rustResult.suggestion }
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('[BarcodeService] Error durante batch processing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new AppError(
      `Error en batch processing: ${errorMessage}`,
      503,
      ErrorCode.SERVICE_UNAVAILABLE
    );
  }
};
