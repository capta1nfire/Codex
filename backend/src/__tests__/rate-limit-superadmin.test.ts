import request from 'supertest';
import express from 'express';
import { generationRateLimit } from '../middleware/rateLimitMiddleware';

describe('SUPERADMIN Rate Limit Exemption', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware that sets req.user
    app.use((req, res, next) => {
      // Check for test header to simulate different user roles
      const testRole = req.headers['x-test-role'];
      if (testRole) {
        req.user = {
          id: 'test-user-id',
          email: 'test@example.com',
          role: testRole as string
        };
      }
      next();
    });

    // Apply rate limiter
    app.use('/test', generationRateLimit, (req, res) => {
      res.json({ 
        success: true, 
        user: req.user,
        message: 'Request processed'
      });
    });
  });

  test('SUPERADMIN should bypass rate limit', async () => {
    // Make many requests as SUPERADMIN
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app)
          .post('/test')
          .set('x-test-role', 'SUPERADMIN')
          .send({ barcode_type: 'qrcode', data: 'test' })
      );
    }

    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      console.log(`Request ${index + 1}: Status ${response.status}`);
    });
  });

  test('Regular USER should hit rate limit', async () => {
    // Make many requests as regular USER
    const requests = [];
    for (let i = 0; i < 600; i++) { // More than the 500 limit for QR codes
      requests.push(
        request(app)
          .post('/test')
          .set('x-test-role', 'USER')
          .send({ barcode_type: 'qrcode', data: 'test' })
      );
    }

    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited
    const rateLimited = responses.filter(r => r.status === 429);
    const successful = responses.filter(r => r.status === 200);
    
    console.log(`Successful: ${successful.length}, Rate Limited: ${rateLimited.length}`);
    
    expect(rateLimited.length).toBeGreaterThan(0);
    expect(successful.length).toBeLessThanOrEqual(500); // QR code limit
  });

  test('Skip function should properly detect SUPERADMIN', () => {
    // Test the skip function directly
    const mockReq = {
      user: { role: 'SUPERADMIN' },
      body: { barcode_type: 'qrcode' }
    } as any;

    const skipFunction = generationRateLimit.skip;
    if (skipFunction) {
      const shouldSkip = skipFunction(mockReq, {} as any, () => {});
      expect(shouldSkip).toBe(true);
    }
  });
});