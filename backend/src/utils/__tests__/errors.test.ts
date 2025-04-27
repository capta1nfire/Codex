import { AppError, ErrorCode, HttpStatus } from '../errors.js';

describe('AppError', () => {
  test('should create an error with the correct properties', () => {
    const error = new AppError(
      'Test error message',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      { field: 'test' }
    );

    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: 'test' });
  });

  test('should set default values when not provided', () => {
    const error = new AppError('Test error message');

    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});

describe('ErrorCode enum', () => {
  test('should have the expected error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.INTERNAL_SERVER).toBe('INTERNAL_SERVER');
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ErrorCode.CONFLICT_ERROR).toBe('CONFLICT_ERROR');
    expect(ErrorCode.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
  });
});
