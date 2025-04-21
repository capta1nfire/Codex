// backend/eslint.config.js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  // 1. Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      'prisma/generated/',
      'certs/',
      'logs/',
      // Maybe ignore specific config files like jest.config.js, .prettierrc.js if needed
    ],
  },

  // 2. Base JS/ESLint recommended rules (applies to JS/TS files)
  pluginJs.configs.recommended,

  // 3. TypeScript configuration (applies to TS files)
  ...tseslint.config({
    files: ['**/*.ts', '**/*.tsx'], // Apply TS rules only to TS files
    extends: [
        ...tseslint.configs.recommended, // Base TS recommended rules
        // Consider adding recommendedTypeChecking for stricter checks later
        // ...tseslint.configs.recommendedTypeChecking,
    ],
    languageOptions: {
        parserOptions: {
            project: true, // Auto-detect tsconfig.json based on file location
            tsconfigRootDir: import.meta.dirname, // Sets the base dir for tsconfig lookup
        },
    },
    rules: {
      // --- Specific TS Rules --- You can override or add more here ---
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  }),

  // 4. Import plugin configuration (applies to JS/TS)
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      import: pluginImport,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json', // Explicitly point to tsconfig
        },
        node: true,
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'], // Ensure TS parser is used by import plugin
      },
    },
    rules: {
      // --- Import Rules ---
      'import/order': ['warn', { // Enforce a consistent import order
          groups: [
            'builtin', // Node.js built-in modules
            'external', // Packages from node_modules
            'internal', // Internal modules (paths defined in tsconfig)
            ['parent', 'sibling', 'index'], // Relative imports
            'object', // 'import { foo } from "object"'
            'type' // 'import type ...'
          ],
          'newlines-between': 'always', // Add blank lines between groups
          alphabetize: { order: 'asc', caseInsensitive: true }, // Sort imports alphabetically
      }],
      'import/no-unresolved': 'off', // Let TypeScript handle module resolution
      'import/prefer-default-export': 'off', // Allow named exports
      'import/no-extraneous-dependencies': ['error', { // Prevent importing devDeps into production code
          'devDependencies': [
              '**/*.test.ts', // Allow devDeps in test files
              '**/*.spec.ts',
              '**/jest.config.js', // Allow in Jest config
              '**/prisma/seed.ts', // Allow in seed script
          ],
          'optionalDependencies': false,
          'peerDependencies': false,
          'bundledDependencies': false,
      }],
    },
  },

  // 5. Project-wide language options and specific rules (applies to JS/TS)
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node, // Node.js global variables & Node.js scoping.
        ...globals.es2021, // ES2021 globals like BigInt.
        ...globals.jest, // Jest global variables.
      },
    },
    rules: {
      // --- Other Rules --- You can add more project-specific rules here ---
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },

  // 6. Prettier Configuration (Apply last to override formatting rules)
  pluginPrettierRecommended,
  {
    rules: {
        // Use 'warn' to make Prettier issues non-blocking during development
        'prettier/prettier': 'warn',
    }
  }
]; 