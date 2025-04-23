import { Request, Response, NextFunction } from 'express';

import { AppError, ErrorCode, HttpStatus } from '../../utils/errors.js';
import { notFoundHandler, errorHandler, asyncErrorWrapper } from '../errorHandler.js';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock<NextFunction>;

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

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  describe('notFoundHandler', () => {
    test('should return 404 with RESOURCE_NOT_FOUND error code', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: expect.stringContaining('/test-url'),
          }),
        })
      );
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
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncErrorWrapper(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(asyncFn).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    test('should resolve normally when async function succeeds', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncErrorWrapper(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(asyncFn).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
