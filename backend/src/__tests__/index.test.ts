import express, { Express } from 'express';
import request from 'supertest';

import { ErrorCode, HttpStatus } from '../utils/errors.js';

describe('API Endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock root endpoint
    app.get('/', (_req, res) => {
      res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
    });

    // Mock generate endpoint
    app.post('/generate', (req, res) => {
      const { barcode_type, data } = req.body;
      if (!barcode_type || !data) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Missing required fields',
          },
        });
      }
      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          image: 'base64string',
          format: 'png',
        },
      });
    });
  });

  test('GET / - should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('API Gateway Node.js funcionando');
  });

  test('POST /generate - should validate required fields', async () => {
    const response = await request(app)
      .post('/generate')
      .send({})
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
  });

  test('POST /generate - should return barcode data on success', async () => {
    const response = await request(app)
      .post('/generate')
      .send({
        barcode_type: 'qrcode',
        data: 'https://example.com',
      })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('image');
    expect(response.body.data).toHaveProperty('format', 'png');
  });
});
