// Definiciones de tipos personalizados para módulos sin definiciones de TypeScript

declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xssClean: () => RequestHandler;
  export = xssClean;
}

// Express types are defined in types/express.d.ts
// This file only contains module declarations for untyped packages
