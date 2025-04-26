import { Router, Request, Response } from 'express';

import { config } from '../config.js'; // Importar config para CACHE_MAX_AGE

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Base
 *     summary: Ruta principal de bienvenida
 *     description: Devuelve un mensaje simple indicando que la API está funcionando.
 *     responses:
 *       200:
 *         description: Mensaje de bienvenida.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: ¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.
 */
router.get('/', (_req: Request, res: Response) => {
  // Configurar headers de caché para respuestas inmutables
  res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
  res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
});

export const baseRoutes = router;
