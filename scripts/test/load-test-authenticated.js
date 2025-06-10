#!/usr/bin/env node

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuración
const API_BASE_URL = 'http://localhost:3004';
const LOGIN_ENDPOINT = '/api/auth/login';
const GENERATE_ENDPOINT = '/api/generate';
const QR_ANALYTICS_ENDPOINT = '/api/qr/analytics';

// Credenciales (deberías cambiar estas)
const credentials = {
  email: 'admin@example.com', // Cambiar por tu email
  password: 'admin123' // Cambiar por tu password
};

// Configuración de pruebas
const TOTAL_REQUESTS = 100;
const CONCURRENT_REQUESTS = 10;
const DELAY_BETWEEN_BATCHES = 100; // ms

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Estadísticas
let stats = {
  successful: 0,
  failed: 0,
  totalTime: 0,
  responseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
};

// Función para hacer login y obtener token
async function getAuthToken() {
  console.log(`${colors.cyan}🔐 Autenticando...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.token) {
      console.log(`${colors.green}✅ Autenticación exitosa${colors.reset}`);
      return data.token;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error de autenticación:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Función para generar QR con autenticación
async function generateQRAuthenticated(token, index) {
  const startTime = performance.now();
  
  const requestData = {
    barcode_type: 'qrcode',
    data: `Load Test QR ${index} - ${Date.now()}`,
    options: {
      scale: 2 + (index % 3), // Variar scale entre 2-4
      fgcolor: index % 2 === 0 ? '#000000' : '#0000FF',
      bgcolor: '#FFFFFF',
      ecl: ['L', 'M', 'Q', 'H'][index % 4], // Variar error correction
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      stats.successful++;
      stats.totalTime += responseTime;
      stats.responseTimes.push(responseTime);
      
      // Detectar si fue cache hit (respuestas muy rápidas)
      if (responseTime < 10) {
        stats.cacheHits++;
      } else {
        stats.cacheMisses++;
      }
      
      return { success: true, time: responseTime };
    } else {
      stats.failed++;
      const error = await response.text();
      return { success: false, error, status: response.status };
    }
  } catch (error) {
    stats.failed++;
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

// Función principal de pruebas
async function runLoadTest() {
  console.log(`${colors.bright}${colors.cyan}🚀 Iniciando pruebas de carga autenticadas${colors.reset}`);
  console.log(`📊 Total de solicitudes: ${TOTAL_REQUESTS}`);
  console.log(`🔄 Solicitudes concurrentes: ${CONCURRENT_REQUESTS}\n`);

  // Obtener token
  const token = await getAuthToken();
  
  // Obtener analytics iniciales
  const initialAnalytics = await getQRAnalytics(token);
  if (initialAnalytics) {
    console.log(`${colors.cyan}📈 Métricas iniciales:${colors.reset}`);
    console.log(`   Total requests: ${initialAnalytics.overall?.total_requests || 0}`);
    console.log(`   Cache hit rate: ${initialAnalytics.overall?.cache_hit_rate_percent?.toFixed(2) || 0}%\n`);
  }

  const startTime = performance.now();
  
  // Ejecutar pruebas en lotes
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = [];
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i);
    
    console.log(`${colors.yellow}📦 Lote ${Math.floor(i/CONCURRENT_REQUESTS) + 1}/${Math.ceil(TOTAL_REQUESTS/CONCURRENT_REQUESTS)}${colors.reset}`);
    
    // Crear solicitudes concurrentes
    for (let j = 0; j < batchSize; j++) {
      batch.push(generateQRAuthenticated(token, i + j));
    }
    
    // Ejecutar lote
    const results = await Promise.all(batch);
    
    // Mostrar progreso
    const successCount = results.filter(r => r.success).length;
    console.log(`   ✅ Exitosas: ${successCount}/${batchSize}`);
    
    // Pequeña pausa entre lotes
    if (i + CONCURRENT_REQUESTS < TOTAL_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  const totalTime = performance.now() - startTime;
  
  // Calcular estadísticas
  const avgResponseTime = stats.totalTime / stats.successful;
  const throughput = (stats.successful / (totalTime / 1000)).toFixed(2);
  const successRate = ((stats.successful / TOTAL_REQUESTS) * 100).toFixed(2);
  
  // Ordenar tiempos de respuesta para percentiles
  stats.responseTimes.sort((a, b) => a - b);
  const p50 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.5)];
  const p95 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.95)];
  const p99 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.99)];
  
  // Obtener analytics finales
  const finalAnalytics = await getQRAnalytics(token);
  
  // Mostrar resultados
  console.log(`\n${colors.bright}${colors.green}📊 RESULTADOS DE LA PRUEBA${colors.reset}`);
  console.log('═══════════════════════════════════════');
  console.log(`${colors.cyan}Resumen General:${colors.reset}`);
  console.log(`  • Total de solicitudes: ${TOTAL_REQUESTS}`);
  console.log(`  • Exitosas: ${colors.green}${stats.successful}${colors.reset}`);
  console.log(`  • Fallidas: ${colors.red}${stats.failed}${colors.reset}`);
  console.log(`  • Tasa de éxito: ${successRate}%`);
  console.log(`  • Tiempo total: ${(totalTime/1000).toFixed(2)}s`);
  console.log(`  • Throughput: ${throughput} req/s`);
  
  console.log(`\n${colors.cyan}Tiempos de Respuesta:${colors.reset}`);
  console.log(`  • Promedio: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  • P50 (mediana): ${p50?.toFixed(2)}ms`);
  console.log(`  • P95: ${p95?.toFixed(2)}ms`);
  console.log(`  • P99: ${p99?.toFixed(2)}ms`);
  console.log(`  • Mínimo: ${Math.min(...stats.responseTimes).toFixed(2)}ms`);
  console.log(`  • Máximo: ${Math.max(...stats.responseTimes).toFixed(2)}ms`);
  
  console.log(`\n${colors.cyan}Cache Performance:${colors.reset}`);
  console.log(`  • Cache Hits (estimados): ${stats.cacheHits}`);
  console.log(`  • Cache Misses (estimados): ${stats.cacheMisses}`);
  console.log(`  • Hit Rate (estimado): ${((stats.cacheHits / stats.successful) * 100).toFixed(2)}%`);
  
  if (finalAnalytics) {
    console.log(`\n${colors.cyan}Métricas del Motor QR v2:${colors.reset}`);
    console.log(`  • Total requests (sistema): ${finalAnalytics.overall?.total_requests || 0}`);
    console.log(`  • Cache hit rate (sistema): ${finalAnalytics.overall?.cache_hit_rate_percent?.toFixed(2) || 0}%`);
    console.log(`  • Avg response (sistema): ${finalAnalytics.overall?.avg_response_ms?.toFixed(2) || 0}ms`);
    
    if (finalAnalytics.by_barcode_type?.qrcode) {
      const qrStats = finalAnalytics.by_barcode_type.qrcode;
      console.log(`\n${colors.cyan}Estadísticas QR Code:${colors.reset}`);
      console.log(`  • Avg cache hit: ${qrStats.avg_cache_hit_ms?.toFixed(2)}ms`);
      console.log(`  • Avg generation: ${qrStats.avg_generation_ms?.toFixed(2)}ms`);
      console.log(`  • Total hits: ${qrStats.hit_count}`);
      console.log(`  • Total misses: ${qrStats.miss_count}`);
    }
  }
  
  // Advertencias
  if (stats.failed > 0) {
    console.log(`\n${colors.yellow}⚠️  Advertencia: ${stats.failed} solicitudes fallaron${colors.reset}`);
  }
  
  if (p95 > 100) {
    console.log(`${colors.yellow}⚠️  Advertencia: P95 > 100ms, considerar optimización${colors.reset}`);
  }
  
  console.log(`\n${colors.green}✅ Prueba completada${colors.reset}`);
}

// Ejecutar pruebas
runLoadTest().catch(console.error);