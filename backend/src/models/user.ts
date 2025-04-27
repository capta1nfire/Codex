import { Role as PrismaRole, User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { AppError, ErrorCode, HttpStatus } from '../utils/errors.js'; // Importar HttpStatus aquí
import { CreateUserInput } from '../schemas/user.schema.js'; // Remove UpdateUserInput
import { Prisma } from '@prisma/client'; // Importar namespace Prisma
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
    const prefixes = ['Cyber', 'Robo', 'Mech', 'Auto', 'Unit', 'Proto', 'Techno', 'Data', 'Omni', 'Syn', 'Andro', 'Giga', 'Nano'];
    const suffixes = ['tron', 'bot', 'nex', 'core', 'link', 'dyne', 'tech', 'node', 'droid', 'byte', 'flux', 'naut'];
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
        select: { id: true } // Solo necesitamos saber si existe
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
   * @param providedApiKey API Key proporcionada por el cliente
   * @returns El usuario encontrado o null si no existe o la clave no coincide
   */
  async findByApiKey(providedApiKey: string): Promise<User | null> {
    // 1. Extraer prefijo (asumiendo formato prefijo.cuerpo o longitud fija)
    // Usaremos longitud fija de 8 caracteres como prefijo, como en generateApiKey
    if (typeof providedApiKey !== 'string' || providedApiKey.length < 8) {
      return null; // Clave inválida o demasiado corta
    }
    const prefix = providedApiKey.substring(0, 8);

    // 2. Buscar usuarios candidatos por prefijo
    const candidates = await prisma.user.findMany({
      where: {
        apiKeyPrefix: prefix,
        isActive: true, // Solo buscar usuarios activos
      },
    });

    if (!candidates || candidates.length === 0) {
      return null; // Ningún usuario con ese prefijo
    }

    // 3. Iterar y comparar hash
    for (const candidate of candidates) {
      if (candidate.apiKey) { // Asegurarse que el usuario tiene una apiKey hasheada
        const match = await bcrypt.compare(providedApiKey, candidate.apiKey);
        if (match) {
          // 4. Coincidencia encontrada: Actualizar lastLogin y devolver usuario
          // ¡Importante! No actualizar lastLogin aquí directamente, 
          // ya que esta función es solo para *encontrar* al usuario.
          // La actualización de lastLogin/apiUsage debe ocurrir en el middleware/controlador que la usa.
          // Devolvemos el usuario encontrado.
          return candidate; 
        }
      }
    }

    // 5. No se encontró coincidencia después de comparar
    return null;
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
        updatedAt: new Date() 
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
    updates: Partial<
      // Usar UpdateUserInput como tipo base para updates
      Prisma.UserUpdateInput 
    >
  ): Promise<User | null> {
    const userExists = await this.findById(id);
    if (!userExists) return null;

    const dataToUpdate: Prisma.UserUpdateInput = {};

    // --- Preparar datos a actualizar, incluyendo lógica de username --- 
    if (updates.firstName !== undefined) dataToUpdate.firstName = updates.firstName;
    if (updates.lastName !== undefined) dataToUpdate.lastName = updates.lastName;
    
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

    if (updates.password && typeof updates.password === 'string') { // Asegurar que password sea string
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
    // Generar API Key aleatoria 
    // Formato: prefijo (8 caracteres) + punto + cuerpo (24 caracteres)
    const prefix = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    
    const body = Array.from({ length: 24 }, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    
    const apiKey = `${prefix}.${body}`;
    const hashedApiKey = await bcrypt.hash(apiKey, 10);
    
    // Actualizar usuario con la nueva API Key
    await prisma.user.update({
      where: { id },
      data: { 
        apiKey: hashedApiKey,
        apiKeyPrefix: prefix 
      },
    });
    
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

