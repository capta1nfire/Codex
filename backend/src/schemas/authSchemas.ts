import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - username
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña (mín. 8 caracteres, 1 mayús., 1 minús., 1 núm.).
 *           minLength: 8
 *         firstName:
 *           type: string
 *           description: Nombre de pila del usuario.
 *           minLength: 2
 *         lastName:
 *           type: string
 *           description: Apellido del usuario (opcional).
 *         username:
 *           type: string
 *           description: Nombre de usuario único (mín. 3 caracteres, alfanumérico, _, -).
 *           minLength: 3
 *           pattern: '^[a-zA-Z0-9_-]+$'
 */
export const registerSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .transform((str) => str.trim()),
  lastName: z
    .string()
    .optional()
    .transform((str) => (str ? str.trim() : undefined)),
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'El nombre de usuario solo puede contener letras, números, guiones bajos (_) y guiones medios (-)'
    )
    .transform((str) => str.trim().toLowerCase()), // Guardar en minúsculas para consistencia
});

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario.
 */
export const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
