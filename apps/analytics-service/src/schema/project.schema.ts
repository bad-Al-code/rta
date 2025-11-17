import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateProject:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the project to track.
 *           example: 'My Awesome Website'
 *     ProjectResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         userId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Project name is required' })
      .min(1, 'Project name cannot be empty'),
  }),
});
