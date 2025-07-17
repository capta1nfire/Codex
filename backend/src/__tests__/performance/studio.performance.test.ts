/**
 * Tests de rendimiento para QR Studio
 *
 * Verifica que el sistema mantenga tiempos de respuesta aceptables
 * bajo diferentes cargas de trabajo
 */

import { performance } from 'perf_hooks';

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { jest } from '@jest/globals';
import { PrismaClient, StudioConfigType } from '@prisma/client';

import { redisCache } from '../../lib/redisCache.js';
import { studioService } from '../../services/studioService.js';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    studioConfig: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
  StudioConfigType: { GLOBAL: 'GLOBAL', PLACEHOLDER: 'PLACEHOLDER', TEMPLATE: 'TEMPLATE' },
}));
const prismaMock = new PrismaClient() as jest.Mocked<PrismaClient>;

// Configuración de umbrales de rendimiento (ms)
const PERFORMANCE_THRESHOLDS = {
  getAllConfigs: 100, // 100ms para listar todas
  getConfigByType: 50, // 50ms para obtener una config
  upsertConfig: 200, // 200ms para crear/actualizar
  deleteConfig: 150, // 150ms para eliminar
  cacheHit: 10, // 10ms para hit de cache
  getEffectiveConfig: 100, // 100ms para merge de configs
};

describe('Studio Performance Tests', () => {
  const TEST_USER_ID = 'perf-test-user';
  const NUM_CONFIGS = 50; // Número de configuraciones para tests de carga

  // Configuraciones de prueba
  const testConfigs: any[] = [];

  beforeAll(async () => {
    prismaMock.studioConfig.create.mockResolvedValue({ id: 'test' });
    prismaMock.studioConfig.delete.mockResolvedValue({});
    prismaMock.studioConfig.deleteMany.mockResolvedValue({ count: NUM_CONFIGS });
  });

  afterAll(async () => {
    prismaMock.studioConfig.deleteMany.mockResolvedValue({ count: NUM_CONFIGS });
  });

  beforeEach(() => {
    prismaMock.studioConfig.findMany.mockResolvedValue([
      { id: '1', type: StudioConfigType.GLOBAL, config: {} },
    ]);
  });

  describe('getAllConfigs performance', () => {
    it(`debe cargar ${NUM_CONFIGS} configuraciones en menos de ${PERFORMANCE_THRESHOLDS.getAllConfigs}ms`, async () => {
      const start = performance.now();
      const configs = await studioService.getAllConfigs(TEST_USER_ID);
      if (!configs) throw new Error('Configs undefined');
      const duration = performance.now() - start;

      expect(configs.length).toBeGreaterThanOrEqual(NUM_CONFIGS);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.getAllConfigs);

      console.log(`getAllConfigs tomó ${duration.toFixed(2)}ms para ${configs.length} configs`);
    });

    it('debe manejar cargas concurrentes eficientemente', async () => {
      const concurrentRequests = 10;
      const start = performance.now();

      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => studioService.getAllConfigs(TEST_USER_ID));

      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      const avgDuration = duration / concurrentRequests;

      results.forEach((configs) => {
        expect(configs.length).toBeGreaterThanOrEqual(NUM_CONFIGS);
      });

      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.getAllConfigs);

      console.log(
        `${concurrentRequests} llamadas concurrentes: ${avgDuration.toFixed(2)}ms promedio`
      );
    });
  });

  describe('getConfigByType performance', () => {
    it('debe obtener configuración sin cache rápidamente', async () => {
      // Limpiar cache para forzar búsqueda en DB
      await redisCache.flushall();

      const start = performance.now();
      const config = await studioService.getConfigByType(StudioConfigType.PLACEHOLDER, undefined);
      const duration = performance.now() - start;

      expect(config).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.getConfigByType);

      console.log(`getConfigByType (sin cache) tomó ${duration.toFixed(2)}ms`);
    });

    it('debe obtener configuración desde cache muy rápidamente', async () => {
      // Primera llamada para poblar cache
      await studioService.getConfigByType(StudioConfigType.PLACEHOLDER);

      // Segunda llamada debe ser desde cache
      const start = performance.now();
      const config = await studioService.getConfigByType(StudioConfigType.PLACEHOLDER, undefined);
      const duration = performance.now() - start;

      expect(config).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.cacheHit);

      console.log(`getConfigByType (con cache) tomó ${duration.toFixed(2)}ms`);
    });
  });

  describe('upsertConfig performance', () => {
    it('debe crear configuración rápidamente', async () => {
      const start = performance.now();
      const config = await studioService.upsertConfig(TEST_USER_ID, {
        type: StudioConfigType.TEMPLATE,
        name: 'Performance Test Create',
        templateType: 'perf-test',
        config: {
          eye_shape: 'circle',
          data_pattern: 'dots',
          colors: {
            foreground: '#FF0000',
            background: '#FFFFFF',
          },
        },
      });
      const duration = performance.now() - start;

      expect(config).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.upsertConfig);

      console.log(`upsertConfig (crear) tomó ${duration.toFixed(2)}ms`);

      // Limpiar
      await prismaMock.studioConfig.delete({ where: { id: config.id } });
    });

    it('debe actualizar configuración rápidamente', async () => {
      const existingConfig = testConfigs[0];

      const start = performance.now();
      const config = await studioService.upsertConfig(TEST_USER_ID, {
        type: existingConfig.type,
        name: 'Updated Name',
        templateType: existingConfig.templateType,
        config: existingConfig.config,
      });
      const duration = performance.now() - start;

      expect(config.version).toBeGreaterThan(existingConfig.version);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.upsertConfig);

      console.log(`upsertConfig (actualizar) tomó ${duration.toFixed(2)}ms`);
    });
  });

  describe('getEffectiveConfig performance', () => {
    beforeAll(async () => {
      // Crear configuración global para merge
      await studioService.upsertConfig(TEST_USER_ID, {
        type: StudioConfigType.GLOBAL,
        name: 'Global Config',
        config: {
          error_correction: 'H',
          colors: {
            background: '#F0F0F0',
          },
        },
      });
    });

    it('debe hacer merge de configuraciones eficientemente', async () => {
      const start = performance.now();
      const config = await studioService.getEffectiveConfig('template-0');
      const duration = performance.now() - start;

      expect(config).toBeDefined();
      expect(config.error_correction).toBe('H'); // De global
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.getEffectiveConfig);

      console.log(`getEffectiveConfig tomó ${duration.toFixed(2)}ms`);
    });
  });

  describe('Cache performance', () => {
    it('debe mejorar significativamente el rendimiento', async () => {
      const key = 'perf-test-key';
      const data = {
        large: 'x'.repeat(10000), // Datos grandes para hacer más evidente la diferencia
        config: testConfigs[0].config,
      };

      // Sin cache - escribir y leer de DB simulado
      const dbStart = performance.now();
      await redisCache.setWithTTL(key, JSON.stringify(data), 60);
      const dbDuration = performance.now() - dbStart;

      // Con cache
      const cacheStart = performance.now();
      const cached = await redisCache.get(key);
      const cacheDuration = performance.now() - cacheStart;

      expect(cached).toBeDefined();
      expect(cacheDuration).toBeLessThan(dbDuration);
      expect(cacheDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.cacheHit);

      console.log(`Cache mejora: ${((dbDuration / cacheDuration) * 100).toFixed(0)}% más rápido`);
    });
  });

  describe('Concurrent operations', () => {
    it('debe manejar operaciones mixtas concurrentes', async () => {
      const operations = [
        () => studioService.getAllConfigs(TEST_USER_ID),
        () => studioService.getConfigByType(StudioConfigType.PLACEHOLDER),
        () => studioService.getConfigByType(StudioConfigType.TEMPLATE, 'template-1'),
        () => studioService.getEffectiveConfig('template-2'),
        () =>
          studioService.upsertConfig(TEST_USER_ID, {
            type: StudioConfigType.TEMPLATE,
            name: 'Concurrent Test',
            templateType: 'concurrent',
            config: { eye_shape: 'star' },
          }),
      ];

      const iterations = 5;
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(...operations.map((op) => op()));
      }

      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      const avgDuration = duration / promises.length;

      expect(results).toHaveLength(operations.length * iterations);
      expect(avgDuration).toBeLessThan(50); // 50ms promedio por operación

      console.log(`${promises.length} operaciones mixtas: ${avgDuration.toFixed(2)}ms promedio`);
    });
  });

  describe('Memory usage', () => {
    it('debe mantener uso de memoria estable', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Realizar muchas operaciones
      for (let i = 0; i < 100; i++) {
        await studioService.getAllConfigs(TEST_USER_ID);
        await studioService.getConfigByType(StudioConfigType.TEMPLATE, `template-${i % 5}`);
      }

      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(50); // No más de 50MB de incremento

      console.log(`Incremento de memoria: ${memoryIncrease.toFixed(2)}MB`);
    });
  });
});
