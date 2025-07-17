import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import supertest from 'supertest';

import { config } from '../config.js';
import app from '../index';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimitMonitor, generationRateLimit } from '../middleware/rateLimitMiddleware.js';
import { generateRoutes } from '../routes/generate.routes.js';

jest.mock('../middleware/authMiddleware', () => ({
  authenticateJwt: jest.fn((req, res, next) => {
    req.user = { role: 'SUPERADMIN' };
    next();
  }),
}));

jest.mock('../services/barcodeService', () => ({
  generateBarcode: jest.fn().mockResolvedValue('<svg>mock</svg>'),
}));

// Mock the barcode service
jest.unstable_mockModule('../services/barcodeService.js', () => ({
  generateBarcode: jest.fn().mockResolvedValue('<svg>mock</svg>'),
  generateBarcodesBatch: jest.fn().mockResolvedValue({ success: true, results: [] }),
}));

// Mock logger to reduce noise
jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Generate Route - SUPERADMIN Rate Limit', () => {
  let app: express.Application;
  let superadminToken: string;
  let userToken: string;

  beforeAll(() => {
    // Create test tokens
    superadminToken = jwt.sign(
      { sub: 'superadmin-id', email: 'superadmin@test.com', role: 'SUPERADMIN' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { sub: 'user-id', email: 'user@test.com', role: 'USER' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Set up the route exactly as in the real app
    app.use('/api/generate', generateRoutes);
  });

  test('SUPERADMIN with JWT token should bypass rate limit', async () => {
    const requests = [];

    // Make 10 requests with SUPERADMIN token
    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app)
          .post('/api/generate')
          .set('Authorization', `Bearer ${superadminToken}`)
          .send({ barcode_type: 'qrcode', data: `test${i}` })
      );
    }

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach((response, index) => {
      console.log(`SUPERADMIN Request ${index + 1}: Status ${response.status}`);
      if (response.status !== 200) {
        console.log('Response body:', response.body);
      }
      expect(response.status).toBe(200);
    });
  });

  test('Regular USER with JWT should hit rate limit eventually', async () => {
    const requests = [];

    // Make many requests with USER token (more than the limit)
    for (let i = 0; i < 600; i++) {
      requests.push(
        request(app)
          .post('/api/generate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ barcode_type: 'qrcode', data: `test${i}` })
      );
    }

    const responses = await Promise.all(requests);

    const successful = responses.filter((r) => r.status === 200);
    const rateLimited = responses.filter((r) => r.status === 429);

    console.log(`USER - Successful: ${successful.length}, Rate Limited: ${rateLimited.length}`);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('Verify middleware order and user detection', async () => {
    // Create a test app with debug logging
    const debugApp = express();
    debugApp.use(express.json());

    // Add debug middleware to log user state
    debugApp.use((req, res, next) => {
      console.log('Before auth - req.user:', req.user);
      next();
    });

    debugApp.use(
      '/api/generate',
      rateLimitMonitor,
      authMiddleware.optionalAuth,
      (req, res, next) => {
        console.log('After auth - req.user:', req.user);
        next();
      },
      generationRateLimit,
      (req, res, next) => {
        console.log('After rate limit - req.user:', req.user);
        res.json({ user: req.user, message: 'Success' });
      }
    );

    const response = await request(debugApp)
      .post('/api/generate')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ barcode_type: 'qrcode', data: 'test' });

    console.log('Final response:', response.body);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.role).toBe('SUPERADMIN');
  });
});
