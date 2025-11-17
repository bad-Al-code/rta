import { IRouter, Router } from 'express';

import { ProjectController } from '../controllers/project.controller';
import { requireAuth, validateRequest } from '../middlewares';
import { createProjectSchema } from '../schema';

const router: IRouter = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: [] # Note: We need to define this in swagger.ts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProject'
 *     responses:
 *       '201':
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/ProjectResponse'
 *       '401':
 *         description: Unauthorized - user is not logged in.
 */
router.post(
  '/',
  validateRequest(createProjectSchema),
  ProjectController.createProject
);

/**
 * @openapi
 * /api/v1/projects:
 *   get:
 *     summary: List all projects for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: A list of projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectResponse'
 *       '401':
 *         description: Unauthorized - user is not logged in.
 */
router.get('/', ProjectController.getProjects);

export { router as projectRouter };
