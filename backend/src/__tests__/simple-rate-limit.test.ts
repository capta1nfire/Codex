import { Request } from 'express';
import { rateLimit } from 'express-rate-limit';

import { generationRateLimit } from '../middleware/rateLimitMiddleware.js';
const generationRateLimitWithSkip = generationRateLimit as any;

describe('Simple Rate Limit Skip Test', () => {
  test('Skip function should return true for SUPERADMIN', () => {
    const skipResult = generationRateLimitWithSkip.skip({
      user: { role: 'SUPERADMIN' },
    });
    expect(skipResult).toBe(true);
  });

  test('Skip function should return false for regular USER', () => {
    const skipResult = generationRateLimit.skip?.(
      {
        user: { role: 'USER' },
      } as unknown as Request,
      {} as any,
      () => {}
    );
    expect(skipResult).toBe(false);
  });

  test('Skip function should return false when no user', () => {
    const skipResult = generationRateLimit.skip?.(
      {
        body: { barcode_type: 'qrcode' },
        ip: '127.0.0.1',
        path: '/api/generate',
      } as unknown as Request,
      {} as any,
      () => {}
    );
    expect(skipResult).toBe(false);
  });
});
