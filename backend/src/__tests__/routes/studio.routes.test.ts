/**
 * Tests para Studio Routes
 * 
 * Tests de integración para los endpoints de QR Studio
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { StudioConfigType } from '@prisma/client';
import studioRoutes from '../../routes/studio.routes.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { studioService } from '../../services/studioService.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Mock de dependencias
jest.mock('../../middleware/auth.middleware.js', () => ({
  authMiddleware: {
    authenticate: jest.fn((req, res, next) => {
      req.user = { id: 'test-user-id', email: 'admin@test.com', role: 'SUPERADMIN' };
      next();
    }),
    checkRole: jest.fn(() => (req: any, res: any, next: any) => next()),
  },
}));

jest.mock('../../services/studioService.js', () => ({
  studioService: {
    getAllConfigs: jest.fn(),
    getConfigByType: jest.fn(),
    upsertConfig: jest.fn(),
    deleteConfig: jest.fn(),
    resetToDefaults: jest.fn(),
    applyToAllTemplates: jest.fn(),
    getEffectiveConfig: jest.fn(),
  },
}));

// Configurar app de prueba
const app = express();
app.use(express.json());
app.use('/api/studio', studioRoutes);
app.use(errorHandler);

describe('Studio Routes', () => {
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
    createdById: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/studio/configs', () => {
    it('debe retornar todas las configuraciones', async () => {
      const mockConfigs = [mockConfig];
      (studioService.getAllConfigs as jest.Mock).mockResolvedValue(mockConfigs);

      const response = await request(app)
        .get('/api/studio/configs')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ configs: mockConfigs });
      expect(authMiddleware.authenticate).toHaveBeenCalled();
      expect(authMiddleware.checkRole).toHaveBeenCalledWith(['SUPERADMIN']);
    });

    it('debe requerir autenticación SUPERADMIN', async () => {
      (authMiddleware.authenticate as jest.Mock).mockImplementationOnce((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app).get('/api/studio/configs');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/studio/configs/:type/:templateType?', () => {
    it('debe retornar configuración específica por tipo', async () => {
      (studioService.getConfigByType as jest.Mock).mockResolvedValue(mockConfig);

      const response = await request(app)
        .get('/api/studio/configs/PLACEHOLDER')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ config: mockConfig });
      expect(studioService.getConfigByType).toHaveBeenCalledWith(
        StudioConfigType.PLACEHOLDER,
        undefined
      );
    });

    it('debe retornar configuración de plantilla', async () => {
      const templateConfig = { ...mockConfig, type: StudioConfigType.TEMPLATE, templateType: 'url' };
      (studioService.getConfigByType as jest.Mock).mockResolvedValue(templateConfig);

      const response = await request(app)
        .get('/api/studio/configs/TEMPLATE/url')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ config: templateConfig });
      expect(studioService.getConfigByType).toHaveBeenCalledWith(
        StudioConfigType.TEMPLATE,
        'url'
      );
    });

    it('debe retornar 404 si no existe configuración', async () => {
      (studioService.getConfigByType as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/studio/configs/PLACEHOLDER')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Configuración no encontrada');
    });

    it('debe validar tipo de configuración', async () => {
      const response = await request(app)
        .get('/api/studio/configs/INVALID_TYPE')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Tipo de configuración inválido');
    });
  });

  describe('POST /api/studio/configs', () => {
    const validPayload = {
      type: StudioConfigType.PLACEHOLDER,
      name: 'New Config',
      description: 'New description',
      config: {
        eye_shape: 'circle',
        data_pattern: 'dots',
        colors: {
          foreground: '#000000',
          background: '#FFFFFF',
        },
        error_correction: 'M',
      },
    };

    it('debe crear nueva configuración', async () => {
      (studioService.upsertConfig as jest.Mock).mockResolvedValue(mockConfig);

      const response = await request(app)
        .post('/api/studio/configs')
        .set('Authorization', 'Bearer test-token')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        config: mockConfig,
        message: 'Configuración guardada exitosamente',
      });
      expect(studioService.upsertConfig).toHaveBeenCalledWith(
        'test-user-id',
        validPayload
      );
    });

    it('debe validar payload requerido', async () => {
      const invalidPayload = {
        type: StudioConfigType.PLACEHOLDER,
        // falta name
        config: {},
      };

      const response = await request(app)
        .post('/api/studio/configs')
        .set('Authorization', 'Bearer test-token')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Datos de configuración inválidos');
    });

    it('debe validar colores hexadecimales', async () => {
      const invalidColorPayload = {
        ...validPayload,
        config: {
          ...validPayload.config,
          colors: {
            foreground: 'invalid-color',
            background: '#FFFFFF',
          },
        },
      };

      const response = await request(app)
        .post('/api/studio/configs')
        .set('Authorization', 'Bearer test-token')
        .send(invalidColorPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Datos de configuración inválidos');
    });

    it('debe requerir templateType para tipo TEMPLATE', async () => {
      const templatePayload = {
        ...validPayload,
        type: StudioConfigType.TEMPLATE,
        // falta templateType
      };

      const response = await request(app)
        .post('/api/studio/configs')
        .set('Authorization', 'Bearer test-token')
        .send(templatePayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('templateType es requerido para configuraciones de tipo TEMPLATE');
    });
  });

  describe('DELETE /api/studio/configs/:id', () => {
    it('debe eliminar configuración', async () => {
      (studioService.deleteConfig as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/studio/configs/test-config-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Configuración eliminada exitosamente',
      });
      expect(studioService.deleteConfig).toHaveBeenCalledWith(
        'test-config-id',
        'test-user-id'
      );
    });
  });

  describe('POST /api/studio/configs/reset', () => {
    it('debe resetear todas las configuraciones', async () => {
      (studioService.resetToDefaults as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/studio/configs/reset')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Configuraciones reseteadas a valores por defecto',
      });
      expect(studioService.resetToDefaults).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('POST /api/studio/configs/apply-all', () => {
    it('debe aplicar configuración a todas las plantillas', async () => {
      const configToApply = {
        colors: {
          foreground: '#FF0000',
          background: '#FFFFFF',
        },
      };

      (studioService.applyToAllTemplates as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/studio/configs/apply-all')
        .set('Authorization', 'Bearer test-token')
        .send({ config: configToApply });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Configuración aplicada a todas las plantillas exitosamente',
      });
      expect(studioService.applyToAllTemplates).toHaveBeenCalledWith(
        'test-user-id',
        configToApply
      );
    });

    it('debe validar configuración antes de aplicar', async () => {
      const invalidConfig = {
        colors: {
          foreground: 'not-a-color',
        },
      };

      const response = await request(app)
        .post('/api/studio/configs/apply-all')
        .set('Authorization', 'Bearer test-token')
        .send({ config: invalidConfig });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Configuración inválida');
    });
  });

  describe('GET /api/studio/effective-config/:templateType?', () => {
    it('debe retornar configuración efectiva', async () => {
      const effectiveConfig = {
        eye_shape: 'circle',
        data_pattern: 'dots',
        colors: {
          foreground: '#000000',
          background: '#FFFFFF',
        },
      };

      (studioService.getEffectiveConfig as jest.Mock).mockResolvedValue(effectiveConfig);

      const response = await request(app)
        .get('/api/studio/effective-config/url')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        config: effectiveConfig,
        templateType: 'url',
      });
      expect(studioService.getEffectiveConfig).toHaveBeenCalledWith('url');
    });

    it('debe funcionar sin templateType', async () => {
      const defaultConfig = {
        eye_shape: 'square',
        data_pattern: 'square',
      };

      (studioService.getEffectiveConfig as jest.Mock).mockResolvedValue(defaultConfig);

      const response = await request(app)
        .get('/api/studio/effective-config')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        config: defaultConfig,
        templateType: 'default',
      });
    });
  });
});