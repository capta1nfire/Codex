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
 *         - name
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
 *         name:
 *           type: string
 *           description: Nombre del usuario.
 *           minLength: 3
 */
export const registerSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .transform(str => str.trim()),
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