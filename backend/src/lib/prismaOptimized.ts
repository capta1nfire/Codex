import { PrismaClient } from '@prisma/client';

import logger from '../utils/logger.js';

// Configuración optimizada de Prisma con pool de conexiones explícito
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// URL de base de datos con parámetros de pool
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithPooling = `${databaseUrl}?connection_limit=20&pool_timeout=10`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: urlWithPooling,
      },
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

// Event listeners para monitoreo
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    if (e.duration > 1000) {
      logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
    }
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning:', e);
});

// Middleware para métricas de rendimiento
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  if (after - before > 100) {
    logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
  }

  return result;
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
