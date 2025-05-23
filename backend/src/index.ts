// Importar compression para respuestas comprimidas
// Importar os para obtener información del sistema
// Importar fs y https para soporte SSL
// import * as fs from 'fs'; // <- Unused
// import * as http from 'http'; // <- Unused
// import * as https from 'https'; // <- Unused
// import * as os from 'os'; // <- Unused

import compression from 'compression';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
// import { check, validationResult } from 'express-validator'; // <- Unused
import helmet from 'helmet';
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
import { healthRoutes } from './routes/health.routes.js';
import { metricsRoutes } from './routes/metrics.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { startServer } from './server-config.js'; // <--- Descomentar esta línea
import logger from './utils/logger.js';
// Importar métricas de Prometheus
import { httpRequestDurationMicroseconds, httpRequestsTotal } from './utils/metrics.js'; // <--- Descomentar esta línea
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as path from 'path';
import { fileURLToPath } from 'url';
// Importar Prisma client para Sentry
import prisma from './lib/prisma.js';
// Importar Sentry con configuración básica
import * as Sentry from "@sentry/node";

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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// Configurar opciones de CORS
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Prevenir ataques XSS
app.use(xss());

// Parse JSON body
app.use(express.json({ limit: config.MAX_REQUEST_SIZE }));

// Servir archivos estáticos PRIMERO (para que no cuenten en el rate limit)
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Aplicar límites de tasa DESPUÉS de estáticos y CORS
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

// --- ENDPOINTS PÚBLICOS ---
// Rutas de salud (ping, etc.)
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// --- Rutas de la API ---
app.use('/', baseRoutes);
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecification, {
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
  customSiteTitle: "Codex API - Documentación",
  customfavIcon: "/static/favicon.ico"
}));

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
    logger.error("Fallo al iniciar el servidor desde index.ts: ", error);
    process.exit(1);
  }
})();

// Para testing (exportar app)
export default app;
