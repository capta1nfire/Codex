// Definiciones de tipos personalizados para módulos sin definiciones de TypeScript

declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xssClean: () => RequestHandler;
  export = xssClean;
} 