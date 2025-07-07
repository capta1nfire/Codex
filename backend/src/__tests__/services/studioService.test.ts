/**
 * Tests para StudioService
 * 
 * Cobertura completa del servicio de Studio incluyendo:
 * - CRUD de configuraciones
 * - Validaciones
 * - Cache con Redis
 * - Manejo de errores
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { StudioConfigType } from '@prisma/client';
import { studioService } from '../../services/studioService.js';
import prisma from '../../lib/prisma.js';
import { redisCache } from '../../lib/redisCache.js';
import { AppError } from '../../utils/errors.js';

// Mock de dependencias
jest.mock('../../lib/prisma.js', () => ({
  default: {
    studioConfig: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../lib/redisCache.js', () => ({
  redisCache: {
    get: jest.fn(),
    setWithTTL: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

jest.mock('../../services/studioWebSocketService.js', () => ({
  studioWebSocketService: {
    publishConfigUpdate: jest.fn(),
  },
}));

describe('StudioService', () => {
  const mockUserId = 'test-user-id';
  const mockConfig = {
    id: 'test-config-id',
    type: StudioConfigType.PLACEHOLDER,
    name: 'Test Config',
    description: 'Test description',
    templateType: null,
    config: {
      eye_shape: 'square',
      data_pattern: 'dots',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
    },
    isActive: true,
    version: 1,
    createdById: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllConfigs', () => {
    it('debe retornar todas las configuraciones activas', async () => {
      const mockConfigs = [mockConfig];
      (prisma.studioConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);

      const result = await studioService.getAllConfigs(mockUserId);

      expect(prisma.studioConfig.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [
          { type: 'asc' },
          { templateType: 'asc' },
          { updatedAt: 'desc' },
        ],
      });
      expect(result).toEqual(mockConfigs);
    });

    it('debe manejar errores de base de datos', async () => {
      (prisma.studioConfig.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(studioService.getAllConfigs(mockUserId)).rejects.toThrow(AppError);
    });
  });

  describe('getConfigByType', () => {
    it('debe retornar configuración desde cache si existe', async () => {
      const cachedConfig = JSON.stringify(mockConfig);
      (redisCache.get as jest.Mock).mockResolvedValue(cachedConfig);

      const result = await studioService.getConfigByType(
        StudioConfigType.PLACEHOLDER,
        undefined
      );

      expect(redisCache.get).toHaveBeenCalledWith('studio:config:PLACEHOLDER:default');
      expect(result).toEqual(mockConfig);
      expect(prisma.studioConfig.findFirst).not.toHaveBeenCalled();
    });

    it('debe buscar en DB si no está en cache', async () => {
      (redisCache.get as jest.Mock).mockResolvedValue(null);
      (prisma.studioConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);

      const result = await studioService.getConfigByType(
        StudioConfigType.PLACEHOLDER,
        undefined
      );

      expect(prisma.studioConfig.findFirst).toHaveBeenCalledWith({
        where: {
          type: StudioConfigType.PLACEHOLDER,
          templateType: null,
          isActive: true,
        },
      });
      expect(redisCache.setWithTTL).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('debe retornar null si no existe configuración', async () => {
      (redisCache.get as jest.Mock).mockResolvedValue(null);
      (prisma.studioConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await studioService.getConfigByType(
        StudioConfigType.PLACEHOLDER,
        undefined
      );

      expect(result).toBeNull();
    });
  });

  describe('upsertConfig', () => {
    const newConfigData = {
      type: StudioConfigType.PLACEHOLDER,
      name: 'New Config',
      description: 'New description',
      config: {
        eye_shape: 'circle',
        data_pattern: 'square',
        colors: {
          foreground: '#FF0000',
          background: '#FFFFFF',
        },
      },
    };

    it('debe crear nueva configuración si no existe', async () => {
      (prisma.studioConfig.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.studioConfig.create as jest.Mock).mockResolvedValue(mockConfig);

      const result = await studioService.upsertConfig(mockUserId, newConfigData);

      expect(prisma.studioConfig.create).toHaveBeenCalledWith({
        data: {
          type: newConfigData.type,
          name: newConfigData.name,
          description: newConfigData.description,
          templateType: undefined,
          config: newConfigData.config,
          createdById: mockUserId,
        },
      });
      expect(redisCache.del).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('debe actualizar configuración existente', async () => {
      (prisma.studioConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);
      const updatedConfig = { ...mockConfig, version: 2 };
      (prisma.studioConfig.update as jest.Mock).mockResolvedValue(updatedConfig);

      const result = await studioService.upsertConfig(mockUserId, newConfigData);

      expect(prisma.studioConfig.update).toHaveBeenCalledWith({
        where: { id: mockConfig.id },
        data: {
          name: newConfigData.name,
          description: newConfigData.description,
          config: newConfigData.config,
          version: { increment: 1 },
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedConfig);
    });

    it('debe invalidar cache después de actualizar', async () => {
      (prisma.studioConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.studioConfig.update as jest.Mock).mockResolvedValue(mockConfig);

      await studioService.upsertConfig(mockUserId, newConfigData);

      expect(redisCache.del).toHaveBeenCalledWith(
        'studio:config:PLACEHOLDER:default'
      );
    });
  });

  describe('deleteConfig', () => {
    it('debe marcar configuración como inactiva', async () => {
      (prisma.studioConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.studioConfig.update as jest.Mock).mockResolvedValue({
        ...mockConfig,
        isActive: false,
      });

      await studioService.deleteConfig(mockConfig.id, mockUserId);

      expect(prisma.studioConfig.update).toHaveBeenCalledWith({
        where: { id: mockConfig.id },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
      expect(redisCache.del).toHaveBeenCalled();
    });

    it('debe lanzar error si configuración no existe', async () => {
      (prisma.studioConfig.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        studioService.deleteConfig('non-existent-id', mockUserId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('resetToDefaults', () => {
    it('debe eliminar todas las configuraciones del usuario', async () => {
      await studioService.resetToDefaults(mockUserId);

      expect(prisma.studioConfig.deleteMany).toHaveBeenCalledWith({
        where: { createdById: mockUserId },
      });
    });

    it('debe limpiar todo el cache', async () => {
      (redisCache.keys as jest.Mock).mockResolvedValue([
        'studio:config:PLACEHOLDER:default',
        'studio:config:TEMPLATE:url',
      ]);

      await studioService.resetToDefaults(mockUserId);

      expect(redisCache.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEffectiveConfig', () => {
    it('debe combinar configuración global con plantilla', async () => {
      const globalConfig = {
        ...mockConfig,
        type: StudioConfigType.GLOBAL,
        config: {
          error_correction: 'H',
          colors: {
            background: '#F0F0F0',
          },
        },
      };

      const templateConfig = {
        ...mockConfig,
        type: StudioConfigType.TEMPLATE,
        templateType: 'url',
        config: {
          eye_shape: 'circle',
          colors: {
            foreground: '#0000FF',
          },
        },
      };

      (prisma.studioConfig.findFirst as jest.Mock)
        .mockResolvedValueOnce(globalConfig)
        .mockResolvedValueOnce(templateConfig);

      const result = await studioService.getEffectiveConfig('url');

      expect(result).toEqual({
        error_correction: 'H',
        eye_shape: 'circle',
        colors: {
          background: '#F0F0F0',
          foreground: '#0000FF',
        },
      });
    });

    it('debe usar valores por defecto si no hay configuraciones', async () => {
      (prisma.studioConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await studioService.getEffectiveConfig();

      expect(result).toBeDefined();
      expect(result.eye_shape).toBe('square');
      expect(result.data_pattern).toBe('square');
    });
  });

  describe('applyToAllTemplates', () => {
    it('debe aplicar configuración a todas las plantillas', async () => {
      const templates = [
        { ...mockConfig, templateType: 'url' },
        { ...mockConfig, templateType: 'wifi' },
      ];

      (prisma.studioConfig.findMany as jest.Mock).mockResolvedValue(templates);
      (prisma.studioConfig.update as jest.Mock).mockResolvedValue(mockConfig);

      const newConfig = {
        colors: {
          foreground: '#FF0000',
          background: '#FFFFFF',
        },
      };

      await studioService.applyToAllTemplates(mockUserId, newConfig);

      expect(prisma.studioConfig.update).toHaveBeenCalledTimes(2);
      expect(redisCache.del).toHaveBeenCalledTimes(2);
    });
  });
});