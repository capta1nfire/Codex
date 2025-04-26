import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

import { AppError, ErrorCode, HttpStatus } from '../../utils/errors.js';
import { notFoundHandler, errorHandler, asyncErrorWrapper } from '../errorHandler.js';

// Type helper for mocked Response (simplified, might not be needed)
// type MockResponse = Partial<Response> & {
//   status: jest.MockedFunction<Response['status']>;
//   json: jest.MockedFunction<Response['json']>;
// };

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

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

    // Cast mocks to any again, but keep the corrected assertion below
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    nextFunction = jest.fn();
  });

  describe('notFoundHandler', () => {
    test('should return 404 with RESOURCE_NOT_FOUND error code', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: expect.stringContaining('Ruta no encontrada: /test-url'),
          context: undefined,
        },
      });
    });

    it('should call notFoundHandler with correct arguments', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    test('should handle AppError properly', () => {
      const appError = new AppError(
        'Test error',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );

      errorHandler(appError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Test error',
          }),
        })
      );
    });

    test('should handle regular Error as internal server error', () => {
      const error = new Error('Regular error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.INTERNAL_ERROR,
          }),
        })
      );
    });
  });

  describe('asyncErrorWrapper', () => {
    test('should pass error to next function when async function throws', async () => {
      const error = new Error('Async error');
      // Keep the typed mock for the async function itself
      const asyncFn = jest.fn<() => Promise<never>>().mockRejectedValue(error);
      const wrappedFn = asyncErrorWrapper(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(asyncFn).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    test('should resolve normally when async function succeeds', async () => {
      const asyncFn = jest.fn<() => Promise<unknown>>().mockResolvedValue('success');
      const wrappedFn = asyncErrorWrapper(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(asyncFn).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
