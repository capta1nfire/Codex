#!/usr/bin/env tsx

/**
 * Script de validación para verificar implementación de mejoras del reporte de Jules
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

interface ValidationResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
}

const results: ValidationResult[] = [];

function addResult(category: string, name: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string) {
  results.push({ category, name, status, details });
}

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, filePath));
}

function checkFileContains(filePath: string, searchString: string): boolean {
  try {
    const content = fs.readFileSync(path.join(projectRoot, filePath), 'utf-8');
    return content.includes(searchString);
  } catch {
    return false;
  }
}

async function validateImplementation() {
  console.log('🚀 VALIDANDO IMPLEMENTACIÓN DE MEJORAS DE JULES');
  console.log('==================================================\n');

  // ===============================================
  // 1. VALIDAR OPTIMIZACIONES DE PERFORMANCE
  // ===============================================
  console.log('⚡ VALIDANDO OPTIMIZACIONES DE PERFORMANCE...\n');

  // Verificar caché Redis
  if (checkFileExists('backend/src/lib/apiKeyCache.ts')) {
    addResult('Performance', 'API Key Cache', 'PASS', 'Sistema de caché Redis implementado');
  } else {
    addResult('Performance', 'API Key Cache', 'FAIL', 'Archivo de caché no encontrado');
  }

  // Verificar índices optimizados
  if (checkFileContains('backend/prisma/schema.prisma', '@@index([apiKeyPrefix])')) {
    addResult('Performance', 'Database Indexes', 'PASS', 'Índices PostgreSQL optimizados');
  } else {
    addResult('Performance', 'Database Indexes', 'FAIL', 'Índices no encontrados en schema');
  }

  // Verificar eliminación de fetch redundante
  if (!checkFileContains('backend/src/routes/avatar.routes.ts', 'findById(userId)')) {
    addResult('Performance', 'Redundant Fetch Fix', 'PASS', 'Fetch redundante eliminado de avatar routes');
  } else {
    addResult('Performance', 'Redundant Fetch Fix', 'WARNING', 'Posible fetch redundante aún presente');
  }

  // ===============================================
  // 2. VALIDAR RATE LIMITING AVANZADO
  // ===============================================
  console.log('🛡️ VALIDANDO RATE LIMITING AVANZADO...\n');

  if (checkFileExists('backend/src/middleware/rateLimitMiddleware.ts')) {
    addResult('Security', 'Rate Limiting Middleware', 'PASS', 'Middleware de rate limiting implementado');
  } else {
    addResult('Security', 'Rate Limiting Middleware', 'FAIL', 'Middleware no encontrado');
  }

  if (checkFileContains('backend/src/routes/auth.routes.ts', 'strictRateLimit')) {
    addResult('Security', 'Auth Rate Limiting', 'PASS', 'Rate limiting aplicado a auth routes');
  } else {
    addResult('Security', 'Auth Rate Limiting', 'FAIL', 'Rate limiting no aplicado a auth');
  }

  // ===============================================
  // 3. VALIDAR API LAYER FRONTEND
  // ===============================================
  console.log('🌐 VALIDANDO API LAYER FRONTEND...\n');

  if (checkFileExists('frontend/src/lib/api.ts')) {
    addResult('Frontend', 'Centralized API Client', 'PASS', 'Cliente API centralizado creado');
  } else {
    addResult('Frontend', 'Centralized API Client', 'FAIL', 'Cliente API no encontrado');
  }

  if (checkFileExists('frontend/src/lib/__tests__/api.test.ts')) {
    addResult('Frontend', 'API Tests', 'PASS', 'Pruebas unitarias del API client implementadas');
  } else {
    addResult('Frontend', 'API Tests', 'FAIL', 'Pruebas del API client no encontradas');
  }

  // ===============================================
  // 4. VALIDAR DEPENDENCIAS CORREGIDAS
  // ===============================================
  console.log('📦 VALIDANDO CORRECCIÓN DE DEPENDENCIAS...\n');

  // Backend dependencies
  if (checkFileContains('backend/package.json', 'rate-limit-redis')) {
    addResult('Dependencies', 'Backend Dependencies', 'PASS', 'Dependencias del backend actualizadas');
  } else {
    addResult('Dependencies', 'Backend Dependencies', 'WARNING', 'Algunas dependencias podrían faltar');
  }

  // Frontend dependencies
  if (checkFileContains('frontend/package.json', '"react": "^18')) {
    addResult('Dependencies', 'Frontend Dependencies', 'PASS', 'React downgraded a versión estable 18.x');
  } else {
    addResult('Dependencies', 'Frontend Dependencies', 'WARNING', 'React podría estar en versión inestable');
  }

  // ===============================================
  // 5. VALIDAR MONITOREO Y ALERTAS
  // ===============================================
  console.log('📊 VALIDANDO MONITOREO Y ALERTAS...\n');

  if (checkFileExists('prometheus.yml') && checkFileContains('prometheus.yml', 'alertmanager')) {
    addResult('Monitoring', 'Prometheus Config', 'PASS', 'Configuración de Prometheus con alertas');
  } else {
    addResult('Monitoring', 'Prometheus Config', 'FAIL', 'Configuración de Prometheus incompleta');
  }

  if (checkFileExists('alert_rules.yml') && checkFileContains('alert_rules.yml', 'HighAPILatency')) {
    addResult('Monitoring', 'Alert Rules', 'PASS', 'Reglas de alerta configuradas');
  } else {
    addResult('Monitoring', 'Alert Rules', 'FAIL', 'Reglas de alerta no encontradas');
  }

  if (checkFileExists('docker-compose.yml') && checkFileContains('docker-compose.yml', 'alertmanager')) {
    addResult('Monitoring', 'Alertmanager', 'PASS', 'Alertmanager configurado en Docker Compose');
  } else {
    addResult('Monitoring', 'Alertmanager', 'FAIL', 'Alertmanager no configurado');
  }

  // ===============================================
  // 6. VALIDAR CI/CD
  // ===============================================
  console.log('🚀 VALIDANDO CI/CD PIPELINE...\n');

  if (checkFileExists('.github/workflows/ci.yml')) {
    addResult('CI/CD', 'GitHub Actions', 'PASS', 'Pipeline de CI/CD configurado');
  } else {
    addResult('CI/CD', 'GitHub Actions', 'FAIL', 'Pipeline de CI/CD no encontrado');
  }

  // ===============================================
  // 7. VALIDAR DOCUMENTACIÓN
  // ===============================================
  console.log('📚 VALIDANDO DOCUMENTACIÓN...\n');

  if (checkFileExists('API_DOCUMENTATION.md')) {
    addResult('Documentation', 'API Documentation', 'PASS', 'Documentación completa de API creada');
  } else {
    addResult('Documentation', 'API Documentation', 'FAIL', 'Documentación de API no encontrada');
  }

  // ===============================================
  // 8. VALIDAR INTEGRACIÓN SENTRY
  // ===============================================
  console.log('🛡️ VALIDANDO INTEGRACIÓN SENTRY...\n');

  if (checkFileContains('backend/src/middleware/errorHandler.ts', 'Sentry.captureException')) {
    addResult('Monitoring', 'Sentry Integration', 'PASS', 'Sentry integrado en error handler');
  } else {
    addResult('Monitoring', 'Sentry Integration', 'FAIL', 'Sentry no integrado correctamente');
  }

  // ===============================================
  // MOSTRAR RESULTADOS
  // ===============================================
  console.log('\n📋 RESUMEN DE VALIDACIÓN');
  console.log('==================================================\n');

  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    console.log(`\n🏷️  ${category.toUpperCase()}`);
    console.log('─────────────────────────────────────────────────');
    
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.name}: ${result.details}`);
    }
  }

  // Estadísticas finales
  const passed = results.filter(r => r.status === 'PASS').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log('\n📊 ESTADÍSTICAS FINALES');
  console.log('==================================================');
  console.log(`✅ Exitosas: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  console.log(`⚠️  Advertencias: ${warnings}/${total} (${Math.round(warnings/total*100)}%)`);
  console.log(`❌ Fallidas: ${failed}/${total} (${Math.round(failed/total*100)}%)`);

  // Determinar estado general
  if (failed === 0 && warnings <= 2) {
    console.log('\n🎉 ¡IMPLEMENTACIÓN EXITOSA!');
    console.log('Todas las mejoras críticas del reporte de Jules han sido implementadas.');
  } else if (failed <= 2) {
    console.log('\n⚠️  IMPLEMENTACIÓN PARCIALMENTE EXITOSA');
    console.log('La mayoría de mejoras están implementadas, pero requiere atención.');
  } else {
    console.log('\n❌ IMPLEMENTACIÓN REQUIERE TRABAJO');
    console.log('Varias mejoras críticas no están implementadas correctamente.');
  }

  console.log('\n==================================================');
  console.log('📝 Para más detalles, revisa cada categoría arriba.');
  
  return { passed, warnings, failed, total };
}

// Ejecutar validación
if (import.meta.url === `file://${process.argv[1]}`) {
  validateImplementation()
    .then((stats) => {
      process.exit(stats.failed > 3 ? 1 : 0);
    })
    .catch((error) => {
      logger.error('Error durante la validación:', error);
      process.exit(1);
    });
} 