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

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 30px 0 }
    .swagger-ui .scheme-container { background: none; box-shadow: none; margin: 0 }
    .swagger-ui .opblock-tag { font-size: 18px; margin: 0 0 10px 0; padding: 10px !important; }
    .swagger-ui .opblock { margin: 0 0 15px 0; border-radius: 4px; }
    .swagger-ui .opblock .opblock-summary { padding: 10px; }
    .swagger-ui .opblock .opblock-summary-method { border-radius: 4px; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  `,
  customSiteTitle: "Codex API - Documentación",
  customfavIcon: "/static/favicon.ico"
}));

// Manejador para rutas no encontradas (404)
app.use(notFoundHandler);

// Manejador de errores global
app.use(errorHandler);

// Iniciar servidor HTTP o HTTPS según configuración
startServer(app, config);

// Para testing (exportar app)
export default app;
