import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import logger from '../config/logger';
import { CustomError } from '../errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof CustomError) {
    logger.warn('CustomError handled: %o', {
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        fields: err.serializeErrors(),
      },
      request: {
        method: req.method,
        url: req.originalUrl,
      },
    });

    return res.status(err.statusCode).json({ errors: err.serializeErrors() });
  }

  logger.error('An unexpected error occurred: %o', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    errors: [{ message: 'Something went wrong, please try again later' }],
  });
};
