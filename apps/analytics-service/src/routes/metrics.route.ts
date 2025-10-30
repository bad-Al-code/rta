import { IRouter, Request, Response, Router } from 'express';
import { metricsService } from '../services';

const router: IRouter = Router();

/**
 * @openapi
 * /api/v1/metrics:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Expose Prometheus metrics
 *     description: Returns application and Node.js metrics in the Prometheus exposition format.
 *     responses:
 *       '200':
 *         description: Prometheus metrics exposed successfully.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP http_requests_total Total number of HTTP requests
 *                 # TYPE http_requests_total counter
 *                 http_requests_total{service="analytics-service",method="GET",route="/api/v1/metrics",status_code="200"} 1
 */
router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metricsService.register.contentType);
  res.end(await metricsService.register.metrics());
});

export { router as metricsRouter };
