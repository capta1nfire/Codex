import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { Express } from 'express';
import logger from './utils/logger';

// Función para iniciar el servidor
export const startServer = (app: Express, config: {
  SSL_ENABLED: boolean;
  SSL_KEY_PATH: string;
  SSL_CERT_PATH: string;
  SSL_CA_PATH: string;
  PORT: number;
  HOST: string;
  RUST_SERVICE_URL: string;
  NODE_ENV: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
}) => {
  const {
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
  } = config;

  // Configurar servidor HTTP o HTTPS según la configuración
  if (SSL_ENABLED) {
    try {
      // Verificar que existan los archivos de certificados
      if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
        logger.error('SSL está habilitado pero no se encontraron los archivos de certificados.');
        process.exit(1);
      }

      // Opciones para el servidor HTTPS
      const httpsOptions: https.ServerOptions = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      };

      // Añadir CA si está configurada
      if (SSL_CA_PATH && fs.existsSync(SSL_CA_PATH)) {
        httpsOptions.ca = fs.readFileSync(SSL_CA_PATH);
      }

      // Crear y arrancar servidor HTTPS
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(PORT, HOST, () => {
        logger.info(`Servidor HTTPS escuchando en https://${HOST}:${PORT}`);
        logger.info(`Listo para reenviar peticiones al servicio Rust en ${RUST_SERVICE_URL}`);
        logger.info(`Modo: ${NODE_ENV}, Rate limit: ${RATE_LIMIT_MAX} solicitudes por ${RATE_LIMIT_WINDOW_MS/60000} minutos`);
      });

      // Configurar cierre graceful
      httpsServer.on('close', () => {
        logger.info('Servidor HTTPS cerrado.');
      });

      return httpsServer;
    } catch (error) {
      logger.error('Error al iniciar el servidor HTTPS:', error);
      process.exit(1);
    }
  } else {
    // Servidor HTTP para desarrollo
    const httpServer = http.createServer(app);
    httpServer.listen(PORT, HOST, () => {
      logger.info(`Servidor HTTP escuchando en http://${HOST}:${PORT}`);
      logger.info(`Listo para reenviar peticiones al servicio Rust en ${RUST_SERVICE_URL}`);
      logger.info(`Modo: ${NODE_ENV}, Rate limit: ${RATE_LIMIT_MAX} solicitudes por ${RATE_LIMIT_WINDOW_MS/60000} minutos`);
    });

    // Configurar cierre graceful
    httpServer.on('close', () => {
      logger.info('Servidor HTTP cerrado.');
    });

    return httpServer;
  }
}; 