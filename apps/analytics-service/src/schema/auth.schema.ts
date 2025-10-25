import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     UserSignup:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address.
 *           example: 'test.user@example.com'
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password (min 8 characters).
 *           minLength: 8
 *           example: 'password123'
 *         name:
 *           type: string
 *           description: The user's full name.
 *           example: 'John Doe'
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export const signupSchema = z.object({
  body: z.object({
    email: z.email('Not a valid email'),
    password: z
      .string({ error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    name: z.string().optional(),
  }),
});
