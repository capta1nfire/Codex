import { generationRateLimit } from '../middleware/rateLimitMiddleware.js';

describe('Debug Rate Limit Configuration', () => {
  test('Check rate limiter configuration', () => {
    console.log('Rate limiter type:', typeof generationRateLimit);
    console.log('Rate limiter properties:', Object.keys(generationRateLimit));

    // Check if it's a function
    if (typeof generationRateLimit === 'function') {
      console.log('generationRateLimit is a function');

      // Try to access the configuration
      const config = (generationRateLimit as any).config;
      console.log('Config:', config);

      // Try to access skip directly
      const skip = (generationRateLimit as any).skip;
      console.log('Skip function:', skip);
    }

    // Log the whole object
    console.log('Full object:', generationRateLimit);

    expect(generationRateLimit).toBeDefined();
  });
});
