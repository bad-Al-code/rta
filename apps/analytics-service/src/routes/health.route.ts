import express, { IRouter, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { healthState } from '../config/health-state';

const router: IRouter = express.Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Check the detailed health of the service
 *     description: Returns the operational status of the user service and its critical dependencies.
 *     responses:
 *       '200':
 *         description: Service is healthy and all critical dependencies are connected.
 *       '503':
 *         description: Service is unhealthy because one or more of its critical dependencies is down.
 */
router.get('/health', (req: Request, res: Response) => {
  const report = healthState.getReport();

  const statusCode = healthState.isReady()
    ? StatusCodes.OK
    : StatusCodes.SERVICE_UNAVAILABLE;

  res.status(statusCode).json(report);
});

export { router as healthRouter };
