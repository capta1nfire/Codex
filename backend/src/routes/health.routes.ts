import * as os from 'os'; // Necesario para info del sistema

import { Router, Request, Response } from 'express';

import { config } from '../config.js';
import prisma from '../lib/prisma.js';
// import logger from '../utils/logger'; // Remove unused import

const router = Router();

// Interfaces (copiadas de index.ts, podrían moverse a un archivo de tipos si se usan en más sitios)
interface RustServiceStatus {
  status: string;
  error?: string;
  [key: string]: unknown;
}

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  uptime: number;
  memoryUsage: {
    total: string;
    free: string;
    processUsage: string;
  };
  dependencies?: {
    rust_service: RustServiceStatus;
    db?: {
      status: string;
      error?: string;
      [key: string]: unknown;
    };
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     DependencyStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok, degraded, unavailable, error]
 *           description: Estado del servicio dependiente.
 *         error:
 *           type: string
 *           nullable: true
 *           description: Mensaje de error si el estado no es 'ok'.
 *     HealthData:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok, degraded]
 *           description: Estado general del servicio API Gateway.
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la comprobación.
 *         service:
 *           type: string
 *           example: codex-api-gateway
 *         uptime:
 *           type: number
 *           format: float
 *           description: Tiempo que lleva activo el proceso del servidor en segundos.
 *         memoryUsage:
 *           type: object
 *           properties:
 *             total:
 *               type: string
 *               description: Memoria total del sistema.
 *               example: 8192MB
 *             free:
 *               type: string
 *               description: Memoria libre del sistema.
 *               example: 4096MB
 *             processUsage:
 *               type: string
 *               description: Memoria usada por el proceso Node.js.
 *               example: 150MB
 *         dependencies:
 *           type: object
 *           properties:
 *             rust_service:
 *               $ref: '#/components/schemas/DependencyStatus'
 *             db:
 *               $ref: '#/components/schemas/DependencyStatus'
 */

// Endpoint de salud para monitoreo
/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Comprobar estado de salud del sistema
 *     description: Devuelve el estado actual del API Gateway y sus dependencias (Servicio Rust, Base de Datos).
 *     responses:
 *       200:
 *         description: El sistema está operativo (puede estar degradado si alguna dependencia falla).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthData'
 *       503:
 *         description: El sistema está degradado porque una o más dependencias críticas están caídas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthData'
 */
router.get('/', async (_req: Request, res: Response) => {
  // Información básica del sistema
  const healthData: HealthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'codex-api-gateway',
    uptime: process.uptime(),
    memoryUsage: {
      total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
      processUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
    },
  };

  // Verificar conexión con el servicio Rust
  try {
    const rustServiceBaseUrl = config.RUST_SERVICE_URL.split('/').slice(0, 3).join('/');
    const rustHealthCheck = await fetch(`${rustServiceBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(1000), // Timeout de 1 segundo
    });

    if (rustHealthCheck.ok) {
      const rustHealth = await rustHealthCheck.json();
      healthData.dependencies = {
        rust_service: {
          status: 'ok',
          ...rustHealth,
        },
      };
    } else {
      healthData.dependencies = {
        rust_service: {
          status: 'degraded',
          error: `HTTP ${rustHealthCheck.status}`,
        },
      };
      healthData.status = 'degraded';
    }
  } catch (error) {
    healthData.dependencies = {
      rust_service: {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    };
    healthData.status = 'degraded';
  }

  // Verificar conexión con la base de datos
  try {
    await prisma.$queryRaw`SELECT 1;`;
    healthData.dependencies = {
      ...healthData.dependencies,
      db: { status: 'ok' },
    };
  } catch (err) {
    healthData.dependencies = {
      ...healthData.dependencies,
      db: { status: 'error', error: err instanceof Error ? err.message : 'Desconocido' },
    };
    healthData.status = 'degraded';
  }

  const statusCode = healthData.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

export const healthRoutes = router;
