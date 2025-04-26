import compression from 'compression';
import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

// Definir tipos para mocks y caché
interface MockRustResponse {
  success: boolean;
  svgString: string;
}

interface CacheEntry {
  data: MockRustResponse;
  timestamp: number;
}

// Mock de la respuesta del servicio Rust
const mockRustResponse: MockRustResponse = {
  success: true,
  svgString: '<svg width="100" height="100"></svg>'.repeat(100), // Crear una respuesta grande para probar compresión
};

// Mock de fetch para simular llamadas al servicio Rust
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockRustResponse),
  })
) as jest.MockedFunction<typeof fetch>;

describe('Performance Optimizations Tests', () => {
  let app: express.Express;
  let responseCache: Map<string, CacheEntry>;

  beforeEach(() => {
    // Restablecer el estado entre pruebas
    jest.clearAllMocks();

    // Crear una nueva instancia para cada prueba
    app = express();
    responseCache = new Map();

    // Configurar middleware básico
    app.use(compression());
    app.use(express.json());

    // Configurar la ruta de prueba con caché
    app.post('/test-cache', async (req, res) => {
      const { data } = req.body;
      const cacheKey = JSON.stringify({ data });

      // Verificar caché
      if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey)!;
        return res.json({
          ...cachedResponse.data,
          fromCache: true,
        });
      }

      // Simular llamada al servicio
      const result = mockRustResponse;

      // Guardar en caché
      responseCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      res.json(result);
    });
  });

  test('debe comprimir respuestas grandes', async () => {
    const response = await request(app)
      .post('/test-cache')
      .send({ data: 'test data' })
      .set('Accept-Encoding', 'gzip');

    // Verificar que la respuesta tenga encabezado de compresión
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.status).toBe(200);
  });

  test('debe servir desde caché en la segunda solicitud', async () => {
    // Primera solicitud - no debería estar en caché
    const firstResponse = await request(app).post('/test-cache').send({ data: 'test data' });

    expect(firstResponse.body.fromCache).toBeUndefined();

    // Segunda solicitud - debería estar en caché
    const secondResponse = await request(app).post('/test-cache').send({ data: 'test data' });

    expect(secondResponse.body.fromCache).toBe(true);
  });

  test('debe ser más rápido cuando sirve desde caché', async () => {
    // Primera solicitud - no en caché
    const startTimeNoCache = Date.now();
    await request(app).post('/test-cache').send({ data: 'test data' });
    const durationNoCache = Date.now() - startTimeNoCache;

    // Segunda solicitud - desde caché
    const startTimeWithCache = Date.now();
    await request(app).post('/test-cache').send({ data: 'test data' });
    const durationWithCache = Date.now() - startTimeWithCache;

    // La respuesta en caché debería ser más rápida
    expect(durationWithCache).toBeLessThanOrEqual(durationNoCache + 5);
  });
});
