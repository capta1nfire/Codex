import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Crear un mock profundo del PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Asegurarse de que el mock se resetea antes de cada test (globalmente)
beforeEach(() => {
  mockReset(prismaMock);
});

// Exportar el tipo del mock para usar en tests si es necesario
export type MockPrisma = DeepMockProxy<PrismaClient>;
