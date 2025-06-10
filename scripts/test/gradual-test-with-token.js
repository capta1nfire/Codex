#!/usr/bin/env node

import { performance } from 'perf_hooks';
import fs from 'fs/promises';

// Configuración
const API_BASE_URL = 'http://localhost:3004';
const GENERATE_ENDPOINT = '/api/generate';
const QR_ANALYTICS_ENDPOINT = '/api/qr/analytics';

// Configuración de pruebas graduales
const GRADUAL_TEST_STAGES = [
  { name: 'Warm-up', total: 10, concurrent: 2, delay: 200 },
  { name: 'Light', total: 25, concurrent: 5, delay: 150 },
  { name: 'Moderate', total: 50, concurrent: 10, delay: 100 },
  { name: 'Standard', total: 100, concurrent: 15, delay: 75 },
  { name: 'Heavy', total: 200, concurrent: 20, delay: 50 },
  { name: 'Stress', total: 500, concurrent: 30, delay: 25 },
  { name: 'Peak', total: 1000, concurrent: 50, delay: 10 }
];

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

// Estadísticas globales
let globalStats = {
  stages: [],
  totalRequests: 0,
  totalSuccessful: 0,
  totalFailed: 0,
  startTime: null,
  endTime: null,
};

// Cargar token desde archivo
async function loadToken() {
  try {
    const tokenData = await fs.readFile('/Users/inseqio/Codex Project/.test-token.json', 'utf8');
    const data = JSON.parse(tokenData);
    console.log(`${colors.green}✅ Token cargado${colors.reset}`);
    console.log(`👤 Usuario: ${data.user.email}`);
    console.log(`🛡️  Rol: ${data.user.role}`);
    console.log(`📅 Token generado: ${data.timestamp}\n`);
    return data.token;
  } catch (error) {
    console.error(`${colors.red}❌ Error cargando token:${colors.reset}`, error.message);
    console.log('Ejecuta primero: node scripts/direct-auth-test.js');
    process.exit(1);
  }
}

// Función para generar QR
async function generateQR(token, index) {
  const startTime = performance.now();
  
  const timestamp = Date.now();
  const randomData = Math.random().toString(36).substring(7);
  
  const requestData = {
    barcode_type: 'qrcode',
    data: `SUPERADMIN Test ${index} - ${timestamp} - ${randomData}`,
    options: {
      scale: 2 + (index % 3),
      fgcolor: ['#000000', '#FF0000', '#00FF00', '#0000FF'][index % 4],
      bgcolor: '#FFFFFF',
      ecl: ['L', 'M', 'Q', 'H'][index % 4],
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${API_BASE_URL}${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      await response.json();
      return { success: true, time: responseTime };
    } else {
      return { success: false, status: response.status, time: responseTime };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Función para obtener analytics
async function getQRAnalytics(token) {
  try {
    const response = await fetch(`${API_BASE_URL}${QR_ANALYTICS_ENDPOINT}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error obteniendo analytics:', error);
  }
  return null;
}

// Mostrar barra de progreso
function showProgress(current, total, stageName) {
  const percentage = (current / total) * 100;
  const filled = Math.floor(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.write(`\r${colors.cyan}[${stageName}] [${bar}] ${percentage.toFixed(1)}%${colors.reset}`);
}

// Ejecutar una etapa de prueba
async function runTestStage(stage, token, stageIndex) {
  console.log(`\n${colors.bright}${colors.blue}📊 Etapa ${stageIndex + 1}/${GRADUAL_TEST_STAGES.length}: ${stage.name}${colors.reset}`);
  console.log(`   Requests: ${stage.total} | Concurrentes: ${stage.concurrent} | Delay: ${stage.delay}ms`);
  
  const stageStats = {
    name: stage.name,
    config: stage,
    successful: 0,
    failed: 0,
    responseTimes: [],
    startTime: performance.now(),
    endTime: null,
  };
  
  let completed = 0;
  
  // Ejecutar requests en lotes
  for (let i = 0; i < stage.total; i += stage.concurrent) {
    const batch = [];
    const batchSize = Math.min(stage.concurrent, stage.total - i);
    
    for (let j = 0; j < batchSize; j++) {
      batch.push(generateQR(token, i + j));
    }
    
    const results = await Promise.all(batch);
    
    results.forEach(result => {
      if (result.success) {
        stageStats.successful++;
        stageStats.responseTimes.push(result.time);
      } else {
        stageStats.failed++;
      }
    });
    
    completed += batchSize;
    showProgress(completed, stage.total, stage.name);
    
    if (i + stage.concurrent < stage.total) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
    }
  }
  
  stageStats.endTime = performance.now();
  
  // Calcular estadísticas de la etapa
  const totalTime = stageStats.endTime - stageStats.startTime;
  const avgResponseTime = stageStats.responseTimes.length > 0 
    ? stageStats.responseTimes.reduce((a, b) => a + b, 0) / stageStats.responseTimes.length 
    : 0;
  const throughput = (stageStats.successful / (totalTime / 1000)).toFixed(2);
  
  // Ordenar para percentiles
  stageStats.responseTimes.sort((a, b) => a - b);
  const p50 = stageStats.responseTimes[Math.floor(stageStats.responseTimes.length * 0.5)] || 0;
  const p95 = stageStats.responseTimes[Math.floor(stageStats.responseTimes.length * 0.95)] || 0;
  
  console.log(`\n   ${colors.green}✓ Completado${colors.reset} - Throughput: ${throughput} req/s | Avg: ${avgResponseTime.toFixed(2)}ms | P95: ${p95.toFixed(2)}ms`);
  
  // Guardar estadísticas
  stageStats.metrics = {
    avgResponseTime,
    throughput: parseFloat(throughput),
    p50,
    p95,
    successRate: (stageStats.successful / stage.total) * 100
  };
  
  return stageStats;
}

// Función principal
async function runGradualLoadTest() {
  try {
    console.clear();
    console.log(`${colors.bright}${colors.magenta}🚀 CODEX Gradual Load Testing (SUPERADMIN Mode)${colors.reset}`);
    console.log('═══════════════════════════════════════════════════\n');
    
    // Cargar token
    const token = await loadToken();
    
    console.log(`${colors.green}🌟 Modo SUPERADMIN activado - Sin límites de rate${colors.reset}\n`);
    
    // Obtener métricas iniciales
    console.log(`${colors.cyan}📈 Obteniendo métricas iniciales...${colors.reset}`);
    const initialAnalytics = await getQRAnalytics(token);
    const initialRequests = initialAnalytics?.overall?.total_requests || 0;
    if (initialAnalytics) {
      console.log(`   Total requests anteriores: ${initialRequests}`);
      console.log(`   Cache hit rate actual: ${initialAnalytics.overall?.cache_hit_rate_percent?.toFixed(2) || 0}%`);
    }
    
    // Iniciar pruebas graduales
    console.log(`\n${colors.bright}${colors.cyan}🏃 Iniciando pruebas graduales${colors.reset}`);
    globalStats.startTime = performance.now();
    
    // Ejecutar cada etapa
    for (let i = 0; i < GRADUAL_TEST_STAGES.length; i++) {
      const stage = GRADUAL_TEST_STAGES[i];
      const stageStats = await runTestStage(stage, token, i);
      
      globalStats.stages.push(stageStats);
      globalStats.totalRequests += stage.total;
      globalStats.totalSuccessful += stageStats.successful;
      globalStats.totalFailed += stageStats.failed;
      
      // Pausa entre etapas (excepto después de la última)
      if (i < GRADUAL_TEST_STAGES.length - 1) {
        console.log(`\n${colors.yellow}⏳ Pausa de 5 segundos antes de la siguiente etapa...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    globalStats.endTime = performance.now();
    
    // Obtener métricas finales
    console.log(`\n\n${colors.cyan}📈 Obteniendo métricas finales...${colors.reset}`);
    const finalAnalytics = await getQRAnalytics(token);
    const totalProcessed = (finalAnalytics?.overall?.total_requests || 0) - initialRequests;
    
    // Mostrar resumen completo
    console.log(`\n${colors.bright}${colors.green}📊 RESUMEN DE PRUEBAS GRADUALES (SUPERADMIN)${colors.reset}`);
    console.log('═══════════════════════════════════════════════════');
    
    console.log(`\n${colors.cyan}Resumen Global:${colors.reset}`);
    console.log(`  • Total de etapas: ${globalStats.stages.length}`);
    console.log(`  • Total de requests: ${globalStats.totalRequests}`);
    console.log(`  • Exitosos: ${colors.green}${globalStats.totalSuccessful}${colors.reset}`);
    console.log(`  • Fallidos: ${colors.red}${globalStats.totalFailed}${colors.reset}`);
    console.log(`  • Tiempo total: ${((globalStats.endTime - globalStats.startTime) / 1000).toFixed(2)}s`);
    console.log(`  • Tasa de éxito global: ${((globalStats.totalSuccessful / globalStats.totalRequests) * 100).toFixed(2)}%`);
    
    console.log(`\n${colors.cyan}Resultados por Etapa:${colors.reset}`);
    console.log('┌─────────────┬──────────┬────────────┬──────────┬──────────┬──────────┬─────────┐');
    console.log('│ Etapa       │ Requests │ Throughput │ Avg (ms) │ P50 (ms) │ P95 (ms) │ Success │');
    console.log('├─────────────┼──────────┼────────────┼──────────┼──────────┼──────────┼─────────┤');
    
    globalStats.stages.forEach(stage => {
      const name = stage.name.padEnd(11);
      const requests = stage.config.total.toString().padStart(8);
      const throughput = `${stage.metrics.throughput} req/s`.padStart(10);
      const avg = stage.metrics.avgResponseTime.toFixed(1).padStart(8);
      const p50 = stage.metrics.p50.toFixed(1).padStart(8);
      const p95 = stage.metrics.p95.toFixed(1).padStart(8);
      const success = `${stage.metrics.successRate.toFixed(0)}%`.padStart(7);
      
      console.log(`│ ${name} │ ${requests} │ ${throughput} │ ${avg} │ ${p50} │ ${p95} │ ${success} │`);
    });
    
    console.log('└─────────────┴──────────┴────────────┴──────────┴──────────┴──────────┴─────────┘');
    
    // Análisis de tendencias
    console.log(`\n${colors.cyan}📈 Análisis de Tendencias:${colors.reset}`);
    
    // Throughput trend
    const throughputs = globalStats.stages.map(s => s.metrics.throughput);
    const maxThroughput = Math.max(...throughputs);
    const maxThroughputStage = globalStats.stages.find(s => s.metrics.throughput === maxThroughput);
    console.log(`  • Máximo throughput: ${maxThroughput} req/s (${maxThroughputStage.name})`);
    
    // Response time trend
    const p95s = globalStats.stages.map(s => s.metrics.p95);
    const degradationPoint = globalStats.stages.findIndex((s, i) => i > 0 && s.metrics.p95 > p95s[i-1] * 1.5);
    if (degradationPoint > -1) {
      console.log(`  • ${colors.yellow}Degradación detectada en etapa: ${globalStats.stages[degradationPoint].name}${colors.reset}`);
    }
    
    // Sistema QR v2 metrics
    if (finalAnalytics) {
      console.log(`\n${colors.cyan}Métricas del Motor QR v2:${colors.reset}`);
      console.log(`  • Requests procesados: ${totalProcessed}`);
      console.log(`  • Cache hit rate final: ${finalAnalytics.overall?.cache_hit_rate_percent?.toFixed(2)}%`);
      console.log(`  • Avg response time: ${finalAnalytics.overall?.avg_response_ms?.toFixed(2)}ms`);
    }
    
    // Recomendaciones
    console.log(`\n${colors.cyan}📝 Recomendaciones:${colors.reset}`);
    
    if (maxThroughput < 100) {
      console.log(`  ${colors.yellow}⚠️  Throughput máximo bajo - Considerar optimización${colors.reset}`);
    } else if (maxThroughput > 500) {
      console.log(`  ${colors.green}✅ Excelente capacidad de throughput${colors.reset}`);
    }
    
    const lastStageSuccess = globalStats.stages[globalStats.stages.length - 1].metrics.successRate;
    if (lastStageSuccess < 95) {
      console.log(`  ${colors.red}⚠️  Alta tasa de fallos en carga máxima${colors.reset}`);
    }
    
    const optimalStage = globalStats.stages.find(s => 
      s.metrics.throughput > maxThroughput * 0.8 && 
      s.metrics.p95 < 100 && 
      s.metrics.successRate === 100
    );
    
    if (optimalStage) {
      console.log(`  ${colors.green}💡 Carga óptima: ${optimalStage.config.concurrent} requests concurrentes${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✅ Pruebas graduales completadas exitosamente${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error durante las pruebas:${colors.reset}`, error.message);
  }
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}⚠️  Pruebas interrumpidas por el usuario${colors.reset}`);
  if (globalStats.stages.length > 0) {
    console.log(`\n${colors.cyan}Etapas completadas: ${globalStats.stages.length}${colors.reset}`);
    console.log(`Total requests procesados: ${globalStats.totalSuccessful}`);
  }
  process.exit(0);
});

// Ejecutar
runGradualLoadTest().catch(console.error);