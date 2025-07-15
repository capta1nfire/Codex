import fs from 'fs';
import path from 'path';

import winston from 'winston';

// Asegurar que el directorio de logs exista
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Formato para los logs de consola
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Formato para los logs de archivo
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Definir los transportes
// Especificar el tipo explícitamente para permitir diferentes transportes
const transports: winston.transport[] = [
  // Escribir logs de nivel error a un archivo de errores
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Escribir todos los logs a un archivo
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Añadir transporte de consola condicionalmente
if (process.env.NODE_ENV !== 'production') {
  // En desarrollo, usar un formato más simple y coloreado
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
        // Alternativa si prefieres timestamp en dev:
        // format: consoleFormat
      ),
    })
  );
} else {
  // En producción (o entornos no-desarrollo), usar el formato con timestamp
  // Podrías incluso querer un nivel diferente para la consola en producción
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      // level: 'info' // Opcional: Nivel específico para consola prod
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  // No necesitamos un formato global aquí, cada transporte tiene el suyo
  // format: winston.format.json(),
  defaultMeta: { service: 'qreable-backend' },
  transports: transports, // Usar el array construido
});

// Eliminar la adición redundante
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: winston.format.combine(
//       winston.format.colorize(),
//       winston.format.simple()
//     ),
//   }));
// }

export default logger;
