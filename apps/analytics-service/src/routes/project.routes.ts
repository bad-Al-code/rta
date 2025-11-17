import { IRouter, Router } from 'express';

import { EventController } from '../controllers';
import { ProjectController } from '../controllers/project.controller';
import { requireAuth, validateRequest } from '../middlewares';
import {
  createProjectSchema,
  getEventsSchema,
  getProjectStatsSchema,
  projectParamSchema,
  updateProjectSchema,
} from '../schema';

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

/**
 * @openapi
 * /api/v1/projects/{projectId}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Project retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/ProjectResponse'
 *       '404':
 *         description: Project not found.
 *       '401':
 *         description: Unauthorized.
 */
router.get(
  '/:projectId',
  validateRequest(projectParamSchema),
  ProjectController.getProject
);

/**
 * @openapi
 * /api/v1/projects/{projectId}:
 *   patch:
 *     summary: Update an existing project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProject'
 *     responses:
 *       '200':
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/ProjectResponse'
 *       '404':
 *         description: Project not found.
 *       '401':
 *         description: Unauthorized.
 */
router.patch(
  '/:projectId',
  validateRequest(updateProjectSchema),
  ProjectController.updateProject
);

/**
 * @openapi
 * /api/v1/projects/{projectId}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '204':
 *         description: Project deleted successfully.
 *       '404':
 *         description: Project not found.
 *       '401':
 *         description: Unauthorized.
 */
router.delete(
  '/:projectId',
  validateRequest(projectParamSchema),
  ProjectController.deleteProject
);

/**
 * @openapi
 * /api/v1/projects/{projectId}/events:
 *   get:
 *     summary: List events for a specific project
 *     tags: [Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: eventName
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A paginated list of events.
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden - user does not own this project.
 */
router.get(
  '/:projectId/events',
  validateRequest(getEventsSchema),
  EventController.getEvents
);

/**
 * @openapi
 * /api/v1/projects/{projectId}/stats:
 *   get:
 *     summary: Get aggregated statistics for a project
 *     tags: [Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           description: The number of past days to include in the stats.
 *           default: 7
 *     responses:
 *       '200':
 *         description: Aggregated project statistics.
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden - user does not own this project.
 */
router.get(
  '/:projectId/stats',
  validateRequest(getProjectStatsSchema),
  EventController.getProjectStats
);

export { router as projectRouter };
