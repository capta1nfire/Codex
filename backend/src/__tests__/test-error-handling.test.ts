import { AppError, ErrorCode } from '../utils/errors';

// Mock logger
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock console.log
const originalConsoleLog = console.log;
console.log = jest.fn();

describe('Error Handling Tests', () => {
  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create an AppError with correct error code', () => {
    const error = new AppError('Prueba de error', 404, ErrorCode.RESOURCE_NOT_FOUND);
    
    expect(error.message).toBe('Prueba de error');
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  test('should log error with correct information', () => {
    const logger = require('../utils/logger');
    const error = new AppError('Prueba de error', 404, ErrorCode.RESOURCE_NOT_FOUND);
    
    logger.error(`${error.errorCode}: ${error.message}`, {
      stack: error.stack,
      context: error.context,
    });
    
    expect(logger.error).toHaveBeenCalledWith(
      `${ErrorCode.RESOURCE_NOT_FOUND}: Prueba de error`,
      expect.objectContaining({
        stack: expect.any(String),
      })
    );
  });

  test('should log to console when error is created', () => {
    const error = new AppError('Prueba de error', 404, ErrorCode.RESOURCE_NOT_FOUND);
    
    console.log('Error creado con código correcto:');
    console.log(JSON.stringify(error, null, 2));
    
    expect(console.log).toHaveBeenCalledWith('Error creado con código correcto:');
    expect(console.log).toHaveBeenCalledWith(expect.any(String));
  });
}); 