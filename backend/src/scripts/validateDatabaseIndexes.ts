#!/usr/bin/env node

/**
 * Script de Validación de Índices PostgreSQL
 * Verifica que los índices optimizados estén funcionando correctamente
 * Uso: npm run validate-indexes
 */

import { performance } from 'perf_hooks';

import prisma from '../lib/prisma.js';
import logger from '../utils/logger.js';

interface IndexInfo {
  indexName: string;
  tableName: string;
  columnNames: string[];
  isUnique: boolean;
  size: string;
}

interface QueryPerformance {
  query: string;
  executionTime: number;
  usesIndex: boolean;
  indexUsed?: string;
}

class DatabaseIndexValidator {
  async getIndexes(): Promise<IndexInfo[]> {
    logger.info('📊 Obteniendo información de índices...');

    const indexQuery = `
      SELECT 
        indexname as "indexName",
        tablename as "tableName",
        indexdef as "indexDef"
      FROM pg_indexes 
      WHERE tablename = 'User' 
      AND schemaname = 'public'
      ORDER BY indexname;
    `;

    try {
      const result = await prisma.$queryRawUnsafe<any[]>(indexQuery);

      return result.map((row) => ({
        indexName: row.indexName,
        tableName: row.tableName,
        columnNames: this.extractColumnsFromIndexDef(row.indexDef),
        isUnique: row.indexDef.includes('UNIQUE'),
        size: 'N/A', // PostgreSQL requiere queries más complejas para el tamaño
      }));
    } catch (error) {
      logger.error('Error obteniendo índices:', error);
      return [];
    }
  }

  private extractColumnsFromIndexDef(indexDef: string): string[] {
    // Extraer nombres de columnas de la definición del índice
    const match = indexDef.match(/\(([^)]+)\)/);
    if (match) {
      return match[1].split(',').map((col) => col.trim().replace(/"/g, ''));
    }
    return [];
  }

  async validateIndexUsage(): Promise<QueryPerformance[]> {
    logger.info('🔍 Validando uso de índices en consultas típicas...');

    const queries = [
      {
        name: 'Búsqueda por API Key Prefix',
        query: `SELECT * FROM "User" WHERE "apiKeyPrefix" = 'test1234' AND "isActive" = true`,
      },
      {
        name: 'Login por email',
        query: `SELECT * FROM "User" WHERE "email" = 'test@example.com' AND "isActive" = true`,
      },
      {
        name: 'Consulta por rol',
        query: `SELECT * FROM "User" WHERE "role" = 'USER' AND "isActive" = true`,
      },
      {
        name: 'Usuarios activos ordenados',
        query: `SELECT * FROM "User" WHERE "isActive" = true ORDER BY "createdAt" DESC LIMIT 10`,
      },
      {
        name: 'Búsqueda por username',
        query: `SELECT * FROM "User" WHERE "username" = 'testuser'`,
      },
      {
        name: 'Usuarios por actividad',
        query: `SELECT * FROM "User" WHERE "lastLogin" > NOW() - INTERVAL '30 days'`,
      },
    ];

    const results: QueryPerformance[] = [];

    for (const queryInfo of queries) {
      logger.info(`   🔄 Analizando: ${queryInfo.name}`);

      try {
        // Usar EXPLAIN ANALYZE para obtener plan de ejecución
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${queryInfo.query}`;

        const start = performance.now();
        const explainResult = await prisma.$queryRawUnsafe<any[]>(explainQuery);
        const end = performance.now();

        const plan = explainResult[0]['QUERY PLAN'][0];
        const executionTime = plan['Execution Time'];
        const usesIndex = this.checkIndexUsage(plan);

        results.push({
          query: queryInfo.name,
          executionTime: executionTime || end - start,
          usesIndex: usesIndex.uses,
          indexUsed: usesIndex.indexName,
        });
      } catch (error) {
        logger.warn(`   ⚠️ Error analizando "${queryInfo.name}":`, error);
        results.push({
          query: queryInfo.name,
          executionTime: -1,
          usesIndex: false,
        });
      }
    }

    return results;
  }

  private checkIndexUsage(plan: any): { uses: boolean; indexName?: string } {
    // Recursivamente buscar uso de índices en el plan de ejecución
    if (plan['Node Type'] === 'Index Scan' || plan['Node Type'] === 'Index Only Scan') {
      return {
        uses: true,
        indexName: plan['Index Name'],
      };
    }

    if (plan['Plans']) {
      for (const subPlan of plan['Plans']) {
        const subResult = this.checkIndexUsage(subPlan);
        if (subResult.uses) {
          return subResult;
        }
      }
    }

    return { uses: false };
  }

  async benchmarkQueries(): Promise<void> {
    logger.info('⚡ Realizando benchmark de consultas optimizadas...');

    // Crear algunos datos de prueba si no existen
    await this.ensureTestData();

    const benchmarks = [
      {
        name: 'API Key Lookup',
        query: async () => {
          return prisma.user.findMany({
            where: {
              apiKeyPrefix: 'test1234',
              isActive: true,
            },
            select: { id: true, email: true },
          });
        },
      },
      {
        name: 'Email Lookup',
        query: async () => {
          return prisma.user.findUnique({
            where: { email: 'benchmark.user.0@test.com' },
          });
        },
      },
      {
        name: 'Role Query',
        query: async () => {
          return prisma.user.findMany({
            where: {
              role: 'USER',
              isActive: true,
            },
            take: 10,
          });
        },
      },
      {
        name: 'Active Users Ordered',
        query: async () => {
          return prisma.user.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });
        },
      },
    ];

    const iterations = 10;

    for (const benchmark of benchmarks) {
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await benchmark.query();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      logger.info(`   📊 ${benchmark.name}:`);
      logger.info(`      ⏱️  Promedio: ${avgTime.toFixed(2)}ms`);
      logger.info(`      ⚡ Mínimo: ${minTime.toFixed(2)}ms`);
      logger.info(`      🐌 Máximo: ${maxTime.toFixed(2)}ms`);
    }
  }

  async ensureTestData(): Promise<void> {
    // Verificar si ya existen usuarios de benchmark
    const existingUser = await prisma.user.findUnique({
      where: { email: 'benchmark.user.0@test.com' },
    });

    if (!existingUser) {
      logger.info('📝 Creando datos de prueba para benchmark...');
      // Los datos de prueba se crearán en el script de benchmark
      logger.info('💡 Ejecuta primero: npm run benchmark-apikey');
    }
  }

  async validateConstraints(): Promise<void> {
    logger.info('🔒 Validando constraints y unicidad...');

    try {
      // Verificar constraint de email único
      const emailCheck = await prisma.$queryRaw`
        SELECT COUNT(*) as count, email 
        FROM "User" 
        GROUP BY email 
        HAVING COUNT(*) > 1
      `;

      if (Array.isArray(emailCheck) && emailCheck.length > 0) {
        logger.warn('⚠️ Se encontraron emails duplicados:', emailCheck);
      } else {
        logger.info('   ✅ Constraint de email único: OK');
      }

      // Verificar constraint de username único
      const usernameCheck = await prisma.$queryRaw`
        SELECT COUNT(*) as count, username 
        FROM "User" 
        WHERE username IS NOT NULL
        GROUP BY username 
        HAVING COUNT(*) > 1
      `;

      if (Array.isArray(usernameCheck) && usernameCheck.length > 0) {
        logger.warn('⚠️ Se encontraron usernames duplicados:', usernameCheck);
      } else {
        logger.info('   ✅ Constraint de username único: OK');
      }

      // Verificar constraint de apiKey único
      const apiKeyCheck = await prisma.$queryRaw`
        SELECT COUNT(*) as count, "apiKey" 
        FROM "User" 
        WHERE "apiKey" IS NOT NULL
        GROUP BY "apiKey" 
        HAVING COUNT(*) > 1
      `;

      if (Array.isArray(apiKeyCheck) && apiKeyCheck.length > 0) {
        logger.warn('⚠️ Se encontraron API keys duplicadas:', apiKeyCheck);
      } else {
        logger.info('   ✅ Constraint de API key único: OK');
      }
    } catch (error) {
      logger.error('❌ Error validando constraints:', error);
    }
  }

  printIndexReport(indexes: IndexInfo[], queryPerformance: QueryPerformance[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 REPORTE DE VALIDACIÓN DE ÍNDICES');
    console.log('='.repeat(80));

    console.log('\n🗃️ ÍNDICES ENCONTRADOS:');
    indexes.forEach((idx) => {
      console.log(`   📄 ${idx.indexName}`);
      console.log(`      🏷️  Tabla: ${idx.tableName}`);
      console.log(`      📊 Columnas: ${idx.columnNames.join(', ')}`);
      console.log(`      🔒 Único: ${idx.isUnique ? 'Sí' : 'No'}`);
      console.log('');
    });

    console.log('\n⚡ PERFORMANCE DE CONSULTAS:');
    queryPerformance.forEach((perf) => {
      const status = perf.usesIndex ? '✅' : '❌';
      console.log(`   ${status} ${perf.query}`);
      console.log(`      ⏱️  Tiempo: ${perf.executionTime.toFixed(2)}ms`);
      console.log(`      🗃️  Usa índice: ${perf.usesIndex ? 'Sí' : 'No'}`);
      if (perf.indexUsed) {
        console.log(`      📋 Índice usado: ${perf.indexUsed}`);
      }
      console.log('');
    });

    // Resumen
    const indexedQueries = queryPerformance.filter((q) => q.usesIndex).length;
    const totalQueries = queryPerformance.length;
    const indexUsageRate = (indexedQueries / totalQueries) * 100;

    console.log('\n📊 RESUMEN:');
    console.log(`   🗃️  Total índices: ${indexes.length}`);
    console.log(
      `   ⚡ Consultas optimizadas: ${indexedQueries}/${totalQueries} (${indexUsageRate.toFixed(1)}%)`
    );
    console.log(`   🎯 Objetivo: 100% de consultas con índices`);
    console.log('='.repeat(80));
  }

  async runValidation(): Promise<void> {
    try {
      logger.info('🔍 Iniciando validación de índices de base de datos...');

      // Obtener información de índices
      const indexes = await this.getIndexes();

      // Validar uso de índices en consultas
      const queryPerformance = await this.validateIndexUsage();

      // Validar constraints
      await this.validateConstraints();

      // Benchmark de consultas
      await this.benchmarkQueries();

      // Mostrar reporte
      this.printIndexReport(indexes, queryPerformance);

      logger.info('✅ Validación completada');
    } catch (error) {
      logger.error('❌ Error durante la validación:', error);
      throw error;
    }
  }
}

async function runValidation() {
  const validator = new DatabaseIndexValidator();

  try {
    await validator.runValidation();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Validación falló:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}
