import { AppError, ErrorCode, HttpStatus } from '../errors';

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
    expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.context).toEqual({ field: 'test' });
  });

  test('should set default values when not provided', () => {
    const error = new AppError('Test error message');

    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.context).toBeUndefined();
  });
});

describe('ErrorCode enum', () => {
  test('should have the expected error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
    expect(ErrorCode.AUTHORIZATION_ERROR).toBe('AUTHORIZATION_ERROR');
    expect(ErrorCode.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
  });
}); 