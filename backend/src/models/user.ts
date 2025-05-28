import { Role as PrismaRole, User as PrismaUser } from '@prisma/client';
import { Prisma } from '@prisma/client'; // Importar namespace Prisma
import bcrypt from 'bcrypt';

import { apiKeyCache } from '../lib/apiKeyCache.js';
import prisma from '../lib/prisma.js';
import { CreateUserInput } from '../schemas/user.schema.js'; // Remove UpdateUserInput
import { AppError, ErrorCode, HttpStatus } from '../utils/errors.js'; // Importar HttpStatus aquí
import logger from '../utils/logger.js';

// Usar la enumeración Role generada por Prisma
export { PrismaRole as UserRole }; // <-- Add this value export

// Usar la interfaz User generada por Prisma (o extenderla si es necesario)
// Por ahora, la interfaz generada debería ser suficiente.
export type User = PrismaUser;

/**
 * Clase de acceso a datos para usuarios
 */
export class UserStore {
  // Ya no necesitamos el array en memoria
  // private users: User[] = [];

  // Ya no necesitamos el constructor con usuarios por defecto
  /* constructor() { ... } */

  /**
   * Genera un nombre de usuario único con formato de robot.
   * Incluye comprobación de unicidad en la BD.
   * @private Método interno
   * @returns {Promise<string>} Un nombre de usuario único.
   * @throws {AppError} Si no se puede generar un nombre único después de varios intentos.
   */
  private async _generateUniqueUsername(): Promise<string> {
    const prefixes = [
      'Cyber',
      'Robo',
      'Mech',
      'Auto',
      'Unit',
      'Proto',
      'Techno',
      'Data',
      'Omni',
      'Syn',
      'Andro',
      'Giga',
      'Nano',
    ];
    const suffixes = [
      'tron',
      'bot',
      'nex',
      'core',
      'link',
      'dyne',
      'tech',
      'node',
      'droid',
      'byte',
      'flux',
      'naut',
    ];
    let username: string | null = null;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10; // Límite para evitar bucles infinitos

    while (!isUnique && attempts < maxAttempts) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const number = Math.floor(Math.random() * 900) + 100; // 3-digit number
      const candidate = `${prefix}${suffix}${number}`.toLowerCase();

      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: candidate },
        select: { id: true }, // Solo necesitamos saber si existe
      });

      if (!existingUserByUsername) {
        username = candidate;
        isUnique = true;
      } else {
        attempts++;
        logger.warn(`Colisión de username generado (${candidate}), intento ${attempts}`);
      }
    }

    if (!username) {
      // Si no se pudo generar un username único después de maxAttempts
      throw new AppError(
        'No se pudo generar un nombre de usuario único. Inténtalo de nuevo.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER
      );
    }
    return username;
  }

  /**
   * Busca un usuario por su dirección de correo electrónico
   * @param email Email del usuario a buscar
   * @returns El usuario encontrado o null si no existe
   */
  async findByEmail(email: string): Promise<User | null> {
    // Usar Prisma para buscar por email (que es único)
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    // Usar Prisma para buscar por id (que es único)
    return prisma.user.findUnique({ where: { id } });
  }

  /**
   * Busca un usuario por su apiKey (completa, comparando hash después de buscar por prefijo)
   * Versión optimizada con caché Redis para evitar bcrypt.compare repetitivos
   * @param providedApiKey API Key proporcionada por el cliente
   * @returns El usuario encontrado o null si no existe o la clave no coincide
   */
  async findByApiKey(providedApiKey: string): Promise<User | null> {
    // Validación básica
    if (typeof providedApiKey !== 'string' || providedApiKey.length < 8) {
      return null; // Clave inválida o demasiado corta
    }

    try {
      // 1. Verificar caché primero
      const cached = await apiKeyCache.get(providedApiKey);
      if (cached) {
        if (cached.valid && cached.userId) {
          // Caché hit: API key válida, obtener usuario por ID
          const user = await this.findById(cached.userId);
          if (user && user.isActive) {
            logger.debug(`API key cache hit for user ${cached.userId}`);
            return user;
          } else {
            // Usuario ya no existe o está inactivo, invalidar caché
            await apiKeyCache.delete(providedApiKey);
          }
        } else {
          // Caché hit: API key inválida
          logger.debug('API key cache hit: invalid key');
          return null;
        }
      }

      // 2. Caché miss: buscar por prefijo como antes
      const prefix = providedApiKey.substring(0, 8);

      const candidates = await prisma.user.findMany({
        where: {
          apiKeyPrefix: prefix,
          isActive: true,
        },
        // Optimización: solo traer campos necesarios para la comparación
        select: {
          id: true,
          apiKey: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          avatarUrl: true,
          avatarType: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          apiKeyPrefix: true,
          apiUsage: true,
          isActive: true,
        },
      });

      if (!candidates || candidates.length === 0) {
        // No hay candidatos, cachear como inválida
        await apiKeyCache.set(providedApiKey, null, false);
        return null;
      }

      // 3. Buscar coincidencia con bcrypt (optimizado con early return)
      for (const candidate of candidates) {
        if (candidate.apiKey) {
          const match = await bcrypt.compare(providedApiKey, candidate.apiKey);
          if (match) {
            // Coincidencia encontrada: cachear como válida
            await apiKeyCache.set(providedApiKey, candidate.id, true);
            logger.debug(`API key validated for user ${candidate.id} (prefix: ${prefix})`);
            return candidate as User;
          }
        }
      }

      // 4. No se encontró coincidencia: cachear como inválida
      await apiKeyCache.set(providedApiKey, null, false);
      logger.debug(`No API key match found for prefix: ${prefix}`);
      return null;
    } catch (error) {
      logger.error('Error in findByApiKey:', error);
      // En caso de error, no cachear y devolver null
      return null;
    }
  }

  /**
   * Busca un usuario por prefijo de API Key
   * @param apiKeyPrefix Prefijo de la API Key a buscar
   * @returns El usuario encontrado o null si no existe
   */
  async findByApiKeyPrefix(apiKeyPrefix: string): Promise<User | null> {
    // Buscar por el prefijo (que no está hasheado y es indexable)
    const user = await prisma.user.findFirst({
      where: {
        apiKeyPrefix,
        isActive: true,
      },
    });
    return user;
  }

  /**
   * Verifica si una API Key es válida para un usuario
   * @param user Usuario a verificar
   * @param providedApiKey API Key proporcionada
   * @returns true si la API Key es válida, false en caso contrario
   */
  async validateApiKey(user: User, providedApiKey: string): Promise<boolean> {
    if (!user.apiKey) return false;
    return bcrypt.compare(providedApiKey, user.apiKey);
  }

  /**
   * Incrementa el contador de uso de la API para un usuario
   * @param userId ID del usuario
   */
  async incrementApiUsage(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { apiUsage: { increment: 1 } },
    });
  }

  /**
   * Verifica la contraseña de un usuario y actualiza lastLogin si es correcta
   * @param email Email del usuario
   * @param password Contraseña
   * @returns Usuario si la contraseña es válida, null en caso contrario
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) {
      // Añadir chequeo isActive
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return null;
    }

    // Actualizar la fecha de último inicio de sesión
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
    });

    return updatedUser;
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    // Verificar si el email ya existe
    const existingUserByEmail = await this.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new AppError(
        `El email ${userData.email} ya está registrado`,
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT_ERROR
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // --- Generar Username único usando el método privado ---
    const username = await this._generateUniqueUsername();
    // --- Fin Generación Username ---

    // Preparar datos para la creación
    const dataToCreate: Prisma.UserCreateInput = {
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName.trim(),
      username: username, // Asignar el username generado y único
    };

    if (userData.lastName) {
      dataToCreate.lastName = userData.lastName.trim();
    }
    if (userData.role) {
      dataToCreate.role = userData.role;
    }

    // Crear usuario usando Prisma
    const newUser = await prisma.user.create({
      data: dataToCreate,
    });

    return newUser;
  }

  /**
   * Actualiza la fecha del último login de un usuario
   * @param id ID del usuario
   */
  async updateLastLogin(id: string): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async updateUser(
    id: string,
    updates: Partial<Prisma.UserUpdateInput & { phone?: string }>
  ): Promise<User | null> {
    const userExists = await this.findById(id);
    if (!userExists) return null;

    const dataToUpdate: Prisma.UserUpdateInput = {};

    // --- Preparar datos a actualizar, incluyendo lógica de username ---
    if (updates.firstName !== undefined) dataToUpdate.firstName = updates.firstName;
    if (updates.lastName !== undefined) dataToUpdate.lastName = updates.lastName;
    if (updates.phone !== undefined) (dataToUpdate as any).phone = updates.phone;

    // Lógica para username:
    if (updates.username === null) {
      // Si se envía null explícitamente, regenerar username
      dataToUpdate.username = await this._generateUniqueUsername();
      logger.info(`Regenerando username para usuario ${id} a ${dataToUpdate.username}`);
    } else if (typeof updates.username === 'string') {
      // Si es string, limpiarlo y asignarlo (la validación min(3) la hizo Zod)
      dataToUpdate.username = updates.username.trim().toLowerCase();
    }
    // Si es undefined, no se toca el username existente

    if (updates.isActive !== undefined) dataToUpdate.isActive = updates.isActive;
    if (updates.role !== undefined) dataToUpdate.role = updates.role;
    if (updates.apiKeyPrefix !== undefined) dataToUpdate.apiKeyPrefix = updates.apiKeyPrefix;
    if (updates.avatarUrl !== undefined) dataToUpdate.avatarUrl = updates.avatarUrl;
    if (updates.avatarType !== undefined) dataToUpdate.avatarType = updates.avatarType;

    if (updates.password && typeof updates.password === 'string') {
      // Asegurar que password sea string
      dataToUpdate.password = await bcrypt.hash(updates.password, 10);
    }
    if (updates.apiKey && typeof updates.apiKey === 'string') {
      dataToUpdate.apiKey = await bcrypt.hash(updates.apiKey, 10);
      // Solo actualizar prefijo si no se proporcionó explícitamente
      if (updates.apiKeyPrefix === undefined) {
        dataToUpdate.apiKeyPrefix = updates.apiKey.substring(0, 8);
      }
    }
    // --- Fin preparación datos ---

    if (Object.keys(dataToUpdate).length === 0) {
      return userExists; // No hay nada que actualizar
    }

    return prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  /**
   * Genera un nuevo API Key para un usuario
   * @param id ID del usuario
   * @returns Nueva API Key (sin hashear)
   */
  async generateApiKey(id: string): Promise<string> {
    // Invalidar caché de API keys existentes para este usuario
    await apiKeyCache.invalidateUserApiKeys(id);

    // Generar API Key aleatoria
    // Formato: prefijo (8 caracteres) + punto + cuerpo (24 caracteres)
    const prefix = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');

    const body = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join(
      ''
    );

    const apiKey = `${prefix}.${body}`;
    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    // Actualizar usuario con la nueva API Key
    await prisma.user.update({
      where: { id },
      data: {
        apiKey: hashedApiKey,
        apiKeyPrefix: prefix,
      },
    });

    logger.info(`Generated new API key for user ${id} with prefix ${prefix}`);
    return apiKey;
  }

  // Método auxiliar para eliminar campos sensibles (ahora solo necesitamos quitar password si Prisma no lo hace)
  // Prisma por defecto no devuelve password al hacer findUnique/findMany, pero es buena práctica mantenerlo
  sanitizeUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

// Instancia singleton para uso en toda la aplicación
export const userStore = new UserStore();
