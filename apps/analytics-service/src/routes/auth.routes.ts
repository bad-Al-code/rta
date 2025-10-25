import { Router } from 'express';

import { AuthController } from '../controllers';
import { validateRequest } from '../middlewares';
import { apiLimiter } from '../middlewares/rate-limiter.middleware';
import { signupSchema } from '../schema';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *     responses:
 *       '201':
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       '400':
 *         description: Invalid input or email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '429':
 *         description: Too many requests from this IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/signup',
  apiLimiter,
  validateRequest(signupSchema),
  AuthController.signup
);

export { router as authRouter };
