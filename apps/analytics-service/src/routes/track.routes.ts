import { IRouter, Router } from 'express';

import { TrackController } from '../controllers';
import { apiLimiter, validateRequest } from '../middlewares';
import { trackEventSchema } from '../schema';

const router: IRouter = Router();

/**
 * @openapi
 * /api/v1/track:
 *   post:
 *     summary: Ingest a new analytics event
 *     tags: [Ingestion]
 *     description: This is a high-throughput, public endpoint for tracking user events. It queues the event for processing and responds immediately.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrackEvent'
 *     responses:
 *       '202':
 *         description: The event has been accepted for processing.
 *       '400':
 *         description: Invalid request body.
 *       '429':
 *         description: Too many requests.
 */
router.post(
  '/',
  apiLimiter,
  validateRequest(trackEventSchema),
  TrackController.trackEvent
);

export { router as trackRouter };
