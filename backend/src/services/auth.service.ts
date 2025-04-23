import jwt from 'jsonwebtoken';

import { config } from '../config.js';
import { User, UserRole, userStore } from '../models/user.js';
import logger from '../utils/logger.js';

// Interfaz para el payload del token JWT
export interface JwtPayload {
  sub: string; // ID del usuario
  email: string; // Email del usuario
  role: UserRole; // Rol del usuario
  iat?: number; // Issued at (cuándo fue creado el token)
  exp?: number; // Expiration time (cuándo expira el token)
}

// Interfaz para respuesta de login
export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    // Obtener configuración JWT desde variables de entorno
    this.jwtSecret = config.JWT_SECRET;
    this.jwtExpiresIn = config.JWT_EXPIRES_IN || '1h';

    if (!this.jwtSecret) {
      logger.error('JWT_SECRET no está definido en las variables de entorno');
      throw new Error('JWT_SECRET no está definido');
    }
  }

  /**
   * Autentica un usuario y genera un token JWT
   */
  async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      // Verificar credenciales
      const user = await userStore.verifyPassword(email, password);
      if (!user) {
        return null;
      }

      // Generar token JWT
      const token = this.generateToken(user);

      // Calcular tiempo de expiración en segundos
      const expiresIn = this.getExpirationSeconds();

      // Devolver respuesta sin incluir la contraseña
      return {
        user: userStore.sanitizeUser(user),
        token,
        expiresIn,
      };
    } catch (error) {
      logger.error('Error durante login:', error);
      return null;
    }
  }

  /**
   * Genera un nuevo token JWT para un usuario
   */
  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verifica y decodifica un token JWT
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error('Error verificando token JWT:', error);
      return null;
    }
  }

  /**
   * Refresca un token JWT existente
   */
  async refreshToken(oldToken: string): Promise<{ token: string; expiresIn: number } | null> {
    try {
      // Verificar token actual
      const decoded = this.verifyToken(oldToken);
      if (!decoded || !decoded.sub) {
        return null;
      }

      // Buscar usuario por ID
      const user = await userStore.findById(decoded.sub);
      if (!user) {
        return null;
      }

      // Generar nuevo token
      const newToken = this.generateToken(user);
      const expiresIn = this.getExpirationSeconds();

      return { token: newToken, expiresIn };
    } catch (error) {
      logger.error('Error durante refresh de token:', error);
      return null;
    }
  }

  /**
   * Verifica si un usuario tiene el rol requerido
   */
  hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    // Simplificado para el MVP - se podría implementar jerarquía de roles
    if (userRole === UserRole.ADMIN) return true; // Admin puede hacer todo
    return userRole === requiredRole;
  }

  /**
   * Obtiene el tiempo de expiración del token en segundos
   */
  private getExpirationSeconds(): number {
    // Parsear el string de expiración (ej: '1h', '7d', '60m', etc)
    const unit = this.jwtExpiresIn.slice(-1);
    const value = parseInt(this.jwtExpiresIn.slice(0, -1), 10);

    switch (unit) {
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 3600; // 1 hora por defecto
    }
  }
}

// Instancia singleton para uso en toda la aplicación
export const authService = new AuthService();
