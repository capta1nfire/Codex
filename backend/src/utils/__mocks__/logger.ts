// backend/src/utils/__mocks__/logger.ts
import { jest } from '@jest/globals';

// Exportar un objeto con funciones mockeadas
export default {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}; 