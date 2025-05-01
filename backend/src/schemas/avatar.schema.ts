import { z } from 'zod';

// Obtener los tipos válidos directamente (o mantenerlos sincronizados manualmente)
// Idealmente, esta lista debería provenir de una única fuente de verdad
const validAvatarTypes = [
  'Vector',
  'Cygnus',
  'Apex',
  'Rivet',
  'Socket',
  'Bolt',
] as const; // 'as const' para inferir tipos literales

/**
 * @openapi
 * components:
 *   parameters:
 *     AvatarTypeParam:
 *       name: type
 *       in: path
 *       required: true
 *       description: El tipo de avatar predeterminado a usar.
 *       schema:
 *         type: string
 *         enum: ['Vector', 'Cygnus', 'Apex', 'Rivet', 'Socket', 'Bolt']
 */
export const avatarParamsSchema = z.object({
  type: z.enum(validAvatarTypes, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message: `Tipo de avatar no válido. Opciones válidas: ${validAvatarTypes.join(', ')}`,
        };
      }
      return { message: ctx.defaultError };
    },
  }),
});

export type AvatarParamsInput = z.infer<typeof avatarParamsSchema>; 