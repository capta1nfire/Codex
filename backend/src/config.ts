import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env en la raíz del backend
// La ruta ahora asume que .env está en la carpeta 'backend', un nivel arriba de 'src'
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface Config {
  // Configuración del servidor
  PORT: number;
  HOST: string;
  NODE_ENV: string;

  // Configuración del servicio Rust
  RUST_SERVICE_URL: string;
  RUST_SERVICE_TIMEOUT_MS?: number; // Timeout para llamadas a Rust

  // Configuración de seguridad
  ALLOWED_ORIGINS: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  MAX_REQUEST_SIZE: string;

  // Configuración JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SESSION_SECRET: string;

  // Configuración SSL
  SSL_ENABLED: boolean;
  SSL_KEY_PATH: string;
  SSL_CERT_PATH: string;
  SSL_CA_PATH: string;

  // Configuración de caché
  CACHE_MAX_AGE: number;
  // Configuración de Redis
  REDIS_URL: string;

  // Configuración de Sentry (opcional)
  SENTRY_DSN?: string;
  APP_VERSION?: string;
}

// Crear y exportar la configuración
export const config: Config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',

  RUST_SERVICE_URL: process.env.RUST_SERVICE_URL || 'http://localhost:3002/generate',
  RUST_SERVICE_TIMEOUT_MS: parseInt(process.env.RUST_SERVICE_TIMEOUT_MS || '5000', 10), // 5 segundos por defecto

  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '1mb',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret-key-change-in-production',

  SSL_ENABLED: process.env.SSL_ENABLED === 'true',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || '',
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || '',
  SSL_CA_PATH: process.env.SSL_CA_PATH || '',

  CACHE_MAX_AGE: parseInt(process.env.CACHE_MAX_AGE || '300', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379', // URL por defecto para Redis local

  // Configuración de Sentry (opcional)
  SENTRY_DSN: process.env.SENTRY_DSN,
  APP_VERSION: process.env.APP_VERSION || '1.0.0', // Versión por defecto si no está en .env
};
