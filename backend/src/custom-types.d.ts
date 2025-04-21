// Definiciones de tipos personalizados para módulos sin definiciones de TypeScript

declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xssClean: () => RequestHandler;
  export = xssClean;
}

// Extender la interfaz de Request para incluir usuario autenticado
declare global {
  namespace Express {
    // Asegúrate de importar UserRole o definirlo aquí si es necesario
    // Importación es mejor si UserRole está definida en otro módulo
    // import { UserRole } from '../models/user'; // Descomentar si UserRole está en models/user

    interface User {
      id: string;
      email: string;
      name: string;
      // Si UserRole no se importa, define un tipo básico aquí o usa 'string'
      role: import('../models/user').UserRole; // Usar import() type para evitar import real
    }
  }
}
