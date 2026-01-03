import type { User as PrismaUser, Role } from '@prisma/client';

declare global {
  namespace Express {
    // Extend Express.User to include Prisma User properties
    interface User extends PrismaUser {}

    interface Request {
      user?: User;
      startTime?: number;
    }
  }
}

export {};
