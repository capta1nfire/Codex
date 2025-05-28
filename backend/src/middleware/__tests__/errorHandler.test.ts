import { jest } from '@jest/globals';
import { Request, Response } from 'express';

import { AppError, ErrorCode, HttpStatus } from '../../utils/errors.js';
import { notFoundHandler, errorHandler, asyncErrorWrapper } from '../errorHandler.js';

// Type helper for mocked Response (simplified, might not be needed)
// type MockResponse = Partial<Response> & {
//   status: jest.MockedFunction<Response['status']>;
//   json: jest.MockedFunction<Response['json']>;
// };

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: any; // Usar 'any' para simplificar el tipado del mock
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test-url',
      path: '/test-path',
      method: 'GET',
      body: {},
      params: {},
      query: {},
      headers: {
        'user-agent': 'test-agent',
        'content-type': 'application/json',
        'content-length': '0',
      },
      ip: '127.0.0.1',
    };

    // Crear mocks y castear el objeto completo a 'any'
    mockResponse = {
      status: jest.fn().mockReturnThis(), // mockReturnThis para encadenar
      json: jest.fn().mockReturnThis(),
      // Añadir otros métodos si es necesario
    } as any;
    mockNext = jest.fn();
  });

  describe('notFoundHandler', () => {
    test('should call next with a NotFoundError', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Verificar que se llamó a next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      // Verificar que se llamó a next() con un AppError
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      // Verificar las propiedades del error pasado a next()
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          code: ErrorCode.NOT_FOUND,
          message: expect.stringContaining('Ruta no encontrada: /test-url'),
        })
      );
      // Verificar que status y json NO fueron llamados
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    test('should handle AppError properly', () => {
      const appError = new AppError(
        'Test error',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        { detail: 'some context' }
      );

      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Test error',
            details: { detail: 'some context' },
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle regular Error as internal server error', () => {
      const error = new Error('Regular error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.INTERNAL_SERVER,
            message: 'Error interno del servidor',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('asyncErrorWrapper', () => {
    test('should pass error to next function when async function throws', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn<() => Promise<never>>().mockRejectedValue(error);
      const wrappedFn = asyncErrorWrapper(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should resolve normally when async function succeeds', async () => {
      const asyncFn = jest.fn<() => Promise<unknown>>().mockResolvedValue('success');
      const wrappedFn = asyncErrorWrapper(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
