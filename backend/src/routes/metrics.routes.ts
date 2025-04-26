import { Router, Request, Response } from 'express';

// Importar el registro de prom-client
import { registry } from '../utils/metrics.js';

const router = Router();

/**
 * @openapi
 * /metrics:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Obtener métricas en formato Prometheus
 *     description: Devuelve las métricas actuales del servidor en formato de texto compatible con Prometheus.
 *     responses:
 *       200:
 *         description: Métricas obtenidas correctamente.
 *         content:
 *           text/plain:
 *             schema:
 *              type: string
 *              example: |-
 *                # HELP nodejs_gc_duration_seconds Garbage collection duration histograms.
 *                # TYPE nodejs_gc_duration_seconds histogram
 *                nodejs_gc_duration_seconds_bucket{le="0.001",gc_type="major"} 0
 *                ...
 *                # HELP codex_backend_db_up Indicador de salud de la base de datos (1=OK, 0=Down)
 *                # TYPE codex_backend_db_up gauge
 *                codex_backend_db_up 1
 *       500:
 *         description: Error interno al generar las métricas.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Establecer el Content-Type correcto para Prometheus
    res.set('Content-Type', registry.contentType);
    // Enviar las métricas registradas
    res.end(await registry.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

export const metricsRoutes = router;
