/**
 * Studio WebSocket Service
 *
 * Servicio de WebSocket para sincronización en tiempo real de QR Studio.
 * Notifica cambios de configuración a todos los clientes conectados.
 *
 * @principle Pilar 1: Seguridad - Solo usuarios autorizados
 * @principle Pilar 2: Robustez - Manejo de reconexiones
 * @principle Pilar 3: Simplicidad - API de eventos clara
 * @principle Pilar 4: Modularidad - Servicio independiente
 * @principle Pilar 5: Valor - Actualizaciones instantáneas
 */

import { Server as HTTPServer } from 'http';

import { StudioConfig, StudioConfigType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

import { redisCache } from '../lib/redisCache.js';
import logger from '../utils/logger.js';

interface StudioSocketClient {
  userId: string;
  role: string;
  socketId: string;
}

export class StudioWebSocketService {
  private io: SocketIOServer | null = null;
  private clients: Map<string, StudioSocketClient> = new Map();
  private readonly REDIS_CHANNEL = 'studio:updates';

  /**
   * Inicializar servicio WebSocket
   */
  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/ws/studio',
    });

    this.setupEventHandlers();
    this.subscribeToRedis();

    logger.info('Studio WebSocket service initialized');
  }

  /**
   * Configurar manejadores de eventos
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Solo permitir SUPERADMIN
        if (decoded.role !== 'SUPERADMIN') {
          return next(new Error('Insufficient permissions'));
        }

        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      const client: StudioSocketClient = {
        userId: socket.data.userId,
        role: socket.data.role,
        socketId: socket.id,
      };

      this.clients.set(socket.id, client);
      logger.info(`Studio client connected: ${socket.id}`);

      // Unirse a sala de Studio
      socket.join('studio:superadmin');

      // Eventos del cliente
      socket.on('subscribe:config', (data) => {
        this.handleSubscribeConfig(socket, data);
      });

      socket.on('request:sync', () => {
        this.handleSyncRequest(socket);
      });

      socket.on('disconnect', () => {
        this.clients.delete(socket.id);
        logger.info(`Studio client disconnected: ${socket.id}`);
      });

      // Enviar estado inicial
      socket.emit('connected', {
        message: 'Connected to Studio WebSocket',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Suscribirse a canal Redis para actualizaciones distribuidas
   */
  private async subscribeToRedis() {
    try {
      const subscriber = redisCache.duplicate();
      await subscriber.subscribe(this.REDIS_CHANNEL);

      subscriber.on('message', (channel, message) => {
        if (channel === this.REDIS_CHANNEL) {
          try {
            const update = JSON.parse(message);
            this.broadcastUpdate(update);
          } catch (error) {
            logger.error('Error parsing Redis message:', error);
          }
        }
      });
    } catch (error) {
      logger.error('Error subscribing to Redis:', error);
    }
  }

  /**
   * Manejar suscripción a configuración específica
   */
  private handleSubscribeConfig(socket: any, data: any) {
    const { type, templateType } = data;

    if (type) {
      const room = templateType ? `studio:${type}:${templateType}` : `studio:${type}`;

      socket.join(room);
      socket.emit('subscribed', { room, type, templateType });
    }
  }

  /**
   * Manejar solicitud de sincronización
   */
  private async handleSyncRequest(socket: any) {
    try {
      // Obtener todas las configuraciones del cache
      const keys = await redisCache.keys('studio:config:*');
      const configs: StudioConfig[] = [];

      for (const key of keys) {
        const data = await redisCache.get(key);
        if (data) {
          configs.push(JSON.parse(data));
        }
      }

      socket.emit('sync:complete', {
        configs,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error handling sync request:', error);
      socket.emit('sync:error', {
        message: 'Error syncing configurations',
      });
    }
  }

  /**
   * Difundir actualización a clientes conectados
   */
  private broadcastUpdate(update: any) {
    if (!this.io) return;

    const { action, config, userId } = update;

    // Notificar a todos los SuperAdmin
    this.io.to('studio:superadmin').emit('config:update', {
      action,
      config,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Notificar a salas específicas si aplica
    if (config) {
      const room = config.templateType
        ? `studio:${config.type}:${config.templateType}`
        : `studio:${config.type}`;

      this.io.to(room).emit('config:update', {
        action,
        config,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Publicar actualización de configuración
   */
  async publishConfigUpdate(
    action: 'create' | 'update' | 'delete',
    config: StudioConfig | { id: string; type: StudioConfigType },
    userId: string
  ) {
    try {
      const update = {
        action,
        config,
        userId,
        timestamp: new Date().toISOString(),
      };

      // Publicar en Redis para distribución
      await redisCache.publish(this.REDIS_CHANNEL, JSON.stringify(update));

      // Difundir localmente también
      this.broadcastUpdate(update);

      logger.info(`Studio update published: ${action} ${config.id}`);
    } catch (error) {
      logger.error('Error publishing config update:', error);
    }
  }

  /**
   * Obtener estadísticas de conexiones
   */
  getConnectionStats() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.values()).map((c) => ({
        userId: c.userId,
        role: c.role,
        socketId: c.socketId,
      })),
    };
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.clients.clear();
  }
}

// Singleton
export const studioWebSocketService = new StudioWebSocketService();
