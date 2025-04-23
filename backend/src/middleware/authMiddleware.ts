import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';

import { config } from '../config.js';
import { userStore, UserRole } from '../models/user.js';
import { authService, JwtPayload } from '../services/auth.service.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Configuración de estrategia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET,
};

// Configuración de estrategia local (email/password)
const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
};

// Estrategia JWT para autenticación mediante token
const jwtStrategy = new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
  try {
    // Buscar usuario por ID desde el token
    const user = await userStore.findById(payload.sub);

    if (user && user.isActive) {
      // Usuario encontrado y activo
      return done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      // Usuario no encontrado o inactivo
      return done(null, false);
    }
  } catch (error) {
    logger.error('Error en JWT strategy:', error);
    return done(error, false);
  }
});

// Estrategia local para autenticación mediante email/password
const localStrategy = new LocalStrategy(localOptions, async (email, password, done) => {
  try {
    // Intentar autenticar mediante email/password
    const user = await userStore.verifyPassword(email, password);

    if (user && user.isActive) {
      // Usuario autenticado y activo
      return done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      // Credenciales inválidas o usuario inactivo
      return done(null, false, { message: 'Credenciales inválidas' });
    }
  } catch (error) {
    logger.error('Error en Local strategy:', error);
    return done(error);
  }
});

// Estrategia para autenticación mediante API key
const apiKeyStrategy = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return next(); // No hay API key, continuar al siguiente middleware
    }

    // Buscar usuario por API key
    const user = await userStore.findByApiKey(apiKey);

    if (user && user.isActive) {
      // API key válida, usuario encontrado y activo
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    logger.error('Error en API key strategy:', error);
    next(error);
  }
};

// Configurar passport con las estrategias
export const configurePassport = () => {
  passport.use(jwtStrategy);
  passport.use(localStrategy);

  // Eliminar Serialización y deserialización ya que usamos autenticación stateless (JWT/API Key)
  /*
  passport.serializeUser((user, done) => {
    done(null, (user as Express.User).id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userStore.findById(id);
      if (user && user.isActive) {
        return done(null, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        });
      } else {
        return done(null, false);
      }
    } catch (error) {
      done(error, false);
    }
  });
  */

  // Solo necesitamos inicializar Passport
  return passport.initialize();
};

// Middleware para autenticar vía JWT (para uso en rutas protegidas)
export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (
      err: Error | null,
      user: Express.User | false | null,
      _info: { message: string } | undefined
    ) => {
      if (err) {
        return next(err);
      }

      // También verificar autenticación por API key
      if (!user && req.headers['x-api-key']) {
        // Ya se intenta en el middleware apiKeyStrategy
        // Si la API key es válida, req.user estará definido
        if (req.user) {
          return next();
        }
      }

      if (!user) {
        return next(new AppError('No autorizado', 401, ErrorCode.AUTHENTICATION_ERROR));
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

// Middleware para verificar rol del usuario
export const checkRole = (requiredRole: UserRole) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autorizado', 401, ErrorCode.AUTHENTICATION_ERROR));
    }

    const userRole = (req.user as any).role;

    if (!authService.hasRole(userRole, requiredRole)) {
      return next(new AppError('Acceso denegado', 403, ErrorCode.AUTHORIZATION_ERROR));
    }

    next();
  };
};

// Middleware para permitir métodos públicos y protegidos en el mismo controlador
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Intentar autenticar, pero continuar si falla
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.User | false | null) => {
      if (err) {
        return next(err);
      }

      if (user) {
        req.user = user;
      }

      // Intento de autenticación vía API key
      if (!req.user && req.headers['x-api-key']) {
        void apiKeyStrategy(req, res, next);
      } else {
        next();
      }
    }
  )(req, res, next);
};

// Exportar middleware y funciones
export const authMiddleware = {
  configurePassport,
  authenticateJwt,
  checkRole,
  optionalAuth,
  apiKeyStrategy,
};
