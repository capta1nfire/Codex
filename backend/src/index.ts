import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { check, validationResult } from 'express-validator';
import xss from 'xss-clean';
// Importar compression para respuestas comprimidas
import compression from 'compression';
// Importar os para obtener información del sistema
import * as os from 'os';
// Importar fs y https para soporte SSL
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
// Importar middlewares de manejo de errores
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
// Importar el logger
import logger from './utils/logger';
// Importar la configuración del servidor
import { startServer } from './server-config';
// Importar configuración centralizada
import { config } from './config';
// Importar módulos de autenticación
import { authMiddleware } from './middleware/authMiddleware';
// Importar rutas
import { authRoutes } from './routes/auth.routes';
// Importar el servicio de códigos de barras
import { generateBarcode } from './services/barcodeService';
// Importar estadísticas de caché para /metrics
import { cacheStats, responseCache } from './utils/cache';
// ¡Ya NO importamos nada de 'rust_generator' aquí!

// Interfaces
interface RustServiceStatus {
  status: string;
  error?: string;
  [key: string]: any; // Para otras propiedades que pueda tener
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

const app = express();

// Aplicar middleware de seguridad
app.use(helmet()); // Seguridad mediante headers HTTP

// Aplicar compresión a todas las respuestas
app.use(compression());

// Configuración de CORS restringido
app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    if (config.ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = `El origen ${origin} no está permitido por la política CORS`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Configuración de límite de tasa
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP, por favor inténtelo de nuevo después de 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar limitador a todas las solicitudes
app.use(limiter);

// Parse JSON body
app.use(express.json({ limit: config.MAX_REQUEST_SIZE })); // Limite el tamaño del cuerpo a 1MB

// Prevenir ataques XSS
app.use(xss());

// Caché para recursos estáticos (si existieran)
app.use(express.static('public', {
  maxAge: config.CACHE_MAX_AGE * 1000, // Cache-Control en milisegundos
  etag: true, // Habilitar ETags
  lastModified: true // Habilitar Last-Modified
}));

// Middleware para validación de solicitudes
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// Configurar autenticación
app.use(authMiddleware.configurePassport());
app.use(authMiddleware.apiKeyStrategy);

// Configurar rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta principal
app.get('/', (req: Request, res: Response) => {
  // Configurar headers de caché para respuestas inmutables
  res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
  res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
});

// Endpoint de salud para monitoreo
app.get('/health', async (req: Request, res: Response) => {
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
    // Extraer la URL base del servicio Rust para el health check
    const rustServiceBaseUrl = config.RUST_SERVICE_URL.split('/').slice(0, 3).join('/'); // Obtiene http://localhost:3002
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
    // Si no podemos conectar con el servicio Rust
    healthData.dependencies = {
      rust_service: {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    };
    healthData.status = 'degraded';
  }
  
  // Enviar respuesta con el estado adecuado
  const statusCode = healthData.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Validadores para el endpoint de generación
const generateValidators = [
  check('barcode_type')
    .exists().withMessage('El tipo de código de barras es obligatorio')
    .isString().withMessage('El tipo de código de barras debe ser un string'),
  
  check('data')
    .exists().withMessage('Los datos a codificar son obligatorios')
    .isString().withMessage('Los datos a codificar deben ser un string')
    .trim()
    .notEmpty().withMessage('Los datos a codificar no pueden estar vacíos')
    .isLength({ max: 1000 }).withMessage('Los datos a codificar no pueden exceder 1000 caracteres'),
  
  check('options')
    .optional()
    .isObject().withMessage('Las opciones deben ser un objeto')
];

// Ruta para generar códigos (simplificada, usa el servicio)
app.post('/generate', generateValidators, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  const { barcode_type, data, options } = req.body;

  try {
    logger.info(`[Route:/generate] Solicitud recibida para tipo: ${barcode_type}`);
    const svgString = await generateBarcode(barcode_type, data, options);
    
    // Establecer headers de caché para la respuesta SVG
    res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
    
    res.status(200).json({
      success: true,
      svgString
    });

  } catch (error) {
    // Pasar el error al errorHandler centralizado
    logger.error(`[Route:/generate] Error procesando solicitud: ${error instanceof Error ? error.message : error}`)
    next(error); 
  }
});

// Alias para la ruta /generator (simplificado, usa el servicio)
app.all('/generator', generateValidators, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  const { barcode_type, data, options } = req.body;

  try {
    logger.info(`[Route:/generator] Solicitud recibida para tipo: ${barcode_type}`);
    const svgString = await generateBarcode(barcode_type, data, options);
    
    // Establecer headers de caché para la respuesta SVG
    res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
    
    res.status(200).json({
      success: true,
      svgString
    });

  } catch (error) {
    // Pasar el error al errorHandler centralizado
    logger.error(`[Route:/generator] Error procesando solicitud: ${error instanceof Error ? error.message : error}`)
    next(error);
  }
});

// Endpoint para métricas y estadísticas de caché (ahora usa stats de cache.ts)
app.get('/metrics', (req: Request, res: Response) => {
  // Calcular la tasa de aciertos del caché
  const totalRequests = cacheStats.hits + cacheStats.misses;
  const cacheHitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;
  
  // Preparar estadísticas por tipo de código
  const byBarcodeType: Record<string, any> = {};
  
  for (const [type, stats] of Object.entries(cacheStats.byType)) {
    const typeRequests = stats.hits + stats.misses;
    const typeHitRate = typeRequests > 0 ? (stats.hits / typeRequests) * 100 : 0;
    
    byBarcodeType[type] = {
      avg_cache_hit_ms: 0.5, // Valores estimados - podrían calcularse realmente
      avg_generation_ms: 2.3,
      max_hit_ms: 1,
      max_generation_ms: 5,
      hit_count: stats.hits,
      miss_count: stats.misses,
      avg_data_size: 24, // Valor estimado
      cache_hit_rate_percent: typeHitRate
    };
  }
  
  // Crear respuesta con el formato esperado por el dashboard
  const metricsResponse = {
    by_barcode_type: byBarcodeType,
    overall: {
      avg_response_ms: 1.5, // Valor estimado - podría calcularse realmente
      max_response_ms: 5,   // Valor estimado
      total_requests: totalRequests,
      cache_hit_rate_percent: cacheHitRate
    },
    cache_stats: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      cache_hit_rate_percent: cacheHitRate,
      cache_size: responseCache.size
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(metricsResponse);
});

// Middleware para manejo de errores
app.use(errorHandler);

// Middleware para manejar rutas no encontradas (debe ir después de todas las rutas definidas)
app.use(notFoundHandler);

// Iniciar el servidor con la configuración
startServer(app, {
  SSL_ENABLED: config.SSL_ENABLED,
  SSL_KEY_PATH: config.SSL_KEY_PATH,
  SSL_CERT_PATH: config.SSL_CERT_PATH,
  SSL_CA_PATH: config.SSL_CA_PATH,
  PORT: config.PORT,
  HOST: config.HOST,
  RUST_SERVICE_URL: config.RUST_SERVICE_URL,
  NODE_ENV: config.NODE_ENV,
  RATE_LIMIT_MAX: config.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: config.RATE_LIMIT_WINDOW_MS
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando el servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando el servidor...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error);
  process.exit(1);
});