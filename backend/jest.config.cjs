/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: { warnOnly: true }
    }
  },
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
    '/coverage/',
    '/src/index.ts',
    '/src/server-config.ts',
    '/src/lib/'
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json'
      },
    ],
  },
  moduleNameMapper: {
    '^.*lib/prisma\\.js$': '<rootDir>/src/lib/__mocks__/prisma.ts',
    '^.*utils/logger\\.js$': '<rootDir>/src/utils/__mocks__/logger.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.+)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  verbose: true,
  testTimeout: 30000,
  roots: ['<rootDir>/src'],
}; 