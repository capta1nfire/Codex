/**
 * Tests para StudioWebSocketService
 *
 * Tests del servicio de WebSocket para sincronización en tiempo real
 */

import { Server as HTTPServer } from 'http';

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { StudioConfigType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { Socket as ClientSocket } from 'socket.io-client';

import { redisCache } from '../../config/redis.js';
import { StudioWebSocketService } from '../../services/studioWebSocketService.js';

// Mock de dependencias
jest.mock('../../config/redis.js', () => ({
  redisCache: {
    duplicate: jest.fn(() => ({
      subscribe: jest.fn(),
      on: jest.fn(),
    })),
    publish: jest.fn(),
    keys: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
  },
}));

// Mock de Socket.IO
class MockSocket {
  id = 'test-socket-id';
  data: any = {};
  rooms = new Set(['test-socket-id']);

  join = jest.fn((room: string) => {
    this.rooms.add(room);
  });

  emit = jest.fn();
  on = jest.fn();
  once = jest.fn();
}

class MockIO {
  sockets = new Map();

  use = jest.fn();
  on = jest.fn();
  to = jest.fn(() => ({
    emit: jest.fn(),
  }));

  close = jest.fn();
}

describe('StudioWebSocketService', () => {
  let service: StudioWebSocketService;
  let mockServer: HTTPServer;
  let mockIO: MockIO;
  let mockSocket: MockSocket;

  beforeEach(() => {
    service = new StudioWebSocketService();
    mockServer = {} as HTTPServer;
    mockIO = new MockIO();
    mockSocket = new MockSocket();

    // Mock de Socket.IO constructor
    jest.spyOn(service as any, 'io', 'set').mockImplementation((value) => {
      (service as any)._io = mockIO;
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('initialize', () => {
    it('debe inicializar el servicio WebSocket', () => {
      service.initialize(mockServer);

      expect(mockIO.use).toHaveBeenCalled();
      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('autenticación', () => {
    beforeEach(() => {
      service.initialize(mockServer);
      // Obtener el middleware de autenticación
      const authMiddleware = (mockIO.use as jest.Mock).mock.calls[0][0];
      mockSocket.handshake = { auth: {} } as any;
    });

    it('debe rechazar conexiones sin token', async () => {
      const authMiddleware = (mockIO.use as jest.Mock).mock.calls[0][0];
      const next = jest.fn();

      mockSocket.handshake = { auth: {} } as any;
      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(new Error('Authentication required'));
    });

    it('debe rechazar tokens inválidos', async () => {
      const authMiddleware = (mockIO.use as jest.Mock).mock.calls[0][0];
      const next = jest.fn();

      mockSocket.handshake = { auth: { token: 'invalid-token' } } as any;
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(new Error('Invalid token'));
    });

    it('debe rechazar usuarios que no son SUPERADMIN', async () => {
      const authMiddleware = (mockIO.use as jest.Mock).mock.calls[0][0];
      const next = jest.fn();

      mockSocket.handshake = { auth: { token: 'valid-token' } } as any;
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: 'test-user',
        role: 'USER',
      });

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith(new Error('Insufficient permissions'));
    });

    it('debe aceptar SUPERADMIN válidos', async () => {
      const authMiddleware = (mockIO.use as jest.Mock).mock.calls[0][0];
      const next = jest.fn();

      mockSocket.handshake = { auth: { token: 'valid-token' } } as any;
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: 'test-user',
        role: 'SUPERADMIN',
      });

      await authMiddleware(mockSocket, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockSocket.data.userId).toBe('test-user');
      expect(mockSocket.data.role).toBe('SUPERADMIN');
    });
  });

  describe('eventos del cliente', () => {
    let connectionHandler: Function;

    beforeEach(() => {
      service.initialize(mockServer);
      connectionHandler = (mockIO.on as jest.Mock).mock.calls[0][1];
      mockSocket.data = { userId: 'test-user', role: 'SUPERADMIN' };
    });

    it('debe manejar conexión de cliente', () => {
      connectionHandler(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('studio:superadmin');
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        message: 'Connected to Studio WebSocket',
        timestamp: expect.any(String),
      });
    });

    it('debe manejar suscripción a configuración', () => {
      connectionHandler(mockSocket);

      // Simular evento subscribe:config
      const subscribeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'subscribe:config'
      )[1];

      subscribeHandler({ type: 'PLACEHOLDER' });

      expect(mockSocket.join).toHaveBeenCalledWith('studio:PLACEHOLDER');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', {
        room: 'studio:PLACEHOLDER',
        type: 'PLACEHOLDER',
        templateType: undefined,
      });
    });

    it('debe manejar suscripción a plantilla específica', () => {
      connectionHandler(mockSocket);

      const subscribeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'subscribe:config'
      )[1];

      subscribeHandler({ type: 'TEMPLATE', templateType: 'url' });

      expect(mockSocket.join).toHaveBeenCalledWith('studio:TEMPLATE:url');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', {
        room: 'studio:TEMPLATE:url',
        type: 'TEMPLATE',
        templateType: 'url',
      });
    });

    it('debe manejar solicitud de sincronización', async () => {
      connectionHandler(mockSocket);

      const syncHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'request:sync')[1];

      const mockConfigs = [
        { id: '1', type: 'PLACEHOLDER' },
        { id: '2', type: 'TEMPLATE' },
      ];

      (redisCache.keys as jest.Mock).mockResolvedValue(['studio:config:1', 'studio:config:2']);

      (redisCache.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockConfigs[0]))
        .mockResolvedValueOnce(JSON.stringify(mockConfigs[1]));

      await syncHandler();

      expect(mockSocket.emit).toHaveBeenCalledWith('sync:complete', {
        configs: mockConfigs,
        timestamp: expect.any(String),
      });
    });

    it('debe manejar error en sincronización', async () => {
      connectionHandler(mockSocket);

      const syncHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'request:sync')[1];

      (redisCache.keys as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await syncHandler();

      expect(mockSocket.emit).toHaveBeenCalledWith('sync:error', {
        message: 'Error syncing configurations',
      });
    });

    it('debe manejar desconexión', () => {
      connectionHandler(mockSocket);

      expect((service as any).clients.size).toBe(1);

      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )[1];

      disconnectHandler();

      expect((service as any).clients.size).toBe(0);
    });
  });

  describe('publishConfigUpdate', () => {
    beforeEach(() => {
      service.initialize(mockServer);
    });

    it('debe publicar actualización de configuración', async () => {
      const config = {
        id: 'test-id',
        type: StudioConfigType.PLACEHOLDER,
        name: 'Test Config',
      };

      await service.publishConfigUpdate('create', config as any, 'test-user');

      expect(redisCache.publish).toHaveBeenCalledWith(
        'studio:updates',
        expect.stringContaining('"action":"create"')
      );
    });

    it('debe difundir actualización a clientes conectados', async () => {
      const config = {
        id: 'test-id',
        type: StudioConfigType.PLACEHOLDER,
      };

      const toMock = jest.fn(() => ({
        emit: jest.fn(),
      }));
      mockIO.to = toMock;

      await service.publishConfigUpdate('update', config as any, 'test-user');

      expect(toMock).toHaveBeenCalledWith('studio:superadmin');
      expect(toMock).toHaveBeenCalledWith('studio:PLACEHOLDER');
    });

    it('debe manejar actualizaciones de plantillas', async () => {
      const config = {
        id: 'test-id',
        type: StudioConfigType.TEMPLATE,
        templateType: 'url',
      };

      const toMock = jest.fn(() => ({
        emit: jest.fn(),
      }));
      mockIO.to = toMock;

      await service.publishConfigUpdate('update', config as any, 'test-user');

      expect(toMock).toHaveBeenCalledWith('studio:TEMPLATE:url');
    });
  });

  describe('getConnectionStats', () => {
    it('debe retornar estadísticas de conexión', () => {
      service.initialize(mockServer);

      // Simular clientes conectados
      (service as any).clients.set('client1', {
        userId: 'user1',
        role: 'SUPERADMIN',
        socketId: 'socket1',
      });

      (service as any).clients.set('client2', {
        userId: 'user2',
        role: 'SUPERADMIN',
        socketId: 'socket2',
      });

      const stats = service.getConnectionStats();

      expect(stats).toEqual({
        totalClients: 2,
        clients: [
          { userId: 'user1', role: 'SUPERADMIN', socketId: 'socket1' },
          { userId: 'user2', role: 'SUPERADMIN', socketId: 'socket2' },
        ],
      });
    });
  });

  describe('cleanup', () => {
    it('debe limpiar recursos correctamente', () => {
      service.initialize(mockServer);

      (service as any).clients.set('test', {});

      service.cleanup();

      expect(mockIO.close).toHaveBeenCalled();
      expect((service as any).clients.size).toBe(0);
      expect((service as any).io).toBeNull();
    });
  });
});
