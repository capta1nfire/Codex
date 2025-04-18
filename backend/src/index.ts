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

// Configuración de entorno
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const RUST_SERVICE_URL = process.env.RUST_SERVICE_URL || 'http://localhost:3002/generate';
const NODE_ENV = process.env.NODE_ENV || 'development';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutos por defecto
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10); // 100 solicitudes por ventana por defecto
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '1mb';
// Configuración de caché
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '300', 10); // 5 minutos por defecto

// Configuración SSL
const SSL_ENABLED = process.env.SSL_ENABLED === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '';
const SSL_CA_PATH = process.env.SSL_CA_PATH || '';

// Obtener los orígenes permitidos del .env
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

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
    
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = `El origen ${origin} no está permitido por la política CORS`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de límite de tasa
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
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
app.use(express.json({ limit: MAX_REQUEST_SIZE })); // Limite el tamaño del cuerpo a 1MB

// Prevenir ataques XSS
app.use(xss());

// Caché para recursos estáticos (si existieran)
app.use(express.static('public', {
  maxAge: CACHE_MAX_AGE * 1000, // Cache-Control en milisegundos
  etag: true, // Habilitar ETags
  lastModified: true // Habilitar Last-Modified
}));

// Simple caché en memoria para reducir carga en el servicio Rust
const responseCache = new Map();
const CACHE_TTL = CACHE_MAX_AGE * 1000; // Tiempo de vida del caché

// Función para limpiar entradas caducadas del caché
const cleanCache = () => {
  const now = Date.now();
  for (const [key, { timestamp }] of responseCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
};

// Limpiar caché periódicamente
setInterval(cleanCache, 60000); // Limpiar cada minuto

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

// Mapeo de tipos de códigos de barras
const barcodeTypeMapping: Record<string, string> = {
  'qrcode': 'qr',
  'code128': 'code128',
  'pdf417': 'pdf417',
  'ean13': 'ean13',
  'upca': 'upca',
  'code39': 'code39',
  'datamatrix': 'datamatrix'
};

// Verificar si un tipo de código de barras es válido
const isValidBarcodeType = (type: string): boolean => {
  return Object.keys(barcodeTypeMapping).includes(type);
};

// Ruta principal
app.get('/', (req: Request, res: Response) => {
  // Configurar headers de caché para respuestas inmutables
  res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
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
    const rustHealthCheck = await fetch('http://localhost:3002/health', {
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
    .isString().withMessage('El tipo de código de barras debe ser un string')
    .custom(isValidBarcodeType).withMessage('Tipo de código de barras no soportado'),
  
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

// Ruta para generar códigos (ahora llama al servicio Rust vía HTTP)
app.post('/generate', generateValidators, validateRequest, async (req: Request, res: Response) => {
  // Usamos 'barcode_type' para coincidir con el struct de Rust
  const { barcode_type, data, options } = req.body;

  // Convertir el tipo usando el mapeo
  const rustBarcodeType = barcodeTypeMapping[barcode_type] || barcode_type;
  
  console.log(`Node API: Recibido ${barcode_type}. Convertido a ${rustBarcodeType} para Rust.`);
  
  // Crear clave para caché que incluya todos los parámetros relevantes
  const cacheKey = JSON.stringify({
    barcode_type: rustBarcodeType,
    data,
    options: options || null
  });
  
  // Verificar si tenemos una respuesta en caché
  if (responseCache.has(cacheKey)) {
    const cachedResponse = responseCache.get(cacheKey);
    // Verificar si el caché es aún válido
    if (Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      logger.info(`Sirviendo código de barras desde caché para tipo: ${barcode_type}, datos: ${data.substring(0, 20)}...`);
      return res.status(200).json({
        success: true,
        svgString: cachedResponse.data.svgString,
        fromCache: true
      });
    } else {
      // Eliminar caché expirado
      responseCache.delete(cacheKey);
    }
  }

  console.log(`Llamando al servicio Rust en ${RUST_SERVICE_URL}...`);

  try {
    // --- Llamada HTTP al Microservicio Rust ---
    const rustResponse = await fetch(RUST_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode_type: rustBarcodeType, // Usamos el tipo convertido
        data: data,
        options: options || null
      }),
    });
    // ---------------------------------------

    // Verificar si la respuesta HTTP del servicio Rust fue OK
    if (!rustResponse.ok) {
      let errorBody = null;
      try { errorBody = await rustResponse.json(); } catch(e) { errorBody = { error: await rustResponse.text() || 'Error desconocido desde el servicio Rust' }; }
      console.error(`Error desde servicio Rust: Status ${rustResponse.status}`, errorBody);
      
      // Pasar la respuesta de error completa del servicio Rust al frontend
      if (errorBody) {
        return res.status(rustResponse.status).json(errorBody);
      }
      
      throw new Error(errorBody?.error || `El servicio Rust devolvió un error ${rustResponse.status}`);
    }

    // Obtener el JSON de la respuesta exitosa del servicio Rust
    const rustResult = await rustResponse.json();
    console.log("NODE DEBUG: Objeto rustResult recibido:", JSON.stringify(rustResult, null, 2));

    // --- VERIFICACIÓN CORRECTA ---
    // Verificar la estructura esperada: success:true Y svgString presente y es string
    if (rustResult.success && typeof rustResult.svgString === 'string') { // <-- Verifica svgString (camelCase)
      console.log('Node API: Recibida respuesta SVG exitosa desde Rust.');
      
      // Guardar resultado en caché
      responseCache.set(cacheKey, {
        data: rustResult,
        timestamp: Date.now()
      });
      
      // Configurar headers de caché para SVG (siendo contenido estático)
      res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
      
      // Enviar la respuesta exitosa de vuelta al frontend
      return res.status(200).json({
        success: true,
        svgString: rustResult.svgString // <-- Reenvía svgString (camelCase)
      });
    } else {
      // Si el JSON de Rust no tenía la estructura correcta
      console.error('Respuesta inesperada o inválida desde servicio Rust:', rustResult);
      throw new Error('Respuesta inválida recibida desde el servicio de generación.');
    }
    // --- FIN VERIFICACIÓN CORRECTA ---

  } catch (error) {
    // Manejar errores
    console.error('Error en el handler /generate de Node:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al contactar servicio de generación.';
    return res.status(500).json({ success: false, error: `Error interno: ${errorMessage}` });
  }
});

// Alias para la ruta /generator (redirige a /generate)
// Manejar tanto GET como POST
app.all('/generator', generateValidators, validateRequest, async (req: Request, res: Response) => {
  console.log(`Redirigiendo ${req.method} /generator a /generate`);
  // Usamos 'barcode_type' para coincidir con el struct de Rust
  const { barcode_type, data, options } = req.body;

  // Convertir el tipo usando el mapeo
  const rustBarcodeType = barcodeTypeMapping[barcode_type] || barcode_type;
  
  console.log(`Node API: Recibido ${barcode_type} en /generator. Convertido a ${rustBarcodeType} para Rust.`);
  
  // Reutilizar la lógica de caché del endpoint /generate
  const cacheKey = JSON.stringify({
    barcode_type: rustBarcodeType,
    data,
    options: options || null
  });
  
  if (responseCache.has(cacheKey)) {
    const cachedResponse = responseCache.get(cacheKey);
    if (Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      logger.info(`Sirviendo código de barras desde caché para tipo: ${barcode_type}, datos: ${data.substring(0, 20)}...`);
      return res.status(200).json({
        success: true,
        svgString: cachedResponse.data.svgString,
        fromCache: true
      });
    } else {
      responseCache.delete(cacheKey);
    }
  }

  console.log(`Llamando al servicio Rust en ${RUST_SERVICE_URL}...`);

  try {
    // --- Llamada HTTP al Microservicio Rust ---
    const rustResponse = await fetch(RUST_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode_type: rustBarcodeType, // Usamos el tipo convertido
        data: data,
        options: options || null
      }),
    });
    // ---------------------------------------

    // Verificar si la respuesta HTTP del servicio Rust fue OK
    if (!rustResponse.ok) {
      let errorBody = null;
      try { errorBody = await rustResponse.json(); } catch(e) { errorBody = { error: await rustResponse.text() || 'Error desconocido desde el servicio Rust' }; }
      console.error(`Error desde servicio Rust: Status ${rustResponse.status}`, errorBody);
      
      // Pasar la respuesta de error completa del servicio Rust al frontend
      if (errorBody) {
        return res.status(rustResponse.status).json(errorBody);
      }
      
      throw new Error(errorBody?.error || `El servicio Rust devolvió un error ${rustResponse.status}`);
    }

    // Obtener el JSON de la respuesta exitosa del servicio Rust
    const rustResult = await rustResponse.json();
    console.log("NODE DEBUG: Objeto rustResult recibido:", JSON.stringify(rustResult, null, 2));

    // --- VERIFICACIÓN CORRECTA ---
    // Verificar la estructura esperada: success:true Y svgString presente y es string
    if (rustResult.success && typeof rustResult.svgString === 'string') { // <-- Verifica svgString (camelCase)
      console.log('Node API: Recibida respuesta SVG exitosa desde Rust.');
      
      // Guardar resultado en caché
      responseCache.set(cacheKey, {
        data: rustResult,
        timestamp: Date.now()
      });
      
      // Configurar headers de caché
      res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
      
      // Enviar la respuesta exitosa de vuelta al frontend
      return res.status(200).json({
        success: true,
        svgString: rustResult.svgString // <-- Reenvía svgString (camelCase)
      });
    } else {
      // Si el JSON de Rust no tenía la estructura correcta
      console.error('Respuesta inesperada o inválida desde servicio Rust:', rustResult);
      throw new Error('Respuesta inválida recibida desde el servicio de generación.');
    }
    // --- FIN VERIFICACIÓN CORRECTA ---

  } catch (error) {
    // Manejar errores
    console.error('Error en el handler /generator de Node:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al contactar servicio de generación.';
    return res.status(500).json({ success: false, error: `Error interno: ${errorMessage}` });
  }
});

// Middleware para manejo de errores
app.use(errorHandler);

// Middleware para manejar rutas no encontradas (debe ir después de todas las rutas definidas)
app.use(notFoundHandler);

// Iniciar el servidor con la configuración
startServer(app, {
  SSL_ENABLED,
  SSL_KEY_PATH,
  SSL_CERT_PATH,
  SSL_CA_PATH,
  PORT,
  HOST,
  RUST_SERVICE_URL,
  NODE_ENV,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS
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