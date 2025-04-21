module.exports = {
  parser: '@typescript-eslint/parser', // Especifica el parser de TypeScript
  extends: [
    'eslint:recommended', // Reglas recomendadas por ESLint
    'plugin:@typescript-eslint/recommended', // Reglas recomendadas para TypeScript
    'plugin:import/recommended', // Reglas recomendadas para imports
    'plugin:import/typescript', // Soporte de TypeScript para eslint-plugin-import
    'plugin:node/recommended', // Reglas recomendadas para Node.js
    'plugin:prettier/recommended', // Integra Prettier y deshabilita reglas conflictivas
  ],
  plugins: ['@typescript-eslint', 'import', 'node', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021, // Permite características modernas de ECMAScript
    sourceType: 'module', // Permite el uso de imports
    project: './tsconfig.json', // Necesario para algunas reglas de TS avanzadas
  },
  env: {
    node: true, // Define globales de Node.js
    es2021: true, // Define globales de ES2021
    jest: true, // Define globales de Jest (para los tests)
  },
  rules: {
    // --- Reglas Específicas para Node.js ---
    'node/no-unsupported-features/es-syntax': ['error', { version: '>=14.0.0', ignores: ['modules'] }], // Permitir sintaxis ES moderna (imports) en Node >= 14
    'node/no-missing-import': 'off', // Deshabilitado porque TS ya maneja esto mejor con paths/types
    'node/no-unpublished-import': ['error', { // Asegurar que no se importen devDependencies en código de producción
        allowModules: [], // Añadir aquí módulos de dev que *necesites* importar (ej: 'supertest' en tests)
        tryExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    }],


    // --- Reglas Específicas para TypeScript ---
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Advertir sobre variables no usadas (ignorar si empiezan con _)
    '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre el uso de 'any'
    '@typescript-eslint/explicit-function-return-type': 'off', // No requerir tipos de retorno explícitos siempre (puede ser inferido)
    '@typescript-eslint/no-floating-promises': 'error', // Requerir manejo de promesas


    // --- Reglas de Importación ---
    'import/order': ['warn', { // Ordenar imports mejora la legibilidad
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-unresolved': 'off', // Deshabilitado, TS maneja esto
    'import/prefer-default-export': 'off', // No forzar exportaciones por defecto


    // --- Otras Reglas / Preferencias ---
    'prettier/prettier': 'warn', // Marcar diferencias con Prettier como warnings
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Permitir console.log en desarrollo, advertir en producción
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Permitir debugger en desarrollo


    // Puedes añadir o modificar reglas aquí según las necesidades
  },
  settings: {
    'import/resolver': {
      typescript: {}, // Permite a eslint-plugin-import resolver paths de TS
    },
    node: {
      tryExtensions: ['.js', '.jsx', '.ts', '.tsx'], // Extensiones a probar para imports de Node.js
    },
  },
  ignorePatterns: [
      'node_modules/',
      'dist/',
      'coverage/',
      'prisma/generated/', // Ignorar código generado por Prisma
      '*.js', // Ignorar archivos JS si todo es TS (excepto este y jest.config.js)
      'jest.config.js',
      '.eslintrc.js',
      '.prettierrc.js',
      'certs/',
      'logs/'
  ],
};
