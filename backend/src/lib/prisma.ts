import { PrismaClient } from '@prisma/client';

// Instancia del cliente Prisma
// Se recomienda instanciarlo una sola vez y exportarlo
const prisma = new PrismaClient({
  // Opcional: Configuración de logging para Prisma
  // Puedes habilitar logs para ver las queries SQL que ejecuta
  log: [
    { emit: 'stdout', level: 'query' }, // Loguea queries a la consola
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

export default prisma;
