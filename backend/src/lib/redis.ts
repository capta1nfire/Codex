import { createClient, RedisClientType } from 'redis';

import { config } from '../config';
import logger from '../utils/logger';

// Crear cliente Redis
const redisClient = createClient({
  url: config.REDIS_URL, // Usar URL de la configuración
});

redisClient.on('error', (err) => logger.error('[Redis] Client Error', err));

redisClient.on('connect', () => logger.info('[Redis] Client connected'));

redisClient.on('reconnecting', () => logger.warn('[Redis] Client reconnecting'));

redisClient.on('end', () => logger.info('[Redis] Client connection closed'));

// Conectar al servidor Redis
// Es importante manejar la conexión asíncrona
let isConnected = false;
const connectRedis = async () => {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (err) {
      logger.error('[Redis] Failed to connect:', err);
      // Podríamos intentar reconectar o simplemente loguear
    }
  }
};

// Llamar a la función de conexión al iniciar
void connectRedis();

// Exportar el cliente conectado (o que intenta conectar)
// El tipo explícito ayuda con el autocompletado
export const redis: RedisClientType = redisClient as RedisClientType;

// Opcional: Función para obtener el cliente asegurando conexión
// export const getRedisClient = async (): Promise<RedisClientType | null> => {
//   if (!isConnected) {
//     await connectRedis();
//   }
//   return isConnected ? redisClient as RedisClientType : null;
// };
