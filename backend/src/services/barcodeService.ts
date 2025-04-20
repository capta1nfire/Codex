import { config } from '../config';
import logger from '../utils/logger';
import { responseCache, CACHE_TTL, cacheStats } from '../utils/cache';
import { AppError, ErrorCode } from '../utils/errors'; // Importar para errores

// Mapeo de tipos de códigos de barras (movido desde index.ts)
const barcodeTypeMapping: Record<string, string> = {
    'qrcode': 'qr',
    'code128': 'code128',
    'pdf417': 'pdf417',
    'ean13': 'ean13',
    'upca': 'upca',
    'code39': 'code39',
    'datamatrix': 'datamatrix'
};

/**
 * Genera un código de barras SVG, utilizando caché y llamando al servicio Rust.
 * @param frontendBarcodeType - El tipo de código solicitado por el frontend.
 * @param data - Los datos a codificar.
 * @param options - Opciones de generación.
 * @returns El string SVG del código generado.
 * @throws {AppError} Si ocurre un error durante la generación o llamada al servicio.
 */
export const generateBarcode = async (
    frontendBarcodeType: string,
    data: string,
    options?: Record<string, any>
): Promise<string> => {

    // Convertir el tipo al formato esperado por Rust
    const rustBarcodeType = barcodeTypeMapping[frontendBarcodeType] || frontendBarcodeType;
    logger.debug(`[BarcodeService] Tipo recibido: ${frontendBarcodeType}, convertido a: ${rustBarcodeType}`);

    // Crear clave para caché
    const cacheKey = JSON.stringify({
        barcode_type: rustBarcodeType,
        data,
        options: options || null
    });

    // 1. Verificar caché
    if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
            logger.info(`[BarcodeService] Cache HIT para tipo: ${frontendBarcodeType}, datos: ${data.substring(0, 20)}...`);
            if (!cacheStats.byType[frontendBarcodeType]) {
                cacheStats.byType[frontendBarcodeType] = { hits: 0, misses: 0 };
            }
            cacheStats.byType[frontendBarcodeType].hits++;
            cacheStats.hits++;
            // Devolver el SVG directamente desde el caché
            // Asegurarse de que el caché realmente contiene el svgString
            if (cachedResponse.data && typeof cachedResponse.data.svgString === 'string') {
                return cachedResponse.data.svgString;
            } else {
                 logger.warn(`[BarcodeService] Cache HIT pero faltaba svgString para key: ${cacheKey}`);
                 responseCache.delete(cacheKey); // Eliminar entrada corrupta
            }
        } else {
            // Eliminar caché expirado
            responseCache.delete(cacheKey);
            logger.info(`[BarcodeService] Cache EXPIRED para key: ${cacheKey}`);
        }
    }

    // 2. Cache MISS o Expirado: Llamar al servicio Rust
    logger.info(`[BarcodeService] Cache MISS para tipo: ${frontendBarcodeType}. Llamando a Rust...`);
    if (!cacheStats.byType[frontendBarcodeType]) {
        cacheStats.byType[frontendBarcodeType] = { hits: 0, misses: 0 };
    }
    cacheStats.byType[frontendBarcodeType].misses++;
    cacheStats.misses++;

    const requestBody = {
        barcode_type: rustBarcodeType,
        data: data,
        options: options || null
    };

    try {
        const rustResponse = await fetch(config.RUST_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            // Añadir un timeout razonable a la llamada fetch
            signal: AbortSignal.timeout(config.RUST_SERVICE_TIMEOUT_MS || 5000) // Timeout de 5s por defecto
        });

        // 3. Manejar respuesta de Rust
        if (!rustResponse.ok) {
            let errorBody = { error: `Servicio Rust devolvió error ${rustResponse.status}`, suggestion: 'Verifica los logs del servicio Rust.' };
            try {
                const rustErrorData = await rustResponse.json();
                errorBody = { 
                    error: rustErrorData.error || `Servicio Rust devolvió error ${rustResponse.status}`,
                    suggestion: rustErrorData.suggestion
                 }; 
            } catch (e) {
                 logger.warn('[BarcodeService] No se pudo parsear error JSON de Rust', e);   
                 try {
                     const textError = await rustResponse.text();
                     errorBody.error = textError || errorBody.error;
                 } catch (textE) { /* Ignorar si tampoco es texto */ }
            }
            logger.error(`[BarcodeService] Error desde servicio Rust: Status ${rustResponse.status}`, errorBody);
            // Lanzar un AppError para que lo capture el errorHandler
            throw new AppError(
                errorBody.error, 
                rustResponse.status, // Usar el status code de Rust si es < 500, sino 503?
                ErrorCode.SERVICE_UNAVAILABLE, // O un código más específico si Rust lo devuelve
                { suggestion: errorBody.suggestion }
            );
        }

        // 4. Procesar respuesta exitosa de Rust
        let rustResult;
        try {
            rustResult = await rustResponse.json();
        } catch (parseError) {
            logger.error("[BarcodeService] Error al parsear JSON de Rust:", parseError);
            throw new AppError("Respuesta inválida del servicio de generación", 500, ErrorCode.INTERNAL_ERROR);
        }

        if (rustResult.success && typeof rustResult.svgString === 'string') {
            logger.info('[BarcodeService] Respuesta SVG exitosa recibida desde Rust.');
            
            // Guardar en caché
            responseCache.set(cacheKey, {
                data: rustResult,
                timestamp: Date.now()
            });
            
            // Devolver el SVG
            return rustResult.svgString;
        } else {
            logger.error('[BarcodeService] Respuesta inesperada o inválida desde Rust:', rustResult);
            throw new AppError(
                rustResult.error || 'Respuesta inválida del servicio de generación', 
                400, // Asumimos que es un bad request si success no es true o falta svgString
                ErrorCode.VALIDATION_ERROR, // O un código más adecuado
                { suggestion: rustResult.suggestion }
            );
        }

    } catch (error) {
        // Si el error ya es un AppError, relanzarlo para que lo capture el handler
        if (error instanceof AppError) {
            throw error; 
        }
        // Capturar errores de red (fetch, timeout) u otros errores inesperados
        logger.error('[BarcodeService] Error durante llamada a Rust o procesamiento:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        throw new AppError(`Error contactando servicio de generación: ${errorMessage}`, 503, ErrorCode.SERVICE_UNAVAILABLE);
    }
}; 