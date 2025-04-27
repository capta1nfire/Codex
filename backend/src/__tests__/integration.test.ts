import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';

import {
  AppError,
  ErrorCode,
  ValidationError,
  NotFoundError,
  sendErrorResponse,
} from '../utils/errors.js';

describe('Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create a test express app
    app = express();

    // Add middleware for parsing JSON
    app.use(express.json());

    // Add a route that uses error handling
    app.post('/validate', (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, email } = req.body;

        if (!name) {
          throw new ValidationError('Name is required');
        }

        if (!email) {
          throw new ValidationError('Email is required');
        }

        // If all validations pass
        res.status(200).json({
          success: true,
          data: { name, email },
        });
      } catch (error) {
        next(error);
      }
    });

    // Add a route that uses the NotFoundError
    app.get('/user/:id', (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        // For testing, only ID 1 exists
        if (id !== '1') {
          throw new NotFoundError(`User with ID ${id} not found`);
        }

        res.status(200).json({
          success: true,
          data: { id: 1, name: 'Test User' },
        });
      } catch (error) {
        next(error);
      }
    });

    // Error handler middleware (simplified version)
    app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
      console.error('TEST Error Handler Captured:', err); // Log para ver el error
      return sendErrorResponse(res, err);
    });
  });

  describe('Validation Error Flow', () => {
    test('should validate required fields and return validation error', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ name: 'Test' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Email is required',
          }),
        })
      );
    });

    test('should pass validation and return success', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ name: 'Test', email: 'test@example.com' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { name: 'Test', email: 'test@example.com' },
      });
    });
  });

  describe('Not Found Error Flow', () => {
    test('should return not found error for invalid user ID', async () => {
      const response = await request(app).get('/user/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
            message: 'User with ID 999 not found',
          }),
        })
      );
    });

    test('should return user data for valid user ID', async () => {
      const response = await request(app).get('/user/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { id: 1, name: 'Test User' },
      });
    });
  });
});
