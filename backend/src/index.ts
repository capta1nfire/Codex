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
import { baseRoutes } from './routes/base.routes';
import { healthRoutes } from './routes/health.routes';
import { metricsRoutes } from './routes/metrics.routes';
import { generateRoutes } from './routes/generate.routes';
// Importar métricas de Prometheus
import { httpRequestDurationMicroseconds, httpRequestsTotal } from './utils/metrics';

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

// --- Middleware para Métricas HTTP Prometheus ---
app.use((req: Request, res: Response, next: NextFunction) => {
  // Iniciar timer para medir duración
  const end = httpRequestDurationMicroseconds.startTimer();
  
  // Registrar métrica cuando la respuesta finalice
  res.on('finish', () => {
    // Obtener ruta (usar originalUrl o intentar mapear a un patrón)
    // Usar req.route?.path puede ser más genérico si se usan routers bien
    const route = req.route?.path || req.originalUrl.split('?')[0] || 'unknown'; 
    
    const labels = {
      method: req.method,
      // Usar el path del router si está disponible, sino la URL original
      route: route,
      code: res.statusCode.toString(),
    };
    
    // Observar duración
    end(labels);
    // Incrementar contador
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

// --- Montar Rutas --- 
app.use('/', baseRoutes);                 // Rutas base (GET /)
app.use('/health', healthRoutes);         // Rutas de salud (GET /health)
app.use('/metrics', metricsRoutes);       // Rutas de métricas (GET /metrics)
app.use('/api/auth', authRoutes);       // Rutas de autenticación
app.use('/api', generateRoutes);          // Rutas de generación (ahora bajo /api)
// Nota: Montar generateRoutes en '/api'

// Middleware para manejo de errores
app.use(errorHandler);

// Middleware para manejar rutas no encontradas (esto se queda)
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