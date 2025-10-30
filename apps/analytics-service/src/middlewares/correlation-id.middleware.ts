import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { requstContextMiddleware } from './request-context.middlware';

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.header('X-Correlation-ID') || uuidv4();
  res.setHeader('X-Correlation-ID', correlationId);

  requstContextMiddleware(() => ({ correlationId }), next);
};
