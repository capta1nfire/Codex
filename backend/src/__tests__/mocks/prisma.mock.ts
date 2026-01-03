import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Crear un mock profundo del PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Función para resetear el mock (llamar en beforeEach de cada test)
export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

// Exportar el tipo del mock para usar en tests si es necesario
export type MockPrisma = DeepMockProxy<PrismaClient>;
