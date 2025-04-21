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
import { baseRoutes } from './routes/base.routes.js';
import { generateRoutes } from './routes/generate.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { metricsRoutes } from './routes/metrics.routes.js';
import { startServer } from './server-config.js'; // <--- Descomentar esta línea
import logger from './utils/logger.js';
// Importar métricas de Prometheus
import { httpRequestDurationMicroseconds, httpRequestsTotal } from './utils/metrics.js'; // <--- Descomentar esta línea

const app = express();

// --- Configuración de Middleware (Restaurada) ---
// Aplicar middleware de seguridad
app.use(helmet()); // Seguridad mediante headers HTTP

// Aplicar compresión a todas las respuestas
app.use(compression());

// Configuración de CORS restringido
app.use(
  cors({
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// Configuración de límite de tasa
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    error:
      'Demasiadas solicitudes desde esta IP, por favor inténtelo de nuevo después de 15 minutos',
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

// --- Middleware para Métricas HTTP Prometheus ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.originalUrl.split('?')[0] || 'unknown';
    const labels = {
      method: req.method,
      route: route,
      code: res.statusCode.toString(),
    };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
});
// --- Fin Middleware Métricas ---

// Middleware para validación de solicitudes (movido a generate.routes.ts, eliminar aquí)
// const validateRequest = (req: Request, res: Response, next: NextFunction) => { ... };

// Configurar autenticación
app.use(authMiddleware.configurePassport());
app.use(authMiddleware.apiKeyStrategy);

// --- Montar Rutas (Restaurado) ---
app.use('/', baseRoutes);
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', generateRoutes);

// Middleware para manejo de errores
app.use(errorHandler);

// Middleware para manejar rutas no encontradas
app.use(notFoundHandler);

// console.log("Script reached end (before server start)"); // Remover log de depuración

// Iniciar el servidor con la configuración (Restaurado)
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
  RATE_LIMIT_WINDOW_MS: config.RATE_LIMIT_WINDOW_MS,
});

// Manejo de cierre graceful (Restaurar logger)
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
