/**
 * Redis Cache Wrapper
 * 
 * Wrapper para funcionalidades de caché con Redis
 */

import { redis } from './redis.js';
import logger from '../utils/logger.js';

class RedisCache {
  /**
   * Obtener valor del cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch (error) {
      logger.error(`[RedisCache] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establecer valor con TTL (Time To Live)
   */
  async setWithTTL(key: string, value: string, ttl: number): Promise<void> {
    try {
      await redis.setEx(key, ttl, value);
    } catch (error) {
      logger.error(`[RedisCache] Error setting key ${key}:`, error);
    }
  }

  /**
   * Eliminar una o más claves
   */
  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.error(`[RedisCache] Error deleting keys:`, error);
    }
  }

  /**
   * Buscar claves por patrón
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      logger.error(`[RedisCache] Error searching keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Publicar mensaje en un canal
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await redis.publish(channel, message);
    } catch (error) {
      logger.error(`[RedisCache] Error publishing to channel ${channel}:`, error);
    }
  }

  /**
   * Duplicar cliente para suscripciones
   */
  duplicate() {
    return redis.duplicate();
  }

  /**
   * Vaciar toda la base de datos (usar con precaución)
   */
  async flushall(): Promise<void> {
    try {
      await redis.flushAll();
    } catch (error) {
      logger.error('[RedisCache] Error flushing database:', error);
    }
  }
}

// Exportar instancia única
export const redisCache = new RedisCache();