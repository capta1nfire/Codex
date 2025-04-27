import { Request, Response, NextFunction } from 'express';
import { userStore } from '../models/user.js';
// import { updateUserSchema } from '../schemas/user.schema.js'; // <-- Remove unused import
import { AppError, ErrorCode, HttpStatus } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Controlador para operaciones relacionadas con usuarios
 */
export const userController = {
  /**
   * Actualizar el perfil del usuario
   */
  updateUserProfile: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const updateData = req.body;

    // Verificar que el ID del usuario que hace la solicitud coincida con el ID a actualizar
    // O que el usuario sea ADMIN (puedes añadir esta lógica si es necesario)
    // Usamos aserción de tipo para req.user
    const requestingUser = req.user as { id: string; role?: string }; 
    if (requestingUser?.id !== userId /* && requestingUser?.role !== 'ADMIN' */) {
      return next(
        new AppError(
          'No autorizado para actualizar este perfil',
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN
        )
      );
    }

    try {
      // La validación del body ya se hizo con el middleware validateBody(updateUserSchema)
      const updatedUser = await userStore.updateUser(userId, updateData);

      if (!updatedUser) {
        return next(
          new AppError(
            'Usuario no encontrado',
            HttpStatus.NOT_FOUND,
            ErrorCode.NOT_FOUND
          )
        );
      }

      // Quitar campos sensibles antes de enviar la respuesta
      const sanitizedUser = userStore.sanitizeUser(updatedUser);

      res.status(HttpStatus.OK).json({
        success: true,
        user: sanitizedUser,
      });
    } catch (error) {
      // Loggear el error real
      logger.error('Error al actualizar perfil de usuario:', { 
        error, 
        userId, 
        updateData 
      });
      // Pasar al manejador de errores
      next(error);
    }
  },

  // TODO: Añadir otros métodos si son necesarios (ej. getUserProfile, deleteUser, etc.)
}; 