import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodObject } from 'zod';

import { BadRequestError } from '../errors';

export const validateRequest =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const message = e.issues.map((err) => err.message).join(', ');

        throw new BadRequestError(message);
      }

      throw e;
    }
  };
