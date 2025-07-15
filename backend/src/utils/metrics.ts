import client from 'prom-client';

import prisma from '../lib/prisma.js';

// Crear un registro para las métricas
export const registry = new client.Registry();

// Habilitar métricas por defecto (CPU, memoria, GC, latencia event loop)
// Se recolectarán automáticamente
client.collectDefaultMetrics({ register: registry });

// Prefijo común para métricas personalizadas
const METRIC_PREFIX = 'qreable_backend_';

// Métrica Personalizada: Duración de Solicitudes HTTP (Histograma)
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: METRIC_PREFIX + 'http_request_duration_seconds',
  help: 'Duración de las solicitudes HTTP en segundos',
  labelNames: ['method', 'route', 'code'], // Etiquetas: método HTTP, ruta, código de estado
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Buckets para medir latencia (en segundos)
});
registry.registerMetric(httpRequestDurationMicroseconds);

// Métrica Personalizada: Contador de Solicitudes HTTP Totales
export const httpRequestsTotal = new client.Counter({
  name: METRIC_PREFIX + 'http_requests_total',
  help: 'Contador total de solicitudes HTTP recibidas',
  labelNames: ['method', 'route', 'code'],
});
registry.registerMetric(httpRequestsTotal);

// Métrica Personalizada: Duración de Llamadas al Servicio Rust (Histograma)
export const rustCallDurationSeconds = new client.Histogram({
  name: METRIC_PREFIX + 'rust_call_duration_seconds',
  help: 'Duración de las llamadas al servicio Rust en segundos',
  labelNames: ['barcode_type'], // Etiqueta: tipo de código de barras
  // Buckets más pequeños ya que esperamos que Rust sea rápido
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1],
});
registry.registerMetric(rustCallDurationSeconds);

// ---------------------------------------------------------------------------
// Métrica Personalizada: Estado de la Base de Datos (1=OK, 0=Caída)
export const dbUpGauge = new client.Gauge({
  name: METRIC_PREFIX + 'db_up',
  help: 'Indicador de salud de la base de datos (1=OK, 0=Down)',
});
registry.registerMetric(dbUpGauge);

// Chequeo periódico de salud de la base de datos cada 10 segundos
const startDbHealthCheck = () => {
  const updateHealth = async () => {
    try {
      await prisma.$queryRaw`SELECT 1;`;
      dbUpGauge.set(1);
    } catch {
      dbUpGauge.set(0);
    }
  };
  // Primera comprobación inmediata y luego en intervalos
  void updateHealth();
  setInterval(updateHealth, 10000);
};
startDbHealthCheck();

// Podríamos añadir más métricas aquí (ej. Cache Hits/Misses si Redis lo soporta fácil, Errores por tipo, etc.)

console.log('Sistema de métricas Prometheus inicializado.');
