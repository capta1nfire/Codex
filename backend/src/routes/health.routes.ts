import { Router, Request, Response } from 'express';
import * as os from 'os'; // Necesario para info del sistema
import { config } from '../config';
import logger from '../utils/logger'; // Aunque no se usa directamente, podría añadirse más logging

const router = Router();

// Interfaces (copiadas de index.ts, podrían moverse a un archivo de tipos si se usan en más sitios)
interface RustServiceStatus {
    status: string;
    error?: string;
    [key: string]: any;
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
    };
}
  
// Endpoint de salud para monitoreo
router.get('/', async (req: Request, res: Response) => {
    // Información básica del sistema
    const healthData: HealthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'codex-api-gateway',
        uptime: process.uptime(),
        memoryUsage: {
            total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
            free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
            processUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
        }
    };

    // Verificar conexión con el servicio Rust
    try {
        const rustServiceBaseUrl = config.RUST_SERVICE_URL.split('/').slice(0, 3).join('/');
        const rustHealthCheck = await fetch(`${rustServiceBaseUrl}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(1000) // Timeout de 1 segundo
        });
    
        if (rustHealthCheck.ok) {
            const rustHealth = await rustHealthCheck.json();
            healthData.dependencies = {
                rust_service: {
                    status: 'ok',
                    ...rustHealth
                }
            };
        } else {
            healthData.dependencies = {
                rust_service: {
                    status: 'degraded',
                    error: `HTTP ${rustHealthCheck.status}`
                }
            };
            healthData.status = 'degraded';
        }
    } catch (error) {
        healthData.dependencies = {
            rust_service: {
                status: 'unavailable',
                error: error instanceof Error ? error.message : 'Error desconocido'
            }
        };
        healthData.status = 'degraded';
    }
  
    const statusCode = healthData.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthData);
});

export const healthRoutes = router; 