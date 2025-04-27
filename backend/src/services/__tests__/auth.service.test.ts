import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

import { authService, JwtPayload } from '../auth.service.js';
import { config } from '../../config.js';
import { User, userStore } from '../../models/user.js';

// Mockear SOLO dependencias EXTERNAS (no userStore)
// jest.mock('jsonwebtoken');

// Mock de logger (manual sigue OK)
// jest.mock('../../utils/__mocks__/logger.js'); // Asegurarse que apunta al mock si es necesario

describe('AuthService', () => {

    // Remove mocked implementations variables - access directly via cast
    // const mockedJwtSign = jest.mocked(jwt.sign);
    // const mockedJwtVerify = jest.mocked(jwt.verify);
    // jest.mocked(crypto.randomBytes);

    // Datos de prueba
    const testUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        lastLogin: null,
        apiKeyPrefix: null,
        apiKey: null,
        apiUsage: 0,
    };
    const sanitizedTestUser = { ...testUser };
    delete (sanitizedTestUser as Partial<User>).password;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should call jwt.sign with correct payload, secret, and expiration', () => {
            const expectedToken = 'mockTokenString';
            // Spy on jwt.sign
            const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue(expectedToken as any);

            const token = authService.generateToken(testUser);

            expect(signSpy).toHaveBeenCalledTimes(1);
            expect(signSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: testUser.id,
                    email: testUser.email,
                    role: testUser.role,
                }),
                config.JWT_SECRET,
                { expiresIn: config.JWT_EXPIRES_IN }
            );
            expect(token).toBe(expectedToken);

            signSpy.mockRestore(); // Restore original jwt.sign
        });
    });

    describe('verifyToken', () => {
        it('should call jwt.verify with the token and secret', () => {
            const token = 'validTokenString';
            const expectedPayload: JwtPayload = { sub: 'user-id', email: 'a@b.com', role: 'USER' };
            // Spy on jwt.verify
            const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(expectedPayload as any);

            const payload = authService.verifyToken(token);

            expect(verifySpy).toHaveBeenCalledTimes(1);
            expect(verifySpy).toHaveBeenCalledWith(token, config.JWT_SECRET);
            expect(payload).toEqual(expectedPayload);

            verifySpy.mockRestore(); // Restore original jwt.verify
        });

        it('should return null if jwt.verify throws an error', () => {
            const token = 'invalidTokenString';
            const verifyError = new Error('jwt expired');
            // Spy on jwt.verify and make it throw
            const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
                throw verifyError;
            });

            const payload = authService.verifyToken(token);

            expect(verifySpy).toHaveBeenCalledTimes(1);
            expect(verifySpy).toHaveBeenCalledWith(token, config.JWT_SECRET);
            expect(payload).toBeNull();

            verifySpy.mockRestore(); // Restore original jwt.verify
        });
    });

    describe('login', () => {
        it('should return user and token on successful login', async () => {
            const verifyPasswordSpy = jest.spyOn(userStore, 'verifyPassword').mockResolvedValue(testUser);
            const sanitizeUserSpy = jest.spyOn(userStore, 'sanitizeUser').mockReturnValue(sanitizedTestUser);
            const generateTokenSpy = jest.spyOn(authService, 'generateToken').mockReturnValue('testToken');

            const result = await authService.login(testUser.email, 'correctPassword');

            expect(verifyPasswordSpy).toHaveBeenCalledWith(testUser.email, 'correctPassword');
            expect(sanitizeUserSpy).toHaveBeenCalledWith(testUser);
            expect(generateTokenSpy).toHaveBeenCalledWith(testUser);
            expect(result).toEqual({
                user: sanitizedTestUser,
                token: 'testToken',
                expiresIn: expect.any(Number),
            });

            verifyPasswordSpy.mockRestore();
            sanitizeUserSpy.mockRestore();
            generateTokenSpy.mockRestore();
        });

        it('should return null if verifyPassword returns null', async () => {
            const verifyPasswordSpy = jest.spyOn(userStore, 'verifyPassword').mockResolvedValue(null);
            const sanitizeUserSpy = jest.spyOn(userStore, 'sanitizeUser');
            const generateTokenSpy = jest.spyOn(authService, 'generateToken');

            const result = await authService.login(testUser.email, 'wrongPassword');

            expect(verifyPasswordSpy).toHaveBeenCalledWith(testUser.email, 'wrongPassword');
            expect(sanitizeUserSpy).not.toHaveBeenCalled();
            expect(generateTokenSpy).not.toHaveBeenCalled();
            expect(result).toBeNull();

            verifyPasswordSpy.mockRestore();
        });

        it('should return null if verifyPassword throws an error', async () => {
            const dbError = new Error('DB connection error');
            const verifyPasswordSpy = jest.spyOn(userStore, 'verifyPassword').mockRejectedValue(dbError);

            const result = await authService.login(testUser.email, 'anyPassword');

            expect(verifyPasswordSpy).toHaveBeenCalledWith(testUser.email, 'anyPassword');
            expect(result).toBeNull();

            verifyPasswordSpy.mockRestore();
        });
    });

    describe('refreshToken', () => {
        const oldToken = 'oldValidToken';
        const decodedPayload: JwtPayload = { sub: testUser.id, email: testUser.email, role: testUser.role };

        it('should return a new token and expiration if old token is valid and user exists', async () => {
            const newToken = 'newMockToken';
            const verifyTokenSpy = jest.spyOn(authService, 'verifyToken').mockReturnValue(decodedPayload);
            const findByIdSpy = jest.spyOn(userStore, 'findById').mockResolvedValue(testUser);
            const generateTokenSpy = jest.spyOn(authService, 'generateToken').mockReturnValue(newToken);

            const result = await authService.refreshToken(oldToken);

            expect(verifyTokenSpy).toHaveBeenCalledWith(oldToken);
            expect(findByIdSpy).toHaveBeenCalledWith(testUser.id);
            expect(generateTokenSpy).toHaveBeenCalledWith(testUser);
            expect(result).toEqual({
                token: newToken,
                expiresIn: expect.any(Number),
            });

            verifyTokenSpy.mockRestore();
            findByIdSpy.mockRestore();
            generateTokenSpy.mockRestore();
        });

        it('should return null if old token is invalid', async () => {
            const verifyTokenSpy = jest.spyOn(authService, 'verifyToken').mockReturnValue(null);
            const findByIdSpy = jest.spyOn(userStore, 'findById');

            const result = await authService.refreshToken('invalidOldToken');

            expect(verifyTokenSpy).toHaveBeenCalledWith('invalidOldToken');
            expect(findByIdSpy).not.toHaveBeenCalled();
            expect(result).toBeNull();

            verifyTokenSpy.mockRestore();
        });

        it('should return null if user is not found', async () => {
            const verifyTokenSpy = jest.spyOn(authService, 'verifyToken').mockReturnValue(decodedPayload);
            const findByIdSpy = jest.spyOn(userStore, 'findById').mockResolvedValue(null);
            const generateTokenSpy = jest.spyOn(authService, 'generateToken');

            const result = await authService.refreshToken(oldToken);

            expect(verifyTokenSpy).toHaveBeenCalledWith(oldToken);
            expect(findByIdSpy).toHaveBeenCalledWith(testUser.id);
            expect(generateTokenSpy).not.toHaveBeenCalled();
            expect(result).toBeNull();

            verifyTokenSpy.mockRestore();
        });
    });

    describe('hasRole', () => {
        it('should return true if user is ADMIN, regardless of required role', () => {
            expect(authService.hasRole('ADMIN', 'USER')).toBe(true);
            expect(authService.hasRole('ADMIN', 'PREMIUM')).toBe(true);
            expect(authService.hasRole('ADMIN', 'ADMIN')).toBe(true);
        });

        it('should return true if user role matches required role', () => {
            expect(authService.hasRole('USER', 'USER')).toBe(true);
            expect(authService.hasRole('PREMIUM', 'PREMIUM')).toBe(true);
        });

        it('should return false if user role does not match required role (and is not ADMIN)', () => {
            expect(authService.hasRole('USER', 'ADMIN')).toBe(false);
            expect(authService.hasRole('USER', 'PREMIUM')).toBe(false);
            expect(authService.hasRole('PREMIUM', 'ADMIN')).toBe(false);
        });
    });

}); 