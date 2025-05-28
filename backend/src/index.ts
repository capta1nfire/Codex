// Importar compression para respuestas comprimidas
// Importar os para obtener información del sistema
// Importar fs y https para soporte SSL
// import * as fs from 'fs'; // <- Unused
// import * as http from 'http'; // <- Unused
// import * as https from 'https'; // <- Unused
// import * as os from 'os'; // <- Unused

import * as path from 'path';
import { fileURLToPath } from 'url';

import * as Sentry from '@sentry/node';
import compression from 'compression';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
// import { check, validationResult } from 'express-validator'; // <- Unused
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import xss from 'xss-clean';

// import express from 'express'; // <-- Comentado
import { config } from './config.js';
// import { config } from './config.js'; // <-- Comentar esta línea
// Importar módulos de autenticación
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
// Importar rutas (Comentadas para depuración)
import { authRoutes } from './routes/auth.routes.js';
import { avatarRoutes } from './routes/avatar.routes.js';
import { baseRoutes } from './routes/base.routes.js';
import { generateRoutes } from './routes/generate.routes.js';
import healthRoutes from './routes/health.js'; // ✅ Sistema robusto
import { metricsRoutes } from './routes/metrics.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { startServer } from './server-config.js'; // <--- Descomentar esta línea
import {
  startDatabaseService,
  startRustService,
  stopRustService,
  restartBackendService,
  getServiceStatus,
} from './services/serviceControl.js';
import logger from './utils/logger.js';
// Importar métricas de Prometheus
import { httpRequestDurationMicroseconds, httpRequestsTotal } from './utils/metrics.js'; // <--- Descomentar esta línea

// Importar Prisma client para Sentry
// import prisma from './lib/prisma.js';  // ✅ Comentado: no usado en index.ts
// Importar Sentry con configuración básica

// Importar funciones de control de servicios

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Inicializar Sentry ANTES que todo lo demás que usa 'app' para los handlers
// Asegúrate de configurar SENTRY_DSN y APP_VERSION en tus variables de entorno
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: config.NODE_ENV,
    release: config.APP_VERSION,
    // Configurar contexto global
    beforeSend(event, hint) {
      // Agregar contexto adicional para debugging
      if (event.exception) {
        logger.error('Excepción capturada por Sentry:', hint.originalException);
      }
      return event;
    },
  });
  logger.info('Sentry SDK inicializado para el backend.');
} else if (config.NODE_ENV !== 'test') {
  logger.warn('SENTRY_DSN no está configurado. Sentry no será inicializado.');
}

// The request handler must be the first middleware on the app
// Sentry configurado para captura manual de errores

// --- Configuración de Middleware (Restaurada) ---
// Aplicar middleware de seguridad - Configurar CORP para permitir imágenes cross-origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Configurar opciones de CORS
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'X-Requested-With',
    ],
  })
);

// Prevenir ataques XSS
app.use(xss());

// Parse JSON body
app.use(express.json({ limit: config.MAX_REQUEST_SIZE }));

// Servir archivos estáticos PRIMERO (para que no cuenten en el rate limit)
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- ENDPOINTS PÚBLICOS (ANTES DEL RATE LIMITER) ---
// Rutas de salud (ping, etc.) - Estas NO deben estar sujetas al rate limit
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// Aplicar límites de tasa DESPUÉS de estáticos, CORS y health checks
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    },
  },
});
app.use(limiter);

// Aplicar compresión para respuestas (después del limiter está bien)
app.use(compression());

// --- Configuración de Autenticación ---
// Configurar y usar passport para la autenticación JWT
app.use(authMiddleware.configurePassport());
app.use(authMiddleware.apiKeyStrategy);

// Middleware para registrar solicitudes (usando winston)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Registrar solo en desarrollo (o ajustar según necesidades)
  if (config.NODE_ENV === 'development') {
    logger.info(`[${req.method}] ${req.url}`);
  }

  // Registrar métricas para Prometheus
  const end = httpRequestDurationMicroseconds.startTimer();
  const countPath = req.path || 'unknown';

  // Al finalizar la respuesta
  res.on('finish', () => {
    const respTime = end();
    httpRequestsTotal.labels(req.method, countPath, res.statusCode.toString()).inc();
    if (respTime > 1000) {
      // Registrar respuestas lentas (más de 1 segundo)
      logger.warn(`Respuesta lenta (${respTime.toFixed(2)}ms): [${req.method}] ${req.url}`);
    }
  });

  next();
});

// --- Rutas de la API ---
app.use('/', baseRoutes);

// ✅ Service Control Endpoints (Protected)
app.post('/api/services/:service/start', async (req: Request, res: Response) => {
  const { service } = req.params;

  try {
    console.log(`🔧 Starting service: ${service}`);

    let result;
    switch (service.toLowerCase()) {
      case 'database':
        // Only allow starting database if it's stopped, never stop it
        result = await startDatabaseService();
        break;
      case 'backend':
        result = await restartBackendService();
        break;
      case 'rust':
      case 'rust_generator':
        result = await startRustService();
        break;
      default:
        return res.status(400).json({
          error: 'Invalid service name',
          validServices: ['database', 'backend', 'rust'],
        });
    }

    res.json({
      service,
      action: 'start',
      status: 'success',
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`❌ Failed to start ${service}:`, error);
    res.status(500).json({
      service,
      action: 'start',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/api/services/:service/stop', async (req: Request, res: Response) => {
  const { service } = req.params;

  try {
    console.log(`🛑 Stopping service: ${service}`);

    let result;
    switch (service.toLowerCase()) {
      case 'database':
        result = {
          message:
            'Database stop not supported (would affect system stability). Use Docker commands directly if needed.',
        };
        break;
      case 'backend':
        result = { message: 'Backend stop not supported (would stop current process)' };
        break;
      case 'rust':
      case 'rust_generator':
        result = await stopRustService();
        break;
      default:
        return res.status(400).json({
          error: 'Invalid service name',
          validServices: ['database', 'backend', 'rust'],
        });
    }

    res.json({
      service,
      action: 'stop',
      status: 'success',
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`❌ Failed to stop ${service}:`, error);
    res.status(500).json({
      service,
      action: 'stop',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/api/services/:service/restart', async (req: Request, res: Response) => {
  const { service } = req.params;

  try {
    console.log(`🔄 Restarting service: ${service}`);

    let result;
    switch (service.toLowerCase()) {
      case 'database':
        result = {
          message:
            'Database restart not supported via API (would affect system stability). Database should remain running for system integrity.',
        };
        break;
      case 'backend':
        result = await restartBackendService();
        break;
      case 'rust':
      case 'rust_generator':
        await stopRustService();
        result = await startRustService();
        break;
      default:
        return res.status(400).json({
          error: 'Invalid service name',
          validServices: ['database', 'backend', 'rust'],
        });
    }

    res.json({
      service,
      action: 'restart',
      status: 'success',
      message: result.message,
      details: result.details,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`❌ Failed to restart ${service}:`, error);
    res.status(500).json({
      service,
      action: 'restart',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ Enhanced Service Status Endpoint
app.get('/api/services/status', async (_req: Request, res: Response) => {
  try {
    console.log('🔍 Getting all services status...');

    const services = ['database', 'backend', 'rust'];
    const statusResults = await Promise.allSettled(
      services.map((service) => getServiceStatus(service))
    );

    const servicesStatus = services.map((service, index) => {
      const result = statusResults[index];
      if (result.status === 'fulfilled') {
        return {
          service,
          ...result.value,
        };
      } else {
        return {
          service,
          success: false,
          message: `Failed to check ${service} status`,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    const overallHealthy = servicesStatus.every(
      (s) => s.success && (s as any).details?.status === 'running'
    );

    res.json({
      overall: overallHealthy ? 'healthy' : 'degraded',
      services: servicesStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Failed to get services status:', error);
    res.status(500).json({
      overall: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ Individual Service Status Endpoint
app.get('/api/services/:service/status', async (req: Request, res: Response) => {
  const { service } = req.params;

  try {
    console.log(`🔍 Getting ${service} status...`);

    const result = await getServiceStatus(service);

    res.json({
      service,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`❌ Failed to get ${service} status:`, error);
    res.status(500).json({
      service,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ✅ Force Health Check Endpoint
app.post('/api/services/health-check', async (_req: Request, res: Response) => {
  try {
    console.log('🏥 Forcing health check of all services...');

    const healthChecks = {
      database: false,
      backend: true, // Always true since we're responding
      rust: false,
    };

    // Check database
    try {
      const dbResult = await getServiceStatus('database');
      healthChecks.database = dbResult.success && dbResult.details?.status === 'running';
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Rust service
    try {
      const rustResult = await getServiceStatus('rust');
      healthChecks.rust = rustResult.success && rustResult.details?.healthy;
    } catch (error) {
      console.error('Rust service health check failed:', error);
    }

    const overallHealthy = Object.values(healthChecks).every(Boolean);

    res.json({
      overall: overallHealthy ? 'healthy' : 'degraded',
      checks: healthChecks,
      message: overallHealthy ? 'All services are healthy' : 'Some services are not responding',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Failed to perform health check:', error);
    res.status(500).json({
      overall: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/users', userRoutes);

// Documentación Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Codex - Generador de Códigos QR / Barras',
      version: '1.0.0',
      description:
        'API para generación y gestión de códigos QR y de barras integrada con servicio Rust',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'Soporte de Codex',
        url: 'https://codexproject.com',
        email: 'soporte@codexproject.com',
      },
    },
    servers: [
      {
        url: '/',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Rutas a archivos con anotaciones JSDoc
};

const swaggerSpecification = swaggerJsdoc(swaggerOptions);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecification, {
    customCss: `
    body.swagger-ui { 
      font-family: var(--font-sans, sans-serif);
      color: hsl(var(--foreground)); 
      background-color: hsl(var(--background)); 
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: hsl(var(--foreground)); }
    .swagger-ui .info a { color: hsl(var(--primary)); }
    .swagger-ui .scheme-container { background: hsl(var(--card)); box-shadow: none; margin: 20px 0; padding: 15px; border: 1px solid hsl(var(--border)); border-radius: var(--radius-lg); }
    .swagger-ui .opblock-tag { 
      color: hsl(var(--primary)); 
      font-size: 1.1em; 
      font-weight: 600; 
      margin: 0 0 15px 0; 
      padding: 10px 0 !important; 
      border-bottom: 2px solid hsl(var(--primary));
    }
    .swagger-ui .opblock { 
      margin: 0 0 15px 0; 
      border: 1px solid hsl(var(--border)); 
      border-radius: var(--radius-lg); 
      box-shadow: none; 
      background: hsl(var(--card));
    }
    .swagger-ui .opblock .opblock-summary { padding: 10px; border-bottom: 1px solid hsl(var(--border)); }
    .swagger-ui .opblock .opblock-summary-method { 
      border-radius: var(--radius-md); 
      font-weight: 600;
      color: hsl(var(--primary-foreground));
      min-width: 70px;
      text-align: center;
    }
    /* Colores por método */
    .swagger-ui .opblock .opblock-summary-get .opblock-summary-method { background: hsl(var(--primary)); } /* Azul */
    .swagger-ui .opblock .opblock-summary-post .opblock-summary-method { background: hsl(var(--success)); } /* Verde */
    .swagger-ui .opblock .opblock-summary-put .opblock-summary-method { background: hsl(var(--warning)); color: hsl(var(--warning-foreground)); } /* Naranja */
    .swagger-ui .opblock .opblock-summary-delete .opblock-summary-method { background: hsl(var(--destructive)); } /* Rojo */
    .swagger-ui .opblock .opblock-summary-patch .opblock-summary-method { background: hsl(var(--accent)); } /* Verde Esmeralda (Accent) */
    .swagger-ui .opblock .opblock-summary-options .opblock-summary-method { background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); } /* Gris Azulado */
    .swagger-ui .opblock .opblock-summary-head .opblock-summary-method { background: hsl(var(--muted-foreground)); color: hsl(var(--muted)); } /* Gris medio */
    
    .swagger-ui .opblock-description-wrapper p, .swagger-ui .parameter__description { color: hsl(var(--foreground)); }
    .swagger-ui .response-col_status { color: hsl(var(--foreground)); }
    .swagger-ui .parameter__name { color: hsl(var(--muted-foreground)); }
    .swagger-ui .response-col_links { color: hsl(var(--primary)); }
    .swagger-ui table thead th { color: hsl(var(--foreground)); border-bottom: 1px solid hsl(var(--border)); }
    .swagger-ui .btn { 
      border: 1px solid hsl(var(--border)); 
      color: hsl(var(--foreground)); 
      border-radius: var(--radius-md); 
    }
    .swagger-ui .btn:hover { border-color: hsl(var(--primary)); color: hsl(var(--primary)); }
    .swagger-ui .btn.authorize { border-color: hsl(var(--accent)); color: hsl(var(--accent)); }
    .swagger-ui .btn.authorize:hover { border-color: hsl(var(--accent)); background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }
    .swagger-ui .btn.execute { border-color: hsl(var(--primary)); background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
    .swagger-ui .btn.execute:hover { opacity: 0.9; }
    .swagger-ui .modal-ux-content .btn-decorator { color: hsl(var(--primary)); }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: hsl(var(--foreground)); }
    .swagger-ui select { border: 1px solid hsl(var(--border)); border-radius: var(--radius-md); background: hsl(var(--background)); color: hsl(var(--foreground)); }
    .swagger-ui input[type=text], .swagger-ui input[type=password], .swagger-ui textarea { border: 1px solid hsl(var(--input)); border-radius: var(--radius-md); background: hsl(var(--input)); color: hsl(var(--foreground)); }
  `,
    customSiteTitle: 'Codex API - Documentación',
    customfavIcon: '/static/favicon.ico',
  })
);

// Manejador para rutas no encontradas (404)
app.use(notFoundHandler);

// Manejador de errores global
app.use(errorHandler);

// Iniciar servidor HTTP o HTTPS según configuración (ahora asíncrono)
// Usar una IIFE async para poder usar await
(async () => {
  try {
    await startServer(app, config); // Esperar a que el servidor inicie correctamente
  } catch (error) {
    logger.error('Fallo al iniciar el servidor desde index.ts: ', error);
    process.exit(1);
  }
})();

// Para testing (exportar app)
export default app;
