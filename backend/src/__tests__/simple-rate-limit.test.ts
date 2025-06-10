import { Request } from 'express';
import { generationRateLimit } from '../middleware/rateLimitMiddleware.js';

describe('Simple Rate Limit Skip Test', () => {
  test('Skip function should return true for SUPERADMIN', () => {
    const mockReq = {
      user: { 
        id: 'test-id',
        email: 'test@example.com',
        role: 'SUPERADMIN' 
      },
      body: { barcode_type: 'qrcode' },
      ip: '127.0.0.1',
      path: '/api/generate'
    } as unknown as Request;

    const skipResult = generationRateLimit.skip?.(mockReq, {} as any, () => {});
    
    console.log('Mock request user:', mockReq.user);
    console.log('Skip result:', skipResult);
    
    expect(skipResult).toBe(true);
  });

  test('Skip function should return false for regular USER', () => {
    const mockReq = {
      user: { 
        id: 'test-id',
        email: 'test@example.com',
        role: 'USER' 
      },
      body: { barcode_type: 'qrcode' },
      ip: '127.0.0.1',
      path: '/api/generate'
    } as unknown as Request;

    const skipResult = generationRateLimit.skip?.(mockReq, {} as any, () => {});
    
    console.log('Mock request user:', mockReq.user);
    console.log('Skip result:', skipResult);
    
    expect(skipResult).toBe(false);
  });

  test('Skip function should return false when no user', () => {
    const mockReq = {
      body: { barcode_type: 'qrcode' },
      ip: '127.0.0.1',
      path: '/api/generate'
    } as unknown as Request;

    const skipResult = generationRateLimit.skip?.(mockReq, {} as any, () => {});
    
    console.log('Mock request user:', mockReq.user);
    console.log('Skip result:', skipResult);
    
    expect(skipResult).toBe(false);
  });
});