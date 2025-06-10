#!/usr/bin/env node

import { performance } from 'perf_hooks';
import readline from 'readline';
import { promisify } from 'util';

// Configuración
const API_BASE_URL = 'http://localhost:3004';
const LOGIN_ENDPOINT = '/api/auth/login';
const GENERATE_ENDPOINT = '/api/generate';
const QR_ANALYTICS_ENDPOINT = '/api/qr/analytics';

// Configuración de pruebas
const LOAD_TEST_CONFIGS = {
  light: { total: 50, concurrent: 5, delay: 100 },
  medium: { total: 100, concurrent: 10, delay: 100 },
  heavy: { total: 500, concurrent: 20, delay: 50 },
  stress: { total: 1000, concurrent: 50, delay: 10 }
};

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Crear interfaz readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

// Estadísticas
let stats = {
  successful: 0,
  failed: 0,
  totalTime: 0,
  responseTimes: [],
  errorCodes: {},
  startTime: null,
  endTime: null,
};

// Función para solicitar credenciales
async function getCredentials() {
  console.log(`${colors.cyan}🔐 Por favor ingresa tus credenciales${colors.reset}\n`);
  
  const email = await question('Email: ');
  
  // Ocultar el password
  process.stdout.write('Password: ');
  const password = await new Promise((resolve) => {
    let password = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u007F' || char === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
  
  return { email, password };
}

// Función para seleccionar tipo de prueba
async function selectTestType() {
  console.log(`\n${colors.cyan}📊 Selecciona el tipo de prueba:${colors.reset}`);
  console.log('1. Light (50 requests, 5 concurrent)');
  console.log('2. Medium (100 requests, 10 concurrent)');
  console.log('3. Heavy (500 requests, 20 concurrent)');
  console.log('4. Stress (1000 requests, 50 concurrent)');
  console.log('5. Custom');
  
  const choice = await question('\nSelección (1-5): ');
  
  switch(choice) {
    case '1': return LOAD_TEST_CONFIGS.light;
    case '2': return LOAD_TEST_CONFIGS.medium;
    case '3': return LOAD_TEST_CONFIGS.heavy;
    case '4': return LOAD_TEST_CONFIGS.stress;
    case '5':
      const total = parseInt(await question('Total de requests: '));
      const concurrent = parseInt(await question('Requests concurrentes: '));
      const delay = parseInt(await question('Delay entre lotes (ms): '));
      return { total, concurrent, delay };
    default:
      console.log('Selección inválida, usando configuración medium');
      return LOAD_TEST_CONFIGS.medium;
  }
}

// Función para hacer login y obtener token
async function getAuthToken(credentials) {
  console.log(`\n${colors.cyan}🔐 Autenticando...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Login failed: ${response.status}`);
    }

    if (data.token) {
      console.log(`${colors.green}✅ Autenticación exitosa${colors.reset}`);
      console.log(`👤 Usuario: ${data.user?.email || credentials.email}`);
      console.log(`🛡️  Rol: ${data.user?.role || 'USER'}`);
      return { token: data.token, user: data.user };
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error de autenticación:${colors.reset}`, error.message);
    throw error;
  }
}

// Función para generar QR con autenticación
async function generateQRAuthenticated(token, index, testConfig) {
  const startTime = performance.now();
  
  // Variar los datos para evitar demasiados cache hits
  const timestamp = Date.now();
  const randomData = Math.random().toString(36).substring(7);
  
  const requestData = {
    barcode_type: 'qrcode',
    data: `Load Test QR ${index} - ${timestamp} - ${randomData}`,
    options: {
      scale: 2 + (index % 3), // Variar scale entre 2-4
      fgcolor: ['#000000', '#FF0000', '#00FF00', '#0000FF'][index % 4],
      bgcolor: '#FFFFFF',
      ecl: ['L', 'M', 'Q', 'H'][index % 4], // Variar error correction
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
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
      const data = await response.json();
      stats.successful++;
      stats.totalTime += responseTime;
      stats.responseTimes.push(responseTime);
      
      return { success: true, time: responseTime, cached: responseTime < 5 };
    } else {
      stats.failed++;
      const errorCode = response.status.toString();
      stats.errorCodes[errorCode] = (stats.errorCodes[errorCode] || 0) + 1;
      
      const error = await response.text();
      return { success: false, error, status: response.status };
    }
  } catch (error) {
    stats.failed++;
    if (error.name === 'AbortError') {
      stats.errorCodes['timeout'] = (stats.errorCodes['timeout'] || 0) + 1;
    } else {
      stats.errorCodes['network'] = (stats.errorCodes['network'] || 0) + 1;
    }
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
function showProgress(current, total) {
  const percentage = (current / total) * 100;
  const filled = Math.floor(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.write(`\r${colors.cyan}Progreso: [${bar}] ${percentage.toFixed(1)}%${colors.reset}`);
}

// Función principal de pruebas
async function runLoadTest() {
  try {
    console.log(`${colors.bright}${colors.magenta}🚀 CODEX Load Testing Tool v1.0${colors.reset}`);
    console.log('════════════════════════════════════════\n');

    // Obtener credenciales
    const credentials = await getCredentials();
    
    // Seleccionar tipo de prueba
    const testConfig = await selectTestType();
    
    // Autenticar
    const { token, user } = await getAuthToken(credentials);
    
    // Verificar si es SUPERADMIN
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    if (isSuperAdmin) {
      console.log(`${colors.green}🌟 Detectado rol SUPERADMIN - Sin límites de rate${colors.reset}`);
    }
    
    // Obtener analytics iniciales
    console.log(`\n${colors.cyan}📈 Obteniendo métricas iniciales...${colors.reset}`);
    const initialAnalytics = await getQRAnalytics(token);
    if (initialAnalytics) {
      console.log(`   Total requests anteriores: ${initialAnalytics.overall?.total_requests || 0}`);
      console.log(`   Cache hit rate actual: ${initialAnalytics.overall?.cache_hit_rate_percent?.toFixed(2) || 0}%`);
    }

    console.log(`\n${colors.bright}${colors.cyan}🏃 Iniciando prueba de carga${colors.reset}`);
    console.log(`📊 Total de solicitudes: ${testConfig.total}`);
    console.log(`🔄 Solicitudes concurrentes: ${testConfig.concurrent}`);
    console.log(`⏱️  Delay entre lotes: ${testConfig.delay}ms\n`);

    stats.startTime = performance.now();
    let completed = 0;
    
    // Ejecutar pruebas en lotes
    for (let i = 0; i < testConfig.total; i += testConfig.concurrent) {
      const batch = [];
      const batchSize = Math.min(testConfig.concurrent, testConfig.total - i);
      
      // Crear solicitudes concurrentes
      for (let j = 0; j < batchSize; j++) {
        batch.push(generateQRAuthenticated(token, i + j, testConfig));
      }
      
      // Ejecutar lote
      const results = await Promise.all(batch);
      completed += batchSize;
      
      // Mostrar progreso
      showProgress(completed, testConfig.total);
      
      // Pequeña pausa entre lotes
      if (i + testConfig.concurrent < testConfig.total) {
        await new Promise(resolve => setTimeout(resolve, testConfig.delay));
      }
    }
    
    stats.endTime = performance.now();
    const totalTime = stats.endTime - stats.startTime;
    
    console.log('\n'); // Nueva línea después de la barra de progreso
    
    // Calcular estadísticas
    const avgResponseTime = stats.totalTime / stats.successful;
    const throughput = (stats.successful / (totalTime / 1000)).toFixed(2);
    const successRate = ((stats.successful / testConfig.total) * 100).toFixed(2);
    
    // Ordenar tiempos de respuesta para percentiles
    stats.responseTimes.sort((a, b) => a - b);
    const p50 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.5)];
    const p95 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.95)];
    const p99 = stats.responseTimes[Math.floor(stats.responseTimes.length * 0.99)];
    
    // Obtener analytics finales
    console.log(`${colors.cyan}📈 Obteniendo métricas finales...${colors.reset}`);
    const finalAnalytics = await getQRAnalytics(token);
    
    // Mostrar resultados
    console.log(`\n${colors.bright}${colors.green}📊 RESULTADOS DE LA PRUEBA${colors.reset}`);
    console.log('═══════════════════════════════════════');
    
    console.log(`\n${colors.cyan}Resumen General:${colors.reset}`);
    console.log(`  • Total de solicitudes: ${testConfig.total}`);
    console.log(`  • Exitosas: ${colors.green}${stats.successful}${colors.reset}`);
    console.log(`  • Fallidas: ${colors.red}${stats.failed}${colors.reset}`);
    console.log(`  • Tasa de éxito: ${successRate}%`);
    console.log(`  • Tiempo total: ${(totalTime/1000).toFixed(2)}s`);
    console.log(`  • Throughput: ${colors.bright}${throughput} req/s${colors.reset}`);
    
    console.log(`\n${colors.cyan}Tiempos de Respuesta:${colors.reset}`);
    console.log(`  • Promedio: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  • P50 (mediana): ${p50?.toFixed(2)}ms`);
    console.log(`  • P95: ${p95?.toFixed(2)}ms`);
    console.log(`  • P99: ${p99?.toFixed(2)}ms`);
    console.log(`  • Mínimo: ${Math.min(...stats.responseTimes).toFixed(2)}ms`);
    console.log(`  • Máximo: ${Math.max(...stats.responseTimes).toFixed(2)}ms`);
    
    if (Object.keys(stats.errorCodes).length > 0) {
      console.log(`\n${colors.cyan}Errores por código:${colors.reset}`);
      Object.entries(stats.errorCodes).forEach(([code, count]) => {
        console.log(`  • ${code}: ${count} errores`);
      });
    }
    
    if (finalAnalytics) {
      const requestsGenerated = finalAnalytics.overall?.total_requests - (initialAnalytics?.overall?.total_requests || 0);
      
      console.log(`\n${colors.cyan}Métricas del Motor QR v2:${colors.reset}`);
      console.log(`  • Requests procesados en esta prueba: ${requestsGenerated}`);
      console.log(`  • Total requests (sistema): ${finalAnalytics.overall?.total_requests || 0}`);
      console.log(`  • Cache hit rate final: ${finalAnalytics.overall?.cache_hit_rate_percent?.toFixed(2) || 0}%`);
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
    
    // Recomendaciones basadas en resultados
    console.log(`\n${colors.cyan}📝 Análisis y Recomendaciones:${colors.reset}`);
    
    if (successRate < 100) {
      console.log(`  ${colors.yellow}⚠️  Tasa de éxito < 100% - Revisar logs de errores${colors.reset}`);
    }
    
    if (p95 > 100) {
      console.log(`  ${colors.yellow}⚠️  P95 > 100ms - Considerar optimización de rendimiento${colors.reset}`);
    } else if (p95 < 20) {
      console.log(`  ${colors.green}✅ Excelente rendimiento - P95 < 20ms${colors.reset}`);
    }
    
    if (throughput < 50) {
      console.log(`  ${colors.yellow}⚠️  Throughput bajo - Verificar recursos del sistema${colors.reset}`);
    } else if (throughput > 200) {
      console.log(`  ${colors.green}✅ Alto throughput - Sistema funcionando óptimamente${colors.reset}`);
    }
    
    const cacheHitRate = finalAnalytics?.overall?.cache_hit_rate_percent || 0;
    if (cacheHitRate < 50) {
      console.log(`  ${colors.yellow}💡 Cache hit rate bajo - Los datos únicos reducen efectividad del cache${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✅ Prueba completada exitosamente${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error durante la prueba:${colors.reset}`, error.message);
  } finally {
    rl.close();
  }
}

// Manejar Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}⚠️  Prueba interrumpida por el usuario${colors.reset}`);
  if (stats.successful > 0) {
    const avgResponseTime = stats.totalTime / stats.successful;
    console.log(`\n${colors.cyan}Resultados parciales:${colors.reset}`);
    console.log(`  • Requests completados: ${stats.successful}`);
    console.log(`  • Tiempo promedio: ${avgResponseTime.toFixed(2)}ms`);
  }
  process.exit(0);
});

// Ejecutar pruebas
console.clear();
runLoadTest().catch(console.error);