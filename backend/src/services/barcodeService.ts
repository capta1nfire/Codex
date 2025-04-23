import { config } from '../config.js';
import { redis } from '../lib/redis.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { rustCallDurationSeconds } from '../utils/metrics.js';

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

  // Crear clave para caché Redis (puede ser la misma estructura JSON)
  const cacheKey = `barcode:${JSON.stringify({
    barcode_type: rustBarcodeType,
    data,
    options: options || {},
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
    const rustResponse = await fetch(config.RUST_SERVICE_URL, {
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
        ErrorCode.INTERNAL_ERROR
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
