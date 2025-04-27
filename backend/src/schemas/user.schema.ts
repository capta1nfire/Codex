import { z } from 'zod';
import { Role } from '@prisma/client';

// Esquema base con campos comunes
const baseUserSchema = z.object({
  email: z.string().email({ message: 'El email debe ser válido' }),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().optional(),
  // Username ahora opcional Y nullable (para permitir borrar y regenerar)
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').optional().nullable(), 
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

// Esquema para la creación de usuarios (sin username explícito aquí, se genera en el modelo)
export const createUserSchema = baseUserSchema
  .omit({ username: true }) // Omitimos username aquí, ya que se genera automáticamente
  .extend({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Esquema para la actualización de usuarios (username opcional/nullable)
export const updateUserSchema = baseUserSchema
  .extend({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
    apiKey: z.string().optional(), // Permitir actualizar apiKey también
  })
  .partial(); // Hace todos los campos opcionales

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>; 