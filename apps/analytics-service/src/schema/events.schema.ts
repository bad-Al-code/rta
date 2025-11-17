import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     GetEvents:
 *       type: object
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - projectId
 *           properties:
 *             projectId:
 *               type: string
 *               format: uuid
 *               description: ID of the project.
 *         query:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: Page number (default: 1).
 *             limit:
 *               type: integer
 *               description: Number of items to return (default: 20).
 *             eventName:
 *               type: string
 *               description: Filter events by name (optional).
 */
export const getEventsSchema = z.object({
  params: z.object({
    projectId: z.uuid('Invalid Project ID'),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(20),
    eventName: z.string().optional(),
  }),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     GetProjectStats:
 *       type: object
 *       properties:
 *         params:
 *           type: object
 *           required:
 *             - projectId
 *           properties:
 *             projectId:
 *               type: string
 *               format: uuid
 *               description: ID of the project.
 *         query:
 *           type: object
 *           properties:
 *             days:
 *               type: integer
 *               description: Number of days to fetch data for (default: 7).
 *       example:
 *         params:
 *           projectId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         query:
 *           days: 14
 */
export const getProjectStatsSchema = z.object({
  params: z.object({
    projectId: z.uuid('Invalid Project ID'),
  }),
  query: z.object({
    days: z.coerce.number().int().positive().optional().default(7),
  }),
});
