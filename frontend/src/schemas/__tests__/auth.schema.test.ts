import { registerSchemaFrontend, loginSchema, updateUserProfileSchema } from '../auth.schema';
import { z } from 'zod';

describe('Auth Schema Validation', () => {
  test('registerSchemaFrontend should validate correct data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
    };
    expect(() => registerSchemaFrontend.parse(validData)).not.toThrow();
  });

  test('registerSchemaFrontend should invalidate incorrect data', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'pass',
      firstName: 'J',
      lastName: 'Doe',
    };
    expect(() => registerSchemaFrontend.parse(invalidData)).toThrow(z.ZodError);
  });

  test('loginSchema should validate correct data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Password123',
    };
    expect(() => loginSchema.parse(validData)).not.toThrow();
  });

  test('updateUserProfileSchema should validate correct data', () => {
    const validData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      username: 'john_doe',
    };
    expect(() => updateUserProfileSchema.parse(validData)).not.toThrow();
  });
});
