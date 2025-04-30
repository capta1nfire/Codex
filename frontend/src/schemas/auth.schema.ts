import { z } from 'zod';

// Esquema Zod para la validación del formulario de registro
// Alineado con createUserSchema del backend (sin username)
export const registerSchemaFrontend = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .transform((str: string) => str.trim()),
  lastName: z.string()
    .optional()
    .transform((str: string | undefined) => str ? str.trim() : undefined),
  // Eliminar campo username
  // username: z.string()...
});

// Inferir el tipo TypeScript del esquema para usarlo en el componente
export type RegisterFormData = z.infer<typeof registerSchemaFrontend>;

// --- Esquema para Login ---
// Replicado desde backend/src/schemas/authSchemas.ts
export const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

// Inferir el tipo TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;

// --- Esquema para Actualización de Perfil ---
// Replicado desde backend/src/schemas/user.schema.ts
// NOTA: Este esquema hace todos los campos opcionales con .partial()
// En el frontend, podríamos querer un esquema específico para el formulario
// que haga ciertos campos (como email, firstName) requeridos si no se permite
// dejarlos vacíos.

// Primero, definimos el esquema base sin partial, replicando el del backend
const baseUserSchemaFrontend = z.object({
  email: z.string().email({ message: 'El email debe ser válido' }),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().optional(),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones bajos (_) y guiones medios (-)')
    .optional()
    .nullable(), // Permitir nullable como en el backend
  // No incluimos role, isActive, apiKey ya que probablemente no se editan desde este formulario
});

// Esquema para la actualización de perfil en el frontend
export const updateUserProfileSchema = baseUserSchemaFrontend
  .extend({
    // Añadir validación opcional para la contraseña si se quiere cambiar
    password: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
      .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
      .regex(/[0-9]/, 'La contraseña debe tener al menos un número')
      .optional()
      .or(z.literal('')), // Permitir string vacío si no se quiere cambiar
  })
  // Aquí NO usamos .partial() porque queremos que email y firstName sean requeridos 
  // si el usuario los modifica. Los campos opcionales ya están marcados con .optional().

// Inferir el tipo TypeScript
export type UpdateProfileFormData = z.infer<typeof updateUserProfileSchema>;

// --- Tipos existentes ---
// Estas líneas ya existen al principio del archivo, eliminarlas de aquí.
// export type RegisterFormData = z.infer<typeof registerSchemaFrontend>;
// export type LoginFormData = z.infer<typeof loginSchema>; 