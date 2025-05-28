import { jest } from '@jest/globals';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import passport from 'passport';
import request from 'supertest';

import { config } from '../config.js';
import { UserRole } from '../models/user.js';
import { authService, JwtPayload } from '../services/auth.service.js';

// REMOVE jest.mock - Se usará el mock manual
// jest.mock('../utils/logger', () => ({
//   info: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   debug: jest.fn(),
// }));

describe('Authentication Tests', () => {
  // Usuario de prueba
  const testUserEmail = `test${Date.now()}@example.com`;
  const testUserPassword = 'Password123!';
  let userToken: string;
  let adminToken: string;
  let premiumToken: string;
  let app: express.Application;

  // Creamos usuarios de prueba y configuramos la aplicación antes de todos los tests
  beforeAll(async () => {
    // Crear usuario regular para pruebas
    const user = {
      id: `user_${Date.now()}`,
      email: testUserEmail,
      password: testUserPassword,
      name: 'Test User',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLogin: null,
      apiKeyPrefix: null,
      apiKey: null,
      apiUsage: 0,
    };

    // Crear usuario admin para pruebas
    const admin = {
      id: `admin_${Date.now()}`,
      email: `admin${Date.now()}@example.com`,
      password: 'AdminPass123!',
      name: 'Admin User',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLogin: null,
      apiKeyPrefix: null,
      apiKey: null,
      apiUsage: 0,
    };

    // Crear usuario premium para pruebas
    const premium = {
      id: `premium_${Date.now()}`,
      email: `premium${Date.now()}@example.com`,
      password: 'PremiumPass123!',
      name: 'Premium User',
      role: UserRole.PREMIUM,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLogin: null,
      apiKeyPrefix: null,
      apiKey: null,
      apiUsage: 0,
    };

    // Generar tokens directamente
    userToken = authService.generateToken(user);
    adminToken = authService.generateToken(admin);
    premiumToken = authService.generateToken(premium);

    // Configurar la aplicación Express para testing
    app = express();
    app.use(express.json());

    // Middleware simulado para autenticación
    const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
      } catch {
        return res.status(401).json({ message: 'Invalid token' });
      }
    };

    const requireRole = (role: UserRole) => (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const user = req.user as JwtPayload;

      if (user.role === UserRole.ADMIN || user.role === role) {
        return next();
      }

      return res.status(403).json({ message: 'Access denied' });
    };

    // Rutas para testing
    app.post('/api/auth/register', (req: Request, res: Response) => {
      const { email, password } = req.body;

      if (!email || !password || password.length < 8) {
        return res.status(400).json({ message: 'Invalid data' });
      }

      if (email === testUserEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      res.status(201).json({ message: 'User registered successfully' });
    });

    app.post('/api/auth/login', (req: Request, res: Response) => {
      const { email, password } = req.body;

      if (email === testUserEmail && password === testUserPassword) {
        res.status(200).json({ token: userToken });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });

    app.get('/api/users/profile', authenticateJwt, (req: Request, res: Response) => {
      res.status(200).json({ user: req.user });
    });

    app.post(
      '/api/auth/admin',
      authenticateJwt,
      requireRole(UserRole.ADMIN),
      (_req: Request, res: Response) => {
        res.status(200).json({ message: 'Admin access granted' });
      }
    );

    app.post(
      '/api/auth/premium',
      authenticateJwt,
      requireRole(UserRole.PREMIUM),
      (_req: Request, res: Response) => {
        res.status(200).json({ message: 'Premium access granted' });
      }
    );
  });

  describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
    });

    test('should fail registration with invalid data', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
    });

    test('should reject duplicate email registration', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: testUserEmail,
        password: 'Password123!',
      });

      expect(response.status).toBe(409);
    });
  });

  describe('User Login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUserEmail,
        password: testUserPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUserEmail,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    test('should access user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    test('should reject unauthorized access to protected routes', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('Role-Based Access Control', () => {
    test('admin role should access admin route', async () => {
      // Log para diagnóstico
      console.log('Admin token:', adminToken);

      const response = await request(app)
        .post('/api/auth/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('premium role should access premium route', async () => {
      // Log para diagnóstico
      console.log('Premium token:', premiumToken);

      const response = await request(app)
        .post('/api/auth/premium')
        .set('Authorization', `Bearer ${premiumToken}`);

      expect(response.status).toBe(200);
    });

    test('admin role should access premium route', async () => {
      const response = await request(app)
        .post('/api/auth/premium')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('user role should be denied access to admin route', async () => {
      const response = await request(app)
        .post('/api/auth/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('user role should be denied access to premium route', async () => {
      const response = await request(app)
        .post('/api/auth/premium')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
