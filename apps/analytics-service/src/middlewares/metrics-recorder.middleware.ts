import { NextFunction, Request, Response } from 'express';
import { metricsService } from '../services';

export const metricsRecorder = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const end = metricsService.httpRequestDurationMicroseconds.startTimer();

  res.on('finish', () => {
    const labels = {
      route: req.route ? req.route.path : req.url,
      method: req.method,
      status_code: res.statusCode.toString(),
    };

    end(labels);

    metricsService.httpRequestsTotal.inc(labels);
  });

  next();
};
