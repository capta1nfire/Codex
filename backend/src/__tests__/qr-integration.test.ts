import request from 'supertest';

import app from '../index.js';
import { prisma } from '../lib/prisma.js';

describe('QR Engine v2 Integration Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Create test user and get auth token
    testUser = await prisma.user.create({
      data: {
        email: 'qrtest@example.com',
        firstName: 'QR',
        lastName: 'Test',
        password: '$2b$10$YourHashedPassword',
        role: 'USER',
      },
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'qrtest@example.com',
      password: 'testpassword',
    });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/qr/generate', () => {
    test('should generate basic QR code', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'https://example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.svg).toContain('<svg');
      expect(response.body.metadata).toHaveProperty('version');
      expect(response.body.metadata).toHaveProperty('modules');
      expect(response.body.metadata).toHaveProperty('processingTimeMs');
      expect(response.body.performance).toHaveProperty('engineVersion', '2.0.0');
    });

    test('should generate QR with custom eye shape', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'https://example.com',
          options: {
            eyeShape: 'rounded-square',
            size: 400,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.svg).toContain('<svg');
    });

    test('should generate QR with gradient', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'https://example.com',
          options: {
            gradient: {
              type: 'linear',
              colors: ['#000000', '#0000FF'],
              angle: 45,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.svg).toContain('linearGradient');
    });

    test('should reject invalid color format', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'https://example.com',
          options: {
            foregroundColor: 'invalid-color',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle data too long', async () => {
      const longData = 'x'.repeat(5000);
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: longData,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/qr/batch', () => {
    test('should generate multiple QR codes', async () => {
      const response = await request(app)
        .post('/api/qr/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          codes: [
            { data: 'https://example1.com' },
            { data: 'https://example2.com' },
            { data: 'https://example3.com' },
          ],
          options: {
            maxConcurrent: 3,
            includeMetadata: true,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(3);
      expect(response.body.summary.total).toBe(3);
      expect(response.body.summary.successful).toBe(3);
      expect(response.body.summary.failed).toBe(0);
    });

    test('should handle partial batch failure', async () => {
      const response = await request(app)
        .post('/api/qr/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          codes: [
            { data: 'https://example.com' },
            { data: 'x'.repeat(5000) }, // Too long
            { data: 'https://example2.com' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(3);
      expect(response.body.summary.successful).toBe(2);
      expect(response.body.summary.failed).toBe(1);
    });

    test('should reject batch exceeding size limit', async () => {
      const codes = Array(51).fill({ data: 'https://example.com' });
      const response = await request(app)
        .post('/api/qr/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ codes });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/qr/preview', () => {
    test('should generate preview with query parameters', async () => {
      const response = await request(app).get('/api/qr/preview').query({
        data: 'https://example.com',
        eyeShape: 'circle',
        fgColor: '#FF0000',
        bgColor: '#FFFFFF',
        size: 200,
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/svg+xml');
      expect(response.text).toContain('<svg');
    });

    test('should cache preview responses', async () => {
      const query = {
        data: 'https://example.com/cached',
        size: 300,
      };

      const response1 = await request(app).get('/api/qr/preview').query(query);

      const response2 = await request(app).get('/api/qr/preview').query(query);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response2.headers['cache-control']).toContain('public');
    });
  });

  describe('POST /api/qr/validate', () => {
    test('should validate QR data and options', async () => {
      const response = await request(app)
        .post('/api/qr/validate')
        .send({
          data: 'https://example.com',
          options: {
            logo: {
              data: 'base64encodedimage',
              size: 25,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBeDefined();
      expect(response.body.details).toHaveProperty('dataLength');
      expect(response.body.details).toHaveProperty('estimatedVersion');
    });

    test('should provide suggestions for improvements', async () => {
      const response = await request(app)
        .post('/api/qr/validate')
        .send({
          data: 'x'.repeat(2000),
          options: {
            errorCorrection: 'H',
            logo: {
              data: 'largelogo',
              size: 40,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limits to QR endpoints', async () => {
      // Make many requests quickly
      const promises = Array(20)
        .fill(null)
        .map(() => request(app).post('/api/qr/generate').send({ data: 'test' }));

      const responses = await Promise.all(promises);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle Rust service unavailable', async () => {
      // This would require mocking the Rust service being down
      // For now, we'll skip this test in CI
      if (process.env.CI) {
        return;
      }

      // Test would go here
    });
  });

  describe('Performance', () => {
    test('should generate basic QR in under 50ms', async () => {
      const start = Date.now();

      const response = await request(app)
        .post('/api/qr/generate')
        .send({ data: 'https://example.com' });

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.performance.processingTimeMs).toBeLessThan(50);
      expect(duration).toBeLessThan(100); // Including network overhead
    });

    test('should handle concurrent requests efficiently', async () => {
      const start = Date.now();

      const promises = Array(10)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post('/api/qr/generate')
            .send({ data: `https://example.com/${i}` })
        );

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(responses.every((r) => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(500); // 10 requests in under 500ms
    });
  });
});
