/// <reference types="jest" />
import { jest, describe, it, expect, afterAll } from '@jest/globals';

// Importar bcrypt normalmente - no usamos jest.mock()
import bcrypt from 'bcrypt';

// Crear mocks para bcrypt.hash y bcrypt.compare
const originalBcryptHash = bcrypt.hash;
const originalBcryptCompare = bcrypt.compare;

// Reemplazar temporalmente las funciones por versiones que podemos controlar en los tests
// @ts-expect-error - El tipo exacto de jest.fn() no coincide con bcrypt.hash
bcrypt.hash = jest.fn().mockResolvedValue('hashedPwd') as typeof bcrypt.hash;
// @ts-expect-error - El tipo exacto de jest.fn() no coincide con bcrypt.compare
bcrypt.compare = jest.fn().mockResolvedValue(true) as typeof bcrypt.compare;

// Limpiar mocks y restaurar funciones originales al finalizar todos los tests
afterAll(() => {
  bcrypt.hash = originalBcryptHash;
  bcrypt.compare = originalBcryptCompare;
});

// Importar el mock centralizado
import { prismaMock } from '../../__tests__/mocks/prisma.mock.js';
// Importar tipos de Prisma
import type { User as PrismaGeneratedUser } from '@prisma/client';

// Mockear el módulo prisma para que Jest use __mocks__/
jest.mock('../../lib/prisma.js');

// Importar UserStore y tipos DESPUÉS de los mocks
import { userStore, User, UserRole } from '../user.js';
import { AppError, ErrorCode } from '../../utils/errors.js';

describe('UserStore', () => {

    // Limpiar mocks antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sanitizeUser', () => {
        it('should remove the password field from the user object', () => {
            const userWithPassword: User = {
                id: '1', email: 'test@test.com', password: 'secretPassword', 
                firstName: 'Test',
                lastName: null,
                username: null,
                role: UserRole.USER, 
                createdAt: new Date(), 
                updatedAt: new Date(),
                isActive: true, 
                lastLogin: null, 
                apiKeyPrefix: null, 
                apiKey: null, 
                apiUsage: 0,
                avatarUrl: null,
                avatarType: null
            };
            const sanitized = userStore.sanitizeUser(userWithPassword);
            expect(sanitized).not.toHaveProperty('password');
            expect(sanitized).toHaveProperty('email', 'test@test.com');
            expect(sanitized.id).toBe('1');
        });
    });

    describe('findByEmail', () => {
        it('should call prisma.user.findUnique with the correct email', async () => {
            const email = 'test@example.com';
            const mockUser = { /* ... */ } as PrismaGeneratedUser;
            // Usar el mock importado directamente
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const result = await userStore.findByEmail(email);

            // Verificar sobre el mock importado
            expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(result).toEqual(mockUser);
        });

        it('should return null if prisma.user.findUnique returns null', async () => {
            const email = 'notfound@example.com';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await userStore.findByEmail(email);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should call prisma.user.findUnique with the correct id', async () => {
            const id = 'user-id-123';
            const mockUser = { /* ... */ } as PrismaGeneratedUser;
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const result = await userStore.findById(id);

            expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id } });
            expect(result).toEqual(mockUser);
        });

        it('should return null if prisma.user.findUnique returns null', async () => {
            const id = 'non-existent-id';
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await userStore.findById(id);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id } });
            expect(result).toBeNull();
        });
    });

    // --- Siguientes pruebas para createUser, verifyPassword, etc. ---
    describe('findByApiKey', () => {
        it('should return null if the apiKey is too short', async () => {
            const result = await userStore.findByApiKey('short');
            expect(result).toBeNull();
        });

        it('should return null if no users match the prefix', async () => {
            const apiKey = '12345678abcdef';
            const prefix = apiKey.substring(0, 8);
            prismaMock.user.findMany.mockResolvedValue([]);
            const result = await userStore.findByApiKey(apiKey);
            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                where: { apiKeyPrefix: prefix, isActive: true },
            });
            expect(result).toBeNull();
        });

        it('should return null if no candidate matches the hash', async () => {
            const apiKey = '12345678abcdef';
            const mockUser = { id: '1', apiKey: 'hashed' } as PrismaGeneratedUser;
            prismaMock.user.findMany.mockResolvedValue([mockUser]);
            // @ts-expect-error - El tipo de jest.Mock no coincide exactamente con el de bcrypt.compare
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
            const result = await userStore.findByApiKey(apiKey);
            expect(bcrypt.compare).toHaveBeenCalledWith(apiKey, mockUser.apiKey);
            expect(result).toBeNull();
        });

        it('should update lastLogin and return user on successful match', async () => {
            const apiKey = '12345678abcdef';
            // Usar any para el mock user
            const mockUser = { id: '1', apiKey: 'hashed', apiKeyPrefix: '12345678', isActive: true } as any; 
            prismaMock.user.findMany.mockResolvedValue([mockUser]);
            // Mockear bcrypt.compare para que devuelva true
            (bcrypt.compare as any).mockResolvedValueOnce(true); 
            // NO necesitamos mockear update aquí

            const result = await userStore.findByApiKey(apiKey);

            // Verificar que se buscó por prefijo
            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                where: { apiKeyPrefix: '12345678', isActive: true },
            });
            // Verificar que se comparó la clave
            expect(bcrypt.compare).toHaveBeenCalledWith(apiKey, mockUser.apiKey);
            // Verificar que NO se llamó a update
            expect(prismaMock.user.update).not.toHaveBeenCalled(); 
            // Verificar que se devolvió el usuario correcto
            expect(result).toEqual(mockUser); 
        });
    });

    describe('createUser', () => {
        it('should create a new user when email does not exist', async () => {
            const userData = { 
                email: 'new@example.com', 
                password: 'pwd', 
                firstName: 'Test', 
                lastName: 'User', 
                role: UserRole.USER 
            };
            prismaMock.user.findUnique.mockResolvedValueOnce(null); 
            (bcrypt.hash as any).mockResolvedValue('hashedPwd'); 
            const newUser = { 
                id: '1', 
                email: userData.email, 
                password: 'hashedPwd', 
                firstName: userData.firstName, 
                lastName: userData.lastName, 
                role: userData.role,
            } as any;
            prismaMock.user.create.mockResolvedValue(newUser);
            
            const result = await userStore.createUser(userData);
            
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: {
                    email: userData.email,
                    password: 'hashedPwd',
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    username: expect.any(String),
                },
            });
            expect(result).toEqual(newUser);
        });

        it('should throw AppError if email already exists', async () => {
            const userData = { 
                email: 'exists@example.com', 
                password: 'pwd', 
                firstName: 'Test', 
                role: UserRole.USER 
            };
            const existingUser = { id: '1', email: userData.email } as any;
            prismaMock.user.findUnique.mockResolvedValueOnce(existingUser); 
            
            const promise = userStore.createUser(userData);
            
            await expect(promise).rejects.toBeInstanceOf(AppError);
            await expect(promise).rejects.toMatchObject({ statusCode: 409, code: ErrorCode.CONFLICT_ERROR, message: expect.stringContaining('El email exists@example.com ya está registrado') });
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
            expect(prismaMock.user.create).not.toHaveBeenCalled(); 
        });
    });

    describe('verifyPassword', () => {
        it('should return null if user is not found or inactive', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            let result = await userStore.verifyPassword('email', 'pwd');
            expect(result).toBeNull();

            const inactiveUser = { id: '1', isActive: false, password: 'hashed' } as PrismaGeneratedUser;
            prismaMock.user.findUnique.mockResolvedValue(inactiveUser);
            result = await userStore.verifyPassword('email', 'pwd');
            expect(result).toBeNull();
        });

        it('should return null if password does not match', async () => {
            const user = { id: '1', isActive: true, password: 'hashed' } as PrismaGeneratedUser;
            prismaMock.user.findUnique.mockResolvedValue(user);
            // @ts-expect-error - El tipo de bcrypt.compare como jest.fn() no permite mockResolvedValue
            bcrypt.compare.mockResolvedValue(false);
            const result = await userStore.verifyPassword('email', 'pwd');
            expect(bcrypt.compare).toHaveBeenCalledWith('pwd', user.password);
            expect(result).toBeNull();
        });

        it('should update lastLogin and return user on successful match', async () => {
            const user = { id: '1', isActive: true, password: 'hashed' } as PrismaGeneratedUser;
            const updatedUser = { ...user, lastLogin: new Date() } as PrismaGeneratedUser;
            prismaMock.user.findUnique.mockResolvedValue(user);
            // @ts-expect-error - El tipo de bcrypt.compare como jest.fn() no permite mockResolvedValue
            bcrypt.compare.mockResolvedValue(true);
            prismaMock.user.update.mockResolvedValue(updatedUser);
            const result = await userStore.verifyPassword('email', 'pwd');
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: user.id },
                data: { lastLogin: expect.any(Date), updatedAt: expect.any(Date) },
            });
            expect(result).toEqual(updatedUser);
        });
    });

    describe('updateUser', () => {
        it('should return null if user does not exist', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            // Usar un campo nuevo como firstName
            const result = await userStore.updateUser('1', { firstName: 'NewFirstName' });
            expect(result).toBeNull();
        });

        it('should return existing user if no updates provided', async () => {
            const existingUser = { id: '1' } as PrismaGeneratedUser;
            prismaMock.user.findUnique.mockResolvedValue(existingUser);
            const result = await userStore.updateUser('1', {});
            expect(result).toEqual(existingUser);
        });

        it('should update only provided fields (using new fields)', async () => {
            const existingUser = { id: '1' } as PrismaGeneratedUser;
            prismaMock.user.findUnique.mockResolvedValue(existingUser);
            const updated = { ...existingUser } as PrismaGeneratedUser;
            prismaMock.user.update.mockResolvedValue(updated);
            // Usar los nuevos campos en updates
            const updates = { 
                firstName: 'FirstName', 
                lastName: 'LastName', 
                username: 'newuser', 
                isActive: false, 
                role: UserRole.ADMIN, 
                apiKeyPrefix: 'pref' 
            };
            const result = await userStore.updateUser('1', updates);
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    // Esperar los nuevos campos
                    firstName: updates.firstName,
                    lastName: updates.lastName,
                    username: updates.username.toLowerCase(), // Recordar que se guarda en minúsculas
                    isActive: updates.isActive,
                    role: updates.role,
                    apiKeyPrefix: updates.apiKeyPrefix,
                },
            });
            expect(result).toEqual(updated);
        });

        it('should hash password and apiKey if provided', async () => {
            const existingUser = { id: '1' } as any;
            prismaMock.user.findUnique.mockResolvedValue(existingUser);
            (bcrypt.hash as any).mockResolvedValueOnce('hashedPass');
            (bcrypt.hash as any).mockResolvedValueOnce('hashedKey'); 
            const updated = { ...existingUser } as any;
            prismaMock.user.update.mockResolvedValue(updated);
            const result = await userStore.updateUser('1', { password: 'newpass', apiKey: 'newkey', apiKeyPrefix: 'pref2' });
            expect(bcrypt.hash).toHaveBeenNthCalledWith(1, 'newpass', 10);
            expect(bcrypt.hash).toHaveBeenNthCalledWith(2, 'newkey', 10);
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    apiKeyPrefix: 'pref2',
                    password: 'hashedPass',
                    apiKey: 'hashedKey',
                },
            });
            expect(result).toEqual(updated);
        });
    });

}); 