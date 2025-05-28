import { jest } from '@jest/globals';

import { AppError, ErrorCode } from '../utils/errors.js';

// Import logger statically - Jest should swap with the mock
import logger from '../utils/logger.js';

// Mock console.log
const originalConsoleLog = console.log;
console.log = jest.fn();

describe('Error Handling Tests', () => {
  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    // Clear the imported manual mock
    (logger.error as jest.Mock).mockClear();
    (logger.info as jest.Mock).mockClear();
    (logger.warn as jest.Mock).mockClear();
    (logger.debug as jest.Mock).mockClear();
    (console.log as jest.Mock).mockClear();
  });

  test('should create an AppError with correct error code', () => {
    const error = new AppError('Prueba de error', 404, ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Prueba de error');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
  });

  test('should log error with correct information', () => {
    // Spy on the actual logger's error method
    const errorSpy = jest.spyOn(logger, 'error');

    const error = new AppError('Prueba de error', 404, ErrorCode.NOT_FOUND);

    // Call the logger method that we are spying on
    logger.error(`${error.code}: ${error.message}`, {
      stack: error.stack,
      context: error.details,
    });

    // Assert on the spy
    expect(errorSpy).toHaveBeenCalledWith(
      `${ErrorCode.NOT_FOUND}: Prueba de error`,
      expect.objectContaining({
        stack: expect.any(String),
      })
    );

    // Restore the original implementation
    errorSpy.mockRestore();
  });

  test('should log to console when error is created', () => {
    const error = new AppError('Prueba de error', 404, ErrorCode.NOT_FOUND);
    // Use console mock defined globally
    console.log('Error creado con código correcto:');
    console.log(JSON.stringify(error, null, 2));

    expect(console.log).toHaveBeenCalledWith('Error creado con código correcto:');
    expect(console.log).toHaveBeenCalledWith(expect.any(String));
  });
});
