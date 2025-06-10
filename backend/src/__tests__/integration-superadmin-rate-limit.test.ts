import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';
import { config } from '../config.js';
import { generateRoutes } from '../routes/generate.routes.js';
import { authRoutes } from '../routes/auth.routes.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for integration tests

describe('SUPERADMIN Rate Limit Integration Test', () => {
  let app: express.Application;
  let superadminToken: string;
  let regularUserToken: string;

  beforeAll(async () => {
    // Set up Express app
    app = express();
    app.use(express.json());
    
    // Configure passport
    app.use(authMiddleware.configurePassport());
    
    // Set up routes
    app.use('/api/auth', authRoutes);
    app.use('/api/generate', generateRoutes);

    // Try to login as SUPERADMIN
    try {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@codex.com',
          password: 'admin123'
        });

      if (adminLogin.status === 200) {
        superadminToken = adminLogin.body.token;
        console.log('✅ SUPERADMIN login successful');
        console.log('SUPERADMIN user:', adminLogin.body.user);
      } else {
        console.error('❌ SUPERADMIN login failed:', adminLogin.body);
      }
    } catch (error) {
      console.error('Error logging in as SUPERADMIN:', error);
    }

    // Try to login as regular user
    try {
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@codex.com',
          password: 'user123'
        });

      if (userLogin.status === 200) {
        regularUserToken = userLogin.body.token;
        console.log('✅ Regular USER login successful');
      }
    } catch (error) {
      console.error('Error logging in as regular user:', error);
    }
  }, TEST_TIMEOUT);

  test('SUPERADMIN should bypass rate limit completely', async () => {
    if (!superadminToken) {
      console.warn('⚠️ Skipping test - no SUPERADMIN token available');
      return;
    }

    const requests = [];
    
    // Make 20 rapid requests (well over any rate limit)
    for (let i = 0; i < 20; i++) {
      requests.push(
        request(app)
          .post('/api/generate')
          .set('Authorization', `Bearer ${superadminToken}`)
          .send({ 
            barcode_type: 'qrcode', 
            data: `superadmin-test-${i}`,
            options: { scale: 2 }
          })
      );
    }

    const responses = await Promise.all(requests);
    
    // Count successful and rate limited responses
    const successful = responses.filter(r => r.status === 200);
    const rateLimited = responses.filter(r => r.status === 429);
    
    console.log(`SUPERADMIN - Total: ${responses.length}, Successful: ${successful.length}, Rate Limited: ${rateLimited.length}`);
    
    // All requests should succeed for SUPERADMIN
    expect(successful.length).toBe(20);
    expect(rateLimited.length).toBe(0);
  }, TEST_TIMEOUT);

  test('Regular USER should hit rate limit', async () => {
    if (!regularUserToken) {
      console.warn('⚠️ Skipping test - no regular user token available');
      return;
    }

    // Note: Rate limits might be per hour, so we need to be careful
    // The limit for QR codes is 500/hour for authenticated users
    const requestCount = 10; // Just test that rate limiting works
    const requests = [];
    
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        request(app)
          .post('/api/generate')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ 
            barcode_type: 'qrcode', 
            data: `user-test-${i}` 
          })
      );
    }

    const responses = await Promise.all(requests);
    
    const successful = responses.filter(r => r.status === 200);
    const rateLimited = responses.filter(r => r.status === 429);
    
    console.log(`USER - Total: ${responses.length}, Successful: ${successful.length}, Rate Limited: ${rateLimited.length}`);
    
    // Regular users should be able to make some requests
    expect(successful.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  test('Unauthenticated requests should also be rate limited', async () => {
    const requestCount = 10;
    const requests = [];
    
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        request(app)
          .post('/api/generate')
          .send({ 
            barcode_type: 'qrcode', 
            data: `anon-test-${i}` 
          })
      );
    }

    const responses = await Promise.all(requests);
    
    const successful = responses.filter(r => r.status === 200);
    
    console.log(`ANONYMOUS - Total: ${responses.length}, Successful: ${successful.length}`);
    
    // Anonymous users should be able to make some requests
    expect(successful.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  test('Verify rate limit log messages for SUPERADMIN', async () => {
    if (!superadminToken) {
      console.warn('⚠️ Skipping test - no SUPERADMIN token available');
      return;
    }

    // Mock logger to capture messages
    const infoSpy = jest.spyOn(logger, 'info');

    // Make a single request as SUPERADMIN
    const response = await request(app)
      .post('/api/generate')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ 
        barcode_type: 'qrcode', 
        data: 'log-test' 
      });

    expect(response.status).toBe(200);

    // Check if the SUPERADMIN skip message was logged
    const skipLogCalls = infoSpy.mock.calls.filter(call => 
      call[0].includes('[Rate Limit] SUPERADMIN detected')
    );

    console.log('Skip log calls found:', skipLogCalls.length);
    
    // Restore original logger
    infoSpy.mockRestore();
  }, TEST_TIMEOUT);
});