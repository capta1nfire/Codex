#!/usr/bin/env node

import { performance } from 'perf_hooks';

// Configuración
const API_BASE_URL = 'http://localhost:3004';
const GENERATE_ENDPOINT = '/api/generate';
const ANALYTICS_ENDPOINT = '/analytics/performance';

// Configuración de pruebas graduales
const GRADUAL_TEST_STAGES = [
  { name: 'Warm-up', total: 10, concurrent: 2, delay: 200 },
  { name: 'Light', total: 25, concurrent: 5, delay: 150 },
  { name: 'Moderate', total: 50, concurrent: 10, delay: 100 },
  { name: 'Standard', total: 100, concurrent: 15, delay: 75 },
  { name: 'Heavy', total: 200, concurrent: 20, delay: 50 },
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

// Función para generar QR sin autenticación
async function generateQR(index) {
  const startTime = performance.now();
  
  const timestamp = Date.now();
  const randomData = Math.random().toString(36).substring(7);
  
  const requestData = {
    barcode_type: 'qrcode',
    data: `Gradual Test ${index} - ${timestamp} - ${randomData}`,
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
        'Content-Type': 'application/json'
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

// Función para obtener analytics del servicio Rust
async function getRustAnalytics() {
  try {
    const response = await fetch(`http://localhost:3002${ANALYTICS_ENDPOINT}`);
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
async function runTestStage(stage, stageIndex) {
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
      batch.push(generateQR(i + j));
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
    console.log(`${colors.bright}${colors.magenta}🚀 QReable Automated Gradual Load Testing${colors.reset}`);
    console.log('══════════════════════════════════════════\n');
    console.log(`${colors.cyan}Ejecutando pruebas sin autenticación${colors.reset}`);
    console.log(`${colors.yellow}Nota: Usando endpoint público /api/generate${colors.reset}\n`);
    
    // Obtener métricas iniciales del servicio Rust
    console.log(`${colors.cyan}📈 Obteniendo métricas iniciales...${colors.reset}`);
    const initialAnalytics = await getRustAnalytics();
    let initialRequests = 0;
    if (initialAnalytics) {
      initialRequests = initialAnalytics.overall?.total_requests || 0;
      console.log(`   Total requests anteriores: ${initialRequests}`);
      console.log(`   Cache hit rate: ${initialAnalytics.overall?.cache_hit_rate_percent?.toFixed(2) || 0}%`);
    }
    
    // Iniciar pruebas graduales
    console.log(`\n${colors.bright}${colors.cyan}🏃 Iniciando pruebas graduales${colors.reset}`);
    globalStats.startTime = performance.now();
    
    // Ejecutar cada etapa
    for (let i = 0; i < GRADUAL_TEST_STAGES.length; i++) {
      const stage = GRADUAL_TEST_STAGES[i];
      const stageStats = await runTestStage(stage, i);
      
      globalStats.stages.push(stageStats);
      globalStats.totalRequests += stage.total;
      globalStats.totalSuccessful += stageStats.successful;
      globalStats.totalFailed += stageStats.failed;
      
      // Pausa entre etapas (excepto después de la última)
      if (i < GRADUAL_TEST_STAGES.length - 1) {
        console.log(`\n${colors.yellow}⏳ Pausa de 3 segundos antes de la siguiente etapa...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    globalStats.endTime = performance.now();
    
    // Obtener métricas finales
    console.log(`\n\n${colors.cyan}📈 Obteniendo métricas finales...${colors.reset}`);
    const finalAnalytics = await getRustAnalytics();
    const totalProcessed = finalAnalytics ? (finalAnalytics.overall?.total_requests || 0) - initialRequests : 0;
    
    // Mostrar resumen completo
    console.log(`\n${colors.bright}${colors.green}📊 RESUMEN DE PRUEBAS GRADUALES${colors.reset}`);
    console.log('═══════════════════════════════════════════');
    
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
      const throughput = `${stage.metrics.throughput}`.padStart(10);
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
    
    // Sistema metrics
    if (finalAnalytics) {
      console.log(`\n${colors.cyan}Métricas del Motor QR (Rust):${colors.reset}`);
      console.log(`  • Requests procesados: ${totalProcessed}`);
      console.log(`  • Cache hit rate final: ${finalAnalytics.overall?.cache_hit_rate_percent?.toFixed(2)}%`);
      console.log(`  • Avg response time: ${finalAnalytics.overall?.avg_response_ms?.toFixed(2)}ms`);
      
      if (finalAnalytics.by_barcode_type?.qrcode) {
        const qr = finalAnalytics.by_barcode_type.qrcode;
        console.log(`  • QR avg cache hit: ${qr.avg_cache_hit_ms?.toFixed(2)}ms`);
        console.log(`  • QR avg generation: ${qr.avg_generation_ms?.toFixed(2)}ms`);
      }
    }
    
    // Recomendaciones
    console.log(`\n${colors.cyan}📝 Recomendaciones:${colors.reset}`);
    
    if (maxThroughput < 100) {
      console.log(`  ${colors.yellow}⚠️  Throughput máximo bajo - Considerar optimización${colors.reset}`);
    } else if (maxThroughput > 300) {
      console.log(`  ${colors.green}✅ Excelente capacidad de throughput${colors.reset}`);
    }
    
    const lastStageSuccess = globalStats.stages[globalStats.stages.length - 1].metrics.successRate;
    if (lastStageSuccess < 95) {
      console.log(`  ${colors.red}⚠️  Alta tasa de fallos en carga máxima${colors.reset}`);
    }
    
    const optimalStage = globalStats.stages.find(s => 
      s.metrics.throughput > maxThroughput * 0.8 && 
      s.metrics.p95 < 50 && 
      s.metrics.successRate === 100
    );
    
    if (optimalStage) {
      console.log(`  ${colors.green}💡 Carga óptima detectada: ${optimalStage.config.concurrent} requests concurrentes${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✅ Pruebas graduales completadas${colors.reset}`);
    
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
console.log(`${colors.yellow}⚠️  Nota: Esta versión ejecuta pruebas sin autenticación${colors.reset}`);
console.log(`${colors.yellow}   usando el endpoint público /api/generate${colors.reset}\n`);

setTimeout(() => {
  runGradualLoadTest().catch(console.error);
}, 1000);