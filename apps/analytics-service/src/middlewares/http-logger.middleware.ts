import { NextFunction, Request, Response } from 'express';
import { performance } from 'perf_hooks';

import logger from '../config/logger';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - startTime;

    if (req.originalUrl.startsWith('/api/v1/health') && res.statusCode === 200) {
      return;
    }

    logger.info(
      `HTTP Request: ${req.method} ${req.originalUrl} - Status ${res.statusCode} - ${duration.toFixed(2)}ms`
    );
  });

  next();
};
