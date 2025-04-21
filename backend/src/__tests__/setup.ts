// Global setup for tests
import dotenv from 'dotenv';

// Load environment variables from .env.test if it exists
dotenv.config({ path: '.env.test' });

// Increase timeout for tests
jest.setTimeout(30000);

// Add custom matchers if needed
// expect.extend({
//   customMatcher() {
//     // Custom matcher implementation
//   }
// });

// Global mocks
global.fetch = jest.fn() as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// Mock console methods to avoid noise in test output
// Comment these out if you want to see console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
