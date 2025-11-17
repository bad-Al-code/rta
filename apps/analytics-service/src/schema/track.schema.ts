import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     TrackEvent:
 *       type: object
 *       required:
 *         - projectId
 *         - eventName
 *       properties:
 *         projectId:
 *           type: string
 *           description: The ID of the project this event belongs to.
 *           example: 'some-project-id' # Note: In reality, this will be a UUID
 *         eventName:
 *           type: string
 *           description: The name of the event being tracked.
 *           example: 'pageview'
 *         path:
 *           type: string
 *           description: The URL path where the event occurred.
 *           example: '/products/123'
 *         properties:
 *           type: object
 *           description: A flexible object for any custom data.
 *           example:
 *             productId: 'xyz-789'
 *             price: 99.99
 */
export const trackEventSchema = z.object({
  body: z.object({
    projectId: z.uuid('Invalid Project ID format'),
    eventName: z.string().min(1, 'eventName cannot be empty'),
    path: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  }),
});
