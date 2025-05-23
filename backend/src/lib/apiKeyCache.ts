import { redis } from './redis.js';
import logger from '../utils/logger.js';

// Configuración del caché de API Keys
const CACHE_PREFIX = 'apikey:validated:';
const CACHE_TTL = 3600; // 1 hora en segundos
const NEGATIVE_CACHE_TTL = 300; // 5 minutos para claves inválidas

export interface ApiKeyCacheEntry {
  userId: string;
  valid: boolean;
  timestamp: number;
}

export class ApiKeyCache {
  private static instance: ApiKeyCache;
  
  private constructor() {}
  
  static getInstance(): ApiKeyCache {
    if (!ApiKeyCache.instance) {
      ApiKeyCache.instance = new ApiKeyCache();
    }
    return ApiKeyCache.instance;
  }

  /**
   * Genera la clave de caché para una API Key
   */
  private getCacheKey(apiKey: string): string {
    // Usar hash SHA-256 de la API key como clave de caché
    // para evitar almacenar la API key en texto plano
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    return `${CACHE_PREFIX}${hash}`;
  }

  /**
   * Obtiene una entrada del caché de API Keys
   */
  async get(apiKey: string): Promise<ApiKeyCacheEntry | null> {
    try {
      const cacheKey = this.getCacheKey(apiKey);
      const cached = await redis.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      const entry: ApiKeyCacheEntry = JSON.parse(cached);
      
      // Verificar que no haya expirado (doble verificación)
      const now = Date.now();
      const age = now - entry.timestamp;
      const maxAge = entry.valid ? CACHE_TTL * 1000 : NEGATIVE_CACHE_TTL * 1000;
      
      if (age > maxAge) {
        // Expirado, eliminar del caché
        await this.delete(apiKey);
        return null;
      }

      return entry;
    } catch (error) {
      logger.error('Error reading from API key cache:', error);
      return null;
    }
  }

  /**
   * Almacena una entrada en el caché de API Keys
   */
  async set(apiKey: string, userId: string | null, valid: boolean): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(apiKey);
      const entry: ApiKeyCacheEntry = {
        userId: userId || '',
        valid,
        timestamp: Date.now(),
      };

      const ttl = valid ? CACHE_TTL : NEGATIVE_CACHE_TTL;
      await redis.setEx(cacheKey, ttl, JSON.stringify(entry));
      
      logger.debug(`API key cache set: ${valid ? 'valid' : 'invalid'} for user ${userId}`);
    } catch (error) {
      logger.error('Error writing to API key cache:', error);
    }
  }

  /**
   * Elimina una entrada del caché
   */
  async delete(apiKey: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(apiKey);
      await redis.del(cacheKey);
    } catch (error) {
      logger.error('Error deleting from API key cache:', error);
    }
  }

  /**
   * Invalida todas las entradas de caché para un usuario específico
   * (útil cuando se regenera la API key)
   */
  async invalidateUserApiKeys(userId: string): Promise<void> {
    try {
      // Buscar todas las claves de caché que contengan este userId
      const pattern = `${CACHE_PREFIX}*`;
      const keys = await redis.keys(pattern);
      
      const keysToDelete: string[] = [];
      
      for (const key of keys) {
        try {
          const cached = await redis.get(key);
          if (cached) {
            const entry: ApiKeyCacheEntry = JSON.parse(cached);
            if (entry.userId === userId) {
              keysToDelete.push(key);
            }
          }
        } catch (parseError) {
          // Si no se puede parsear, mejor eliminarlo
          keysToDelete.push(key);
        }
      }

      if (keysToDelete.length > 0) {
        if (keysToDelete.length === 1) {
          await redis.del(keysToDelete[0]);
        } else {
          await redis.del(keysToDelete);
        }
        logger.info(`Invalidated ${keysToDelete.length} API key cache entries for user ${userId}`);
      }
    } catch (error) {
      logger.error('Error invalidating user API keys cache:', error);
    }
  }

  /**
   * Limpia las entradas expiradas del caché
   */
  async cleanup(): Promise<void> {
    try {
      const pattern = `${CACHE_PREFIX}*`;
      const keys = await redis.keys(pattern);
      
      let cleanedCount = 0;
      const now = Date.now();

      for (const key of keys) {
        try {
          const cached = await redis.get(key);
          if (cached) {
            const entry: ApiKeyCacheEntry = JSON.parse(cached);
            const age = now - entry.timestamp;
            const maxAge = entry.valid ? CACHE_TTL * 1000 : NEGATIVE_CACHE_TTL * 1000;
            
            if (age > maxAge) {
              await redis.del(key);
              cleanedCount++;
            }
          }
        } catch (parseError) {
          // Si no se puede parsear, eliminarlo
          await redis.del(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired API key cache entries`);
      }
    } catch (error) {
      logger.error('Error during API key cache cleanup:', error);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getStats(): Promise<{
    totalEntries: number;
    validEntries: number;
    invalidEntries: number;
    expiredEntries: number;
  }> {
    try {
      const pattern = `${CACHE_PREFIX}*`;
      const keys = await redis.keys(pattern);
      
      let totalEntries = 0;
      let validEntries = 0;
      let invalidEntries = 0;
      let expiredEntries = 0;
      
      const now = Date.now();

      for (const key of keys) {
        try {
          const cached = await redis.get(key);
          if (cached) {
            totalEntries++;
            const entry: ApiKeyCacheEntry = JSON.parse(cached);
            const age = now - entry.timestamp;
            const maxAge = entry.valid ? CACHE_TTL * 1000 : NEGATIVE_CACHE_TTL * 1000;
            
            if (age > maxAge) {
              expiredEntries++;
            } else if (entry.valid) {
              validEntries++;
            } else {
              invalidEntries++;
            }
          }
        } catch (parseError) {
          expiredEntries++;
        }
      }

      return {
        totalEntries,
        validEntries,
        invalidEntries,
        expiredEntries,
      };
    } catch (error) {
      logger.error('Error getting API key cache stats:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        invalidEntries: 0,
        expiredEntries: 0,
      };
    }
  }
}

export const apiKeyCache = ApiKeyCache.getInstance(); 