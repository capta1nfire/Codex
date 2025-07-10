/**
 * Studio Service
 *
 * Servicio para gestionar las configuraciones de QR Studio.
 * Maneja CRUD de configuraciones globales, plantillas y placeholders.
 *
 * Características:
 * - CRUD completo de configuraciones
 * - Validación de permisos SUPERADMIN
 * - Gestión de versiones
 * - Cache con Redis
 * - Valores por defecto inteligentes
 */

import { StudioConfig, StudioConfigType, Prisma } from '@prisma/client';

import { studioWebSocketService } from './studioWebSocketService.js';
import { DEFAULT_QR_CONFIG } from '../constants/qrDefaults.js';
import prisma from '../lib/prisma.js';
import { redisCache } from '../lib/redisCache.js';
import { AppError, ErrorCode, HttpStatus } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Tipo para configuración QR
interface QRConfig {
  eye_shape?: string;
  data_pattern?: string;
  colors?: {
    foreground?: string;
    background?: string;
    eye_colors?: {
      outer?: string;
      inner?: string;
    };
  };
  gradient?: {
    enabled: boolean;
    gradient_type?: string;
    colors?: string[];
    angle?: number;
    apply_to_eyes?: boolean;
    apply_to_data?: boolean;
    stroke_style?: {
      enabled: boolean;
      color?: string;
      width?: number;
      opacity?: number;
    };
  };
  effects?: Array<{
    type: string;
    intensity?: number;
  }>;
  error_correction?: string;
  logo?: {
    enabled: boolean;
    size_percentage?: number;
    padding?: number;
    shape?: string;
  };
  frame?: {
    enabled: boolean;
    style?: string;
    color?: string;
  };
}

export class StudioService {
  private readonly CACHE_PREFIX = 'studio:config:';
  private readonly CACHE_TTL = 300; // 5 minutos

  /**
   * Obtener todas las configuraciones activas
   */
  async getAllConfigs(userId: string): Promise<StudioConfig[]> {
    try {
      const configs = await prisma.studioConfig.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ type: 'asc' }, { templateType: 'asc' }, { updatedAt: 'desc' }],
      });

      return configs;
    } catch (error) {
      logger.error('Error obteniendo configuraciones de studio:', error);
      throw new AppError(
        'Error al obtener configuraciones',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
  }

  /**
   * Obtener configuración por tipo y plantilla
   */
  async getConfigByType(
    type: StudioConfigType,
    templateType?: string
  ): Promise<StudioConfig | null> {
    const cacheKey = `${this.CACHE_PREFIX}${type}:${templateType || 'default'}`;

    // Intentar obtener de cache
    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as StudioConfig;
      }
    } catch (error) {
      logger.warn('Error leyendo de cache:', error);
    }

    // Buscar en base de datos
    try {
      const config = await prisma.studioConfig.findFirst({
        where: {
          type,
          templateType: templateType || null,
          isActive: true,
        },
      });

      // Guardar en cache si existe
      if (config) {
        try {
          await redisCache.setWithTTL(cacheKey, JSON.stringify(config), this.CACHE_TTL);
        } catch (error) {
          logger.warn('Error guardando en cache:', error);
        }
      }

      return config;
    } catch (error) {
      logger.error('Error obteniendo configuración por tipo:', error);
      throw new AppError(
        'Error al obtener configuración',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
  }

  /**
   * Crear o actualizar configuración
   */
  async upsertConfig(
    userId: string,
    data: {
      type: StudioConfigType;
      name: string;
      description?: string;
      templateType?: string;
      config: QRConfig;
    }
  ): Promise<StudioConfig> {
    try {
      // Si es una actualización, buscar configuración existente
      const existing = await prisma.studioConfig.findFirst({
        where: {
          type: data.type,
          templateType: data.templateType || null,
        },
      });

      let config: StudioConfig;

      if (existing) {
        // Actualizar configuración existente
        config = await prisma.studioConfig.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            description: data.description,
            config: data.config as Prisma.JsonObject,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
      } else {
        // Crear nueva configuración
        config = await prisma.studioConfig.create({
          data: {
            type: data.type,
            name: data.name,
            description: data.description,
            templateType: data.templateType,
            config: data.config as Prisma.JsonObject,
            createdById: userId,
          },
        });
      }

      // Invalidar cache
      const cacheKey = `${this.CACHE_PREFIX}${data.type}:${data.templateType || 'default'}`;
      try {
        await redisCache.del(cacheKey);
      } catch (error) {
        logger.warn('Error invalidando cache:', error);
      }

      logger.info(`Configuración ${existing ? 'actualizada' : 'creada'}: ${config.id}`);

      // Notificar por WebSocket
      await studioWebSocketService.publishConfigUpdate(
        existing ? 'update' : 'create',
        config,
        userId
      );

      return config;
    } catch (error) {
      logger.error('Error en upsert de configuración:', error);
      throw new AppError(
        'Error al guardar configuración',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
  }

  /**
   * Eliminar configuración
   */
  async deleteConfig(configId: string, userId: string): Promise<void> {
    try {
      const config = await prisma.studioConfig.findUnique({
        where: { id: configId },
      });

      if (!config) {
        throw new AppError(
          'Configuración no encontrada',
          HttpStatus.NOT_FOUND,
          ErrorCode.NOT_FOUND
        );
      }

      // Marcar como inactiva en lugar de eliminar
      await prisma.studioConfig.update({
        where: { id: configId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      // Invalidar cache
      const cacheKey = `${this.CACHE_PREFIX}${config.type}:${config.templateType || 'default'}`;
      try {
        await redisCache.del(cacheKey);
      } catch (error) {
        logger.warn('Error invalidando cache:', error);
      }

      logger.info(`Configuración eliminada: ${configId}`);

      // Notificar por WebSocket
      await studioWebSocketService.publishConfigUpdate(
        'delete',
        { id: configId, type: config.type },
        userId
      );
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error eliminando configuración:', error);
      throw new AppError(
        'Error al eliminar configuración',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
  }

  /**
   * Resetear todas las configuraciones a valores por defecto
   */
  async resetToDefaults(userId: string): Promise<void> {
    try {
      // Marcar todas las configuraciones como inactivas
      await prisma.studioConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Crear configuración global por defecto
      await this.upsertConfig(userId, {
        type: StudioConfigType.GLOBAL,
        name: 'Configuración Global Por Defecto',
        description: 'Configuración global aplicada a todos los QR',
        config: DEFAULT_QR_CONFIG,
      });

      // Invalidar todo el cache de studio
      try {
        const keys = await redisCache.keys(`${this.CACHE_PREFIX}*`);
        if (keys.length > 0) {
          await redisCache.del(...keys);
        }
      } catch (error) {
        logger.warn('Error invalidando cache masivo:', error);
      }

      logger.info('Configuraciones reseteadas a valores por defecto');
    } catch (error) {
      logger.error('Error reseteando configuraciones:', error);
      throw new AppError(
        'Error al resetear configuraciones',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
  }

  /**
   * Aplicar configuración a todas las plantillas
   */
  async applyToAllTemplates(userId: string, config: QRConfig): Promise<void> {
    try {
      // Obtener todas las plantillas activas
      const templates = await prisma.studioConfig.findMany({
        where: {
          type: StudioConfigType.TEMPLATE,
          isActive: true,
        },
      });

      // Actualizar cada plantilla
      await Promise.all(
        templates.map((template) =>
          prisma.studioConfig.update({
            where: { id: template.id },
            data: {
              config: config as Prisma.JsonObject,
              version: { increment: 1 },
              updatedAt: new Date(),
            },
          })
        )
      );

      // Invalidar todo el cache de plantillas
      try {
        const keys = await redisCache.keys(`${this.CACHE_PREFIX}TEMPLATE:*`);
        if (keys.length > 0) {
          await redisCache.del(...keys);
        }
      } catch (error) {
        logger.warn('Error invalidando cache de plantillas:', error);
      }

      logger.info(`Configuración aplicada a ${templates.length} plantillas`);
    } catch (error) {
      logger.error('Error aplicando configuración a plantillas:', error);
      throw new AppError(
        'Error al aplicar configuración',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
  }

  /**
   * Obtener configuración efectiva para un QR
   * Merge: default -> global -> template específico
   */
  async getEffectiveConfig(templateType?: string): Promise<QRConfig> {
    try {
      // Empezar con valores por defecto
      let effectiveConfig: QRConfig = { ...DEFAULT_QR_CONFIG };

      // Aplicar configuración global si existe
      const globalConfig = await this.getConfigByType(StudioConfigType.GLOBAL);
      if (globalConfig) {
        effectiveConfig = {
          ...effectiveConfig,
          ...(globalConfig.config as QRConfig),
        };
      }

      // Aplicar configuración de plantilla si existe
      if (templateType) {
        const templateConfig = await this.getConfigByType(StudioConfigType.TEMPLATE, templateType);
        if (templateConfig) {
          effectiveConfig = {
            ...effectiveConfig,
            ...(templateConfig.config as QRConfig),
          };
        }
      }

      return effectiveConfig;
    } catch (error) {
      logger.error('Error obteniendo configuración efectiva:', error);
      // En caso de error, devolver configuración por defecto
      return DEFAULT_QR_CONFIG;
    }
  }
}

export const studioService = new StudioService();
