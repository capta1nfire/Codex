import { Router, Request, Response } from 'express';

// Importar el registro de prom-client
import { registry } from '../utils/metrics';

const router = Router();

// Endpoint para exponer métricas para Prometheus
router.get('/', async (req: Request, res: Response) => {
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
