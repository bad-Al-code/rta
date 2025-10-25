import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { signupSchema } from '../schema';
import { AuthService } from '../services/auth.service';

export class AuthController {
  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = signupSchema.parse({
        body: req.body,
      }).body;

      const user = await AuthService.signup({ email, password, name });

      res.status(StatusCodes.CREATED).json(user);
    } catch (error) {
      next(error);
    }
  }
}
