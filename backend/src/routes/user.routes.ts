import { Router } from 'express';

import { userController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody, validateParams } from '../middleware/validationMiddleware.js';
import { updateUserSchema, userIdParamsSchema } from '../schemas/user.schema.js';

const router = Router();

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Actualizar perfil de usuario
 *     description: Actualiza los datos del perfil de un usuario específico.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput' # Asegúrate de que este esquema exista en tu OpenAPI spec
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserOutput'
 *       400:
 *         description: Error de validación en los datos de entrada.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado para actualizar este perfil.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put(
  '/:id',
  authMiddleware.authenticateJwt, // 1. Autenticar
  validateParams(userIdParamsSchema), // 2. Validar Parámetros (ID)
  validateBody(updateUserSchema), // 3. Validar Body
  userController.updateUserProfile // 4. Controlador
);

// TODO: Añadir otras rutas de usuario (GET /:id, DELETE /:id, GET /)

export const userRoutes = router;
