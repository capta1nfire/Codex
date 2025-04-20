import { Router, Request, Response } from 'express';
import { config } from '../config'; // Importar config para CACHE_MAX_AGE

const router = Router();

// Ruta principal
router.get('/', (req: Request, res: Response) => {
  // Configurar headers de caché para respuestas inmutables
  res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
  res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
});

export const baseRoutes = router; 