import { Role } from '@prisma/client';
import { z } from 'zod';

// Esquema base con campos comunes
const baseUserSchema = z.object({
  email: z.string().email({ message: 'El email debe ser válido' }),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().optional(),
  // Username ahora opcional Y nullable (para permitir borrar y regenerar)
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .optional()
    .nullable(),
  phone: z
    .string()
    .regex(/^[+]?[1-9][\d]{0,15}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')), // Permitir string vacío
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

// Esquema para validar parámetros de ID (asumiendo UUID)
export const userIdParamsSchema = z.object({
  id: z.string().uuid({ message: 'El ID proporcionado no es un UUID válido' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
// Exportar tipo para parámetros de ID
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>;
