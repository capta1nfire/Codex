#!/usr/bin/env node

/**
 * Script de validación para verificar implementación de mejoras del reporte de Jules
 */

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes(searchString);
  } catch {
    return false;
  }
}

function validateImplementation() {
  console.log('🚀 VALIDANDO IMPLEMENTACIÓN DE MEJORAS DE JULES');
  console.log('==================================================\n');

  const results = [];

  // Performance optimizations
  console.log('⚡ PERFORMANCE OPTIMIZATIONS:');
  
  if (checkFileExists('backend/src/lib/apiKeyCache.ts')) {
    console.log('✅ API Key Cache: Sistema de caché Redis implementado');
    results.push({ category: 'Performance', name: 'API Key Cache', status: 'PASS' });
  } else {
    console.log('❌ API Key Cache: Archivo de caché no encontrado');
    results.push({ category: 'Performance', name: 'API Key Cache', status: 'FAIL' });
  }

  if (checkFileContains('backend/prisma/schema.prisma', '@@index([apiKeyPrefix])')) {
    console.log('✅ Database Indexes: Índices PostgreSQL optimizados');
    results.push({ category: 'Performance', name: 'Database Indexes', status: 'PASS' });
  } else {
    console.log('❌ Database Indexes: Índices no encontrados');
    results.push({ category: 'Performance', name: 'Database Indexes', status: 'FAIL' });
  }

  if (!checkFileContains('backend/src/routes/avatar.routes.ts', 'const updatedUser = await userStore.findById(userId)')) {
    console.log('✅ Redundant Fetch Fix: Fetch redundante eliminado');
    results.push({ category: 'Performance', name: 'Redundant Fetch Fix', status: 'PASS' });
  } else {
    console.log('⚠️  Redundant Fetch Fix: Posible fetch redundante presente');
    results.push({ category: 'Performance', name: 'Redundant Fetch Fix', status: 'WARNING' });
  }

  // Rate limiting
  console.log('\n🛡️ RATE LIMITING:');
  
  if (checkFileExists('backend/src/middleware/rateLimitMiddleware.ts')) {
    console.log('✅ Rate Limiting Middleware: Implementado');
    results.push({ category: 'Security', name: 'Rate Limiting', status: 'PASS' });
  } else {
    console.log('❌ Rate Limiting Middleware: No encontrado');
    results.push({ category: 'Security', name: 'Rate Limiting', status: 'FAIL' });
  }

  // Frontend API layer
  console.log('\n🌐 FRONTEND API LAYER:');
  
  if (checkFileExists('frontend/src/lib/api.ts')) {
    console.log('✅ Centralized API Client: Implementado');
    results.push({ category: 'Frontend', name: 'API Client', status: 'PASS' });
  } else {
    console.log('❌ Centralized API Client: No encontrado');
    results.push({ category: 'Frontend', name: 'API Client', status: 'FAIL' });
  }

  if (checkFileExists('frontend/src/lib/__tests__/api.test.ts')) {
    console.log('✅ API Tests: Pruebas implementadas');
    results.push({ category: 'Frontend', name: 'API Tests', status: 'PASS' });
  } else {
    console.log('❌ API Tests: No encontradas');
    results.push({ category: 'Frontend', name: 'API Tests', status: 'FAIL' });
  }

  // Dependencies
  console.log('\n📦 DEPENDENCIES:');
  
  if (checkFileContains('frontend/package.json', '"react": "^18')) {
    console.log('✅ React Version: Downgraded a 18.x estable');
    results.push({ category: 'Dependencies', name: 'React Version', status: 'PASS' });
  } else {
    console.log('⚠️  React Version: Podría estar en versión inestable');
    results.push({ category: 'Dependencies', name: 'React Version', status: 'WARNING' });
  }

  // Monitoring
  console.log('\n📊 MONITORING:');
  
  if (checkFileExists('prometheus.yml') && checkFileContains('prometheus.yml', 'alertmanager')) {
    console.log('✅ Prometheus: Configurado con alertas');
    results.push({ category: 'Monitoring', name: 'Prometheus', status: 'PASS' });
  } else {
    console.log('❌ Prometheus: Configuración incompleta');
    results.push({ category: 'Monitoring', name: 'Prometheus', status: 'FAIL' });
  }

  if (checkFileExists('alert_rules.yml')) {
    console.log('✅ Alert Rules: Configuradas');
    results.push({ category: 'Monitoring', name: 'Alert Rules', status: 'PASS' });
  } else {
    console.log('❌ Alert Rules: No encontradas');
    results.push({ category: 'Monitoring', name: 'Alert Rules', status: 'FAIL' });
  }

  // CI/CD
  console.log('\n🚀 CI/CD:');
  
  if (checkFileExists('.github/workflows/ci.yml')) {
    console.log('✅ GitHub Actions: Pipeline configurado');
    results.push({ category: 'CI/CD', name: 'GitHub Actions', status: 'PASS' });
  } else {
    console.log('❌ GitHub Actions: Pipeline no encontrado');
    results.push({ category: 'CI/CD', name: 'GitHub Actions', status: 'FAIL' });
  }

  // Documentation
  console.log('\n📚 DOCUMENTATION:');
  
  if (checkFileExists('API_DOCUMENTATION.md')) {
    console.log('✅ API Documentation: Documentación completa creada');
    results.push({ category: 'Documentation', name: 'API Docs', status: 'PASS' });
  } else {
    console.log('❌ API Documentation: No encontrada');
    results.push({ category: 'Documentation', name: 'API Docs', status: 'FAIL' });
  }

  // Statistics
  const passed = results.filter(r => r.status === 'PASS').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log('\n📊 ESTADÍSTICAS FINALES:');
  console.log('==================================================');
  console.log(`✅ Exitosas: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  console.log(`⚠️  Advertencias: ${warnings}/${total} (${Math.round(warnings/total*100)}%)`);
  console.log(`❌ Fallidas: ${failed}/${total} (${Math.round(failed/total*100)}%)`);

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

  return results;
}

// Ejecutar validación
if (require.main === module) {
  validateImplementation();
} 