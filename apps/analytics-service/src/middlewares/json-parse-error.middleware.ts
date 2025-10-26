import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

function isSyntaxErrorWithBody(
  err: unknown
): err is SyntaxError & { body: unknown } {
  return (
    err instanceof SyntaxError &&
    typeof err === 'object' &&
    err !== null &&
    'body' in err
  );
}

/**
 * Middleware to handle JSON parsing errors from express.json()
 * This catches malformed JSON in request bodies and returns a 400 Bad Request
 * instead of letting it bubble up to the global error handler as a 500.
 */
export const jsonParseErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isSyntaxErrorWithBody(err)) {
    res.status(StatusCodes.BAD_REQUEST).json({
      errors: [
        {
          message: 'Invalid JSON format in request body',
        },
      ],
    });
    return;
  }

  next(err);
};
