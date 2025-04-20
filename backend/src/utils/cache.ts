import { config } from '../config';
import logger from './logger';

// Caché en memoria simple
export const responseCache = new Map<string, { data: any, timestamp: number }>();
export const CACHE_TTL = config.CACHE_MAX_AGE * 1000; // Tiempo de vida del caché en ms

// Estadísticas del caché (exportables para el endpoint /metrics)
export const cacheStats = {
  hits: 0,
  misses: 0,
  // Estructura para estadísticas por tipo
  byType: {} as Record<string, { hits: number, misses: number }>
};

// Función para limpiar entradas caducadas del caché
const cleanCache = () => {
  const now = Date.now();
  let removedCount = 0;
  for (const [key, { timestamp }] of responseCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      responseCache.delete(key);
      removedCount++;
    }
  }
  if (removedCount > 0) {
    logger.info(`[Cache] Limpieza: ${removedCount} entradas caducadas eliminadas.`);
  }
};

// Limpiar caché periódicamente
setInterval(cleanCache, 60 * 1000); // Limpiar cada minuto

logger.info('[Cache] Sistema de caché en memoria inicializado.'); 