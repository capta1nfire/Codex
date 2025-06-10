// Simple test script to check rate limiter
const rateLimit = require('express-rate-limit');

// Mock the generation rate limit config
const generationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req) => {
    const barcodeType = req.body?.barcode_type;
    switch (barcodeType) {
      case 'qrcode':
        return 500;
      case 'code128':
      case 'ean13':
        return 300;
      default:
        return 200;
    }
  },
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey ? `apikey:${apiKey}` : `ip:${req.ip}`;
  },
  skip: (req) => {
    const user = req.user;
    const isSkipped = user?.role === 'SUPERADMIN';
    
    console.log('Skip function called:');
    console.log('  User:', user);
    console.log('  Role:', user?.role);
    console.log('  Is SUPERADMIN?:', user?.role === 'SUPERADMIN');
    console.log('  Will skip?:', isSkipped);
    
    return isSkipped;
  }
});

// Test the skip function
const mockReq = {
  user: { role: 'SUPERADMIN', id: '123', email: 'test@test.com' },
  body: { barcode_type: 'qrcode' },
  ip: '127.0.0.1'
};

console.log('\nTesting skip function with SUPERADMIN user:');
const skipResult = generationRateLimit.skip(mockReq);
console.log('Skip result:', skipResult);

// Test with regular user
const mockReq2 = {
  user: { role: 'USER', id: '456', email: 'user@test.com' },
  body: { barcode_type: 'qrcode' },
  ip: '127.0.0.1'
};

console.log('\nTesting skip function with USER:');
const skipResult2 = generationRateLimit.skip(mockReq2);
console.log('Skip result:', skipResult2);