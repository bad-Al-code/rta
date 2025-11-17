import { IRouter, Router } from 'express';

import { UserController } from '../controllers';
import { requireAuth, validateRequest } from '../middlewares';
import { updateUserSchema } from '../schema';

const router: IRouter = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     summary: Update the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       '200':
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       '400':
 *         description: Invalid request payload.
 *       '401':
 *         description: Unauthorized — authentication required.
 */
router.patch(
  '/me',
  validateRequest(updateUserSchema),
  UserController.updateCurrentUser
);

export { router as userRouter };
