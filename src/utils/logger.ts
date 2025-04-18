import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Asegurar que el directorio de logs existe
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configurar formatos para diferentes entornos
const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  file: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
};

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Registrar en consola
    new winston.transports.Console({
      format: formats.console,
    }),
    // Registrar errores en archivo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: formats.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Registrar todos los logs en archivo
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: formats.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Crear interfaces para diferentes niveles de log
export const error = (message: string, meta?: Record<string, any>) => {
  logger.error(message, meta);
};

export const warn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const info = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const debug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

export const http = (message: string, meta?: Record<string, any>) => {
  logger.http(message, meta);
};

// Middleware para loguear solicitudes HTTP (opcional - se puede usar con Morgan)
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

export default logger; 