// Global setup for tests
import path from 'path';
import url from 'url';

import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Obtener la ruta del directorio actual en ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test if it exists
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Increase timeout for tests (MOVED to jest.config.cjs)
// jest.setTimeout(30000);

// Add custom matchers if needed
// expect.extend({
//   customMatcher() {
//     // Custom matcher implementation
//   }
// });

// Global mocks
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

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

// Example: Mocking a global function or module
// jest.mock('../some-module');

// Enable ESM module mocking (suggested by Claude)
jest.unstable_mockModule = jest.mock;
