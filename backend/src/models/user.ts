import bcrypt from 'bcrypt';
// Importar el cliente Prisma y los tipos generados
import prisma from '../lib/prisma';
import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
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
    // Esto es más complejo con hashes. No podemos buscar directamente por el hash.
    // Necesitamos obtener *todos* los usuarios que *tienen* una API key hasheada
    // y luego comparar el hash de la key proporcionada con cada hash almacenado.
    // ¡ESTO ES MUY INEFICIENTE! Una mejor solución se discute abajo.
    
    /* --- IMPLEMENTACIÓN INEFICIENTE (NO USAR EN PRODUCCIÓN REAL) --- */
    /*
    const usersWithKeys = await prisma.user.findMany({
      where: { apiKey: { not: null } }, // Solo usuarios con apiKey definida
    });

    for (const user of usersWithKeys) {
      if (user.apiKey) {
        const match = await bcrypt.compare(apiKeyPlainText, user.apiKey);
        if (match) {
          // Actualizar lastLogin
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date(), updatedAt: new Date() },
          });
          return user; // Devolver el usuario encontrado
        }
      }
    }
    return null; // No se encontró coincidencia
    */
   /* --- FIN IMPLEMENTACIÓN INEFICIENTE --- */

   // --- SOLUCIÓN MEJORADA (Requiere cambio de enfoque o modelo) ---
   // La búsqueda por API Key hasheada es intrínsecamente lenta si no puedes 
   // indexar el hash directamente (lo cual no es seguro si usas salts diferentes por key).
   // Estrategias comunes:
   // 1. Key Prefix + Hash: Almacenar un prefijo corto no secreto de la key en texto plano 
   //    (ej. los primeros 8 caracteres) en una columna indexada, y el hash completo en otra.
   //    Al verificar, buscas por prefijo y luego comparas el hash solo de los resultados.
   // 2. API Key ID: Generar un ID público para la API Key (ej. ak_...) y almacenarlo.
   //    El usuario usaría este ID y un secreto (la key real) para autenticarse. 
   //    Buscarías por el ID público indexado.
   // 3. Almacén Externo Optimizado: Usar sistemas como Vault o almacenes especializados.

   // Por ahora, para mantener la funcionalidad *existente* sin cambios mayores,
   // dejaremos la búsqueda ineficiente comentada y lanzaremos un error temporal
   // indicando que esta funcionalidad necesita rediseñarse para ser eficiente con BBDD.
   
   // O, para que funcione *ahora* (aceptando la ineficiencia en bajo volumen):
    const usersWithKeys = await prisma.user.findMany({
      where: { apiKey: { not: null } }, 
    });
    for (const user of usersWithKeys) {
      if (user.apiKey) {
        const match = await bcrypt.compare(apiKeyPlainText, user.apiKey);
        if (match) {
          return prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date(), updatedAt: new Date() },
          });
        }
      }
    }
    return null;
   // Fin solución temporal ineficiente
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
      throw new AppError(`Usuario con email ${userData.email} ya existe`, 409, ErrorCode.CONFLICT_ERROR);
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
    if (!user || !user.isActive) { // Añadir chequeo isActive
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

  async updateUser(id: string, updates: Partial<Pick<User, 'name' | 'isActive' | 'role' | 'apiKey' | 'password' >>): Promise<User | null> {
    // Verificar si el usuario existe
    const userExists = await this.findById(id);
    if (!userExists) return null;

    const dataToUpdate: Record<string, any> = {};

    // Preparar datos a actualizar (solo campos permitidos y proporcionados)
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.isActive !== undefined) dataToUpdate.isActive = updates.isActive;
    if (updates.role !== undefined) dataToUpdate.role = updates.role;
    // La contraseña y API key se hashean aquí
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