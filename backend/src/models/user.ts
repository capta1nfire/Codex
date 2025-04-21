import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import bcrypt from 'bcrypt';

// Importar el cliente Prisma y los tipos generados
import prisma from '../lib/prisma';
import { AppError, ErrorCode } from '../utils/errors'; // Necesario para errores específicos

// Usar la enumeración Role generada por Prisma
export const UserRole = PrismaRole;
export type UserRole = PrismaRole; // Exportar el tipo también

// Usar la interfaz User generada por Prisma (o extenderla si es necesario)
// Por ahora, la interfaz generada debería ser suficiente.
export type User = PrismaUser;

// Eliminar la versión en memoria.
// Ahora UserStore interactuará con la base de datos a través de Prisma.
export class UserStore {
  // Ya no necesitamos el array en memoria
  // private users: User[] = [];

  // Ya no necesitamos el constructor con usuarios por defecto
  /* constructor() { ... } */

  async findByEmail(email: string): Promise<User | null> {
    // Usar Prisma para buscar por email (que es único)
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    // Usar Prisma para buscar por id (que es único)
    return prisma.user.findUnique({ where: { id } });
  }

  async findByApiKey(apiKeyPlainText: string): Promise<User | null> {
    // 1. Extraer el prefijo de la key proporcionada
    const prefixLength = 8; // Debe coincidir con la longitud usada al guardar
    if (apiKeyPlainText.length < prefixLength) {
      return null; // La key es demasiado corta para tener un prefijo válido
    }
    const prefix = apiKeyPlainText.substring(0, prefixLength);

    // 2. Buscar usuarios con ese prefijo (usando índice)
    const potentialUsers = await prisma.user.findMany({
      where: {
        apiKeyPrefix: prefix,
        isActive: true, // Solo buscar en usuarios activos
      },
    });

    // Si no se encontraron usuarios con ese prefijo, la key es inválida
    if (potentialUsers.length === 0) {
      return null;
    }

    // 3. Comparar el hash de la key completa solo para los candidatos
    for (const user of potentialUsers) {
      if (user.apiKey) {
        // Doble check por si acaso
        const match = await bcrypt.compare(apiKeyPlainText, user.apiKey);
        if (match) {
          // ¡Coincidencia encontrada! Actualizar lastLogin y devolver
          return prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }, // @updatedAt se maneja automáticamente
          });
        }
      }
    }

    // Si se encontraron usuarios con el prefijo pero ninguno coincidió con el hash completo
    return null;
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }): Promise<User> {
    // Verificar si el usuario ya existe (Prisma lo hace con `create` si el campo es @unique)
    // pero hacerlo explícito puede dar mejor error.
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      // Usar AppError para un error más estructurado
      throw new AppError(
        `Usuario con email ${userData.email} ya existe`,
        409,
        ErrorCode.CONFLICT_ERROR
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Crear usuario usando Prisma (ID es autogenerado por @default(uuid()))
    // No generamos API Key aquí, se hace por separado
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        // createdAt y updatedAt son manejados por Prisma (@default/@updatedAt)
        // lastLogin es opcional y se establece en login
        // apiKey se establece por separado
        // apiUsage empieza en 0 por defecto
        // isActive empieza en true por defecto
      },
    });

    return newUser;
  }

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

    // Actualizar último login usando Prisma.update
    // Devolvemos el usuario actualizado
    return prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), updatedAt: new Date() }, // updatedAt se actualiza automáticamente por @updatedAt
    });
  }

  async updateUser(
    id: string,
    updates: Partial<
      Pick<User, 'name' | 'isActive' | 'role' | 'apiKey' | 'password' | 'apiKeyPrefix'>
    >
  ): Promise<User | null> {
    // Verificar si el usuario existe
    const userExists = await this.findById(id);
    if (!userExists) return null;

    const dataToUpdate: Record<string, unknown> = {};

    // Preparar datos a actualizar (solo campos permitidos y proporcionados)
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.isActive !== undefined) dataToUpdate.isActive = updates.isActive;
    if (updates.role !== undefined) dataToUpdate.role = updates.role;
    // Incluir apiKeyPrefix si se proporciona
    if (updates.apiKeyPrefix !== undefined) dataToUpdate.apiKeyPrefix = updates.apiKeyPrefix;

    // La contraseña y API key (hash) se manejan por separado abajo
    if (updates.password) {
      dataToUpdate.password = await bcrypt.hash(updates.password, 10);
    }
    if (updates.apiKey && typeof updates.apiKey === 'string') {
      dataToUpdate.apiKey = await bcrypt.hash(updates.apiKey, 10);
    }

    // Si no hay nada que actualizar (además de updatedAt que lo hace Prisma)
    if (Object.keys(dataToUpdate).length === 0) {
      return userExists; // Devolver el usuario existente sin cambios
    }

    // Actualizar usuario usando Prisma.update
    // updatedAt se actualiza automáticamente
    return prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
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
