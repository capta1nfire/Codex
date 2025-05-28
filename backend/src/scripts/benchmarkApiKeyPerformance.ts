#!/usr/bin/env node

/**
 * Script de Benchmark para API Key Performance
 * Mide el impacto de las optimizaciones implementadas
 * Uso: npm run benchmark-apikey
 */

import { performance } from 'perf_hooks';

import bcrypt from 'bcrypt';

import { apiKeyCache } from '../lib/apiKeyCache.js';
import prisma from '../lib/prisma.js';
import { userStore } from '../models/user.js';
import logger from '../utils/logger.js';

interface BenchmarkResult {
  scenario: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  successRate: number;
  cacheHitRate?: number;
}

class ApiKeyBenchmark {
  private testApiKeys: string[] = [];
  private testUserIds: string[] = [];

  async setup() {
    logger.info('🏗️ Configurando benchmark...');

    // Limpiar caché antes del test
    await apiKeyCache.cleanup();

    // Crear usuarios de prueba con API keys
    const testUsers = [];
    for (let i = 0; i < 10; i++) {
      const userData = {
        email: `benchmark.user.${i}@test.com`,
        password: 'testpassword123',
        firstName: `BenchUser${i}`,
        lastName: 'Test',
      };

      try {
        const user = await userStore.createUser(userData);
        const apiKey = await userStore.generateApiKey(user.id);

        this.testApiKeys.push(apiKey);
        this.testUserIds.push(user.id);
        testUsers.push({ user, apiKey });

        logger.info(`✅ Usuario benchmark ${i + 1}/10 creado`);
      } catch (error) {
        logger.warn(`⚠️ Usuario ${i} ya existe, usando existente`);

        // Si el usuario ya existe, buscar por email y regenerar API key
        const existingUser = await userStore.findByEmail(userData.email);
        if (existingUser) {
          const apiKey = await userStore.generateApiKey(existingUser.id);
          this.testApiKeys.push(apiKey);
          this.testUserIds.push(existingUser.id);
        }
      }
    }

    logger.info(`✅ Setup completado con ${this.testApiKeys.length} usuarios de prueba`);
    return testUsers;
  }

  async cleanup() {
    logger.info('🧹 Limpiando datos de benchmark...');

    // Eliminar usuarios de prueba
    for (const userId of this.testUserIds) {
      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (error) {
        // Usuario ya eliminado o no existe
      }
    }

    // Limpiar caché
    await apiKeyCache.cleanup();

    logger.info('✅ Limpieza completada');
  }

  async measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    return { result, time: end - start };
  }

  async benchmarkColdCache(): Promise<BenchmarkResult> {
    logger.info('❄️ Benchmark: Cold Cache (sin caché)');

    // Limpiar caché para simular estado inicial
    await apiKeyCache.cleanup();

    const times: number[] = [];
    let successCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const apiKey = this.testApiKeys[i % this.testApiKeys.length];

      const { result, time } = await this.measureTime(async () => {
        return userStore.findByApiKey(apiKey);
      });

      times.push(time);
      if (result) successCount++;

      // Pequeña pausa para no saturar
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    return {
      scenario: 'Cold Cache (sin caché)',
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      successRate: (successCount / iterations) * 100,
    };
  }

  async benchmarkWarmCache(): Promise<BenchmarkResult> {
    logger.info('🔥 Benchmark: Warm Cache (con caché)');

    // Precalentar caché ejecutando cada API key una vez
    for (const apiKey of this.testApiKeys) {
      await userStore.findByApiKey(apiKey);
    }

    const times: number[] = [];
    let successCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const apiKey = this.testApiKeys[i % this.testApiKeys.length];

      const { result, time } = await this.measureTime(async () => {
        return userStore.findByApiKey(apiKey);
      });

      times.push(time);
      if (result) successCount++;
    }

    // Obtener estadísticas de caché
    const cacheStats = await apiKeyCache.getStats();
    const cacheHitRate =
      (cacheStats.validEntries / (cacheStats.validEntries + cacheStats.invalidEntries)) * 100;

    return {
      scenario: 'Warm Cache (con caché)',
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      successRate: (successCount / iterations) * 100,
      cacheHitRate,
    };
  }

  async benchmarkInvalidKeys(): Promise<BenchmarkResult> {
    logger.info('❌ Benchmark: Invalid API Keys');

    const invalidKeys = [
      'invalid.key.12345678901234567890123',
      'wrongpfx.key.12345678901234567890123',
      'fakepref.key.12345678901234567890123',
      'badkey01.key.12345678901234567890123',
      'notvalid.key.12345678901234567890123',
    ];

    const times: number[] = [];
    let successCount = 0;
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const invalidKey = invalidKeys[i % invalidKeys.length];

      const { result, time } = await this.measureTime(async () => {
        return userStore.findByApiKey(invalidKey);
      });

      times.push(time);
      if (result === null) successCount++; // Success = correctly returning null
    }

    return {
      scenario: 'Invalid API Keys',
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      successRate: (successCount / iterations) * 100,
    };
  }

  async benchmarkConcurrentRequests(): Promise<BenchmarkResult> {
    logger.info('⚡ Benchmark: Concurrent Requests');

    const iterations = 50;
    const concurrency = 10;
    const times: number[] = [];
    let successCount = 0;

    const { time: totalTime } = await this.measureTime(async () => {
      const promises = [];

      for (let i = 0; i < iterations; i++) {
        const apiKey = this.testApiKeys[i % this.testApiKeys.length];

        const promise = this.measureTime(async () => {
          return userStore.findByApiKey(apiKey);
        }).then(({ result, time }) => {
          times.push(time);
          if (result) successCount++;
          return result;
        });

        promises.push(promise);

        // Controlar concurrencia
        if (promises.length >= concurrency) {
          await Promise.all(promises.splice(0, concurrency));
        }
      }

      // Ejecutar promesas restantes
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    });

    return {
      scenario: 'Concurrent Requests',
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      iterations,
      successRate: (successCount / iterations) * 100,
    };
  }

  printResults(results: BenchmarkResult[]) {
    console.log('\n' + '='.repeat(80));
    console.log('🏆 RESULTADOS DEL BENCHMARK API KEY PERFORMANCE');
    console.log('='.repeat(80));

    results.forEach((result) => {
      console.log(`\n📊 ${result.scenario}:`);
      console.log(`   ⏱️  Tiempo promedio: ${result.avgTime.toFixed(2)}ms`);
      console.log(`   ⚡ Tiempo mínimo: ${result.minTime.toFixed(2)}ms`);
      console.log(`   🐌 Tiempo máximo: ${result.maxTime.toFixed(2)}ms`);
      console.log(`   🔄 Iteraciones: ${result.iterations}`);
      console.log(`   ✅ Tasa de éxito: ${result.successRate.toFixed(1)}%`);
      if (result.cacheHitRate !== undefined) {
        console.log(`   🎯 Cache Hit Rate: ${result.cacheHitRate.toFixed(1)}%`);
      }
    });

    // Análisis comparativo
    const coldCache = results.find((r) => r.scenario.includes('Cold'));
    const warmCache = results.find((r) => r.scenario.includes('Warm'));

    if (coldCache && warmCache) {
      const improvement = ((coldCache.avgTime - warmCache.avgTime) / coldCache.avgTime) * 100;
      console.log('\n' + '='.repeat(80));
      console.log('📈 ANÁLISIS DE MEJORA:');
      console.log(`   🚀 Mejora de performance: ${improvement.toFixed(1)}%`);
      console.log(
        `   ⚡ Speedup: ${(coldCache.avgTime / warmCache.avgTime).toFixed(1)}x más rápido`
      );
      console.log(`   💾 Cold cache promedio: ${coldCache.avgTime.toFixed(2)}ms`);
      console.log(`   🔥 Warm cache promedio: ${warmCache.avgTime.toFixed(2)}ms`);
      console.log('='.repeat(80));
    }
  }

  async runFullBenchmark() {
    try {
      await this.setup();

      const results: BenchmarkResult[] = [];

      // Ejecutar benchmarks
      results.push(await this.benchmarkColdCache());
      results.push(await this.benchmarkWarmCache());
      results.push(await this.benchmarkInvalidKeys());
      results.push(await this.benchmarkConcurrentRequests());

      // Mostrar resultados
      this.printResults(results);

      // Mostrar estadísticas finales de caché
      const finalStats = await apiKeyCache.getStats();
      console.log('\n📊 ESTADÍSTICAS FINALES DE CACHÉ:');
      console.log(`   📦 Total entradas: ${finalStats.totalEntries}`);
      console.log(`   ✅ Entradas válidas: ${finalStats.validEntries}`);
      console.log(`   ❌ Entradas inválidas: ${finalStats.invalidEntries}`);
      console.log(`   ⏰ Entradas expiradas: ${finalStats.expiredEntries}`);
    } finally {
      await this.cleanup();
    }
  }
}

async function runBenchmark() {
  const benchmark = new ApiKeyBenchmark();

  try {
    logger.info('🚀 Iniciando benchmark de performance de API Keys...');
    await benchmark.runFullBenchmark();
    logger.info('✅ Benchmark completado exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante el benchmark:', error);
    await benchmark.cleanup();
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark();
}
