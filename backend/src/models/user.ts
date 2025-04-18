import bcrypt from 'bcrypt';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium'
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  apiKey?: string;
  apiUsage?: number;
  isActive: boolean;
}

// Ejemplo básico de base de datos en memoria para este MVP
// En producción, esto debería estar en una base de datos como PostgreSQL
export class UserStore {
  private users: User[] = [];

  constructor() {
    // Crear un usuario administrador por defecto
    this.createUser({
      email: 'admin@codex.com',
      password: 'admin123',
      name: 'Administrator',
      role: UserRole.ADMIN
    });

    // Crear un usuario normal para pruebas
    this.createUser({
      email: 'user@codex.com',
      password: 'user123',
      name: 'Test User',
      role: UserRole.USER
    });

    // Crear un usuario premium para pruebas
    this.createUser({
      email: 'premium@codex.com',
      password: 'premium123',
      name: 'Premium User',
      role: UserRole.PREMIUM
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async findByApiKey(apiKey: string): Promise<User | undefined> {
    return this.users.find(user => user.apiKey === apiKey);
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }): Promise<User> {
    // Verificar si el usuario ya existe
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error(`Usuario con email ${userData.email} ya existe`);
    }

    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Generar un ID único
    const id = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Generar una API key única
    const apiKey = `api_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newUser: User = {
      id,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      apiKey,
      apiUsage: 0,
      isActive: true
    };

    this.users.push(newUser);
    return newUser;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    // Actualizar último login
    user.lastLogin = new Date();
    user.updatedAt = new Date();
    
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    // No actualizar estos campos directamente
    const protectedFields = ['id', 'password', 'createdAt', 'apiKey'];
    
    // Actualizar el usuario
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...Object.fromEntries(
        Object.entries(updates).filter(([key]) => !protectedFields.includes(key))
      ),
      updatedAt: new Date()
    };

    // Si hay una nueva contraseña, hashearla
    if (updates.password) {
      this.users[userIndex].password = await bcrypt.hash(updates.password, 10);
    }

    return this.users[userIndex];
  }

  // Método auxiliar para eliminar campos sensibles antes de enviar al cliente
  sanitizeUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

// Instancia singleton para uso en toda la aplicación
export const userStore = new UserStore(); 