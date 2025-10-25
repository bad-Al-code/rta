import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (
      req.originalUrl.startsWith('/api/auth/health') &&
      res.statusCode === 200
    )
      return;

    logger.info(
      `HTTP Request: ${req.method} ${req.originalUrl} - Status ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
