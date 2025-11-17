import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { loginSchema, signupSchema } from '../schema';
import { SessionService } from '../services';
import { AuthService } from '../services/auth.service';

export class AuthController {
  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = signupSchema.parse({
        body: req.body,
      }).body;

      const user = await AuthService.signup({ email, password, name });

      SessionService.sendToResponse(res, user, StatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse({
        body: req.body,
      }).body;

      const user = await AuthService.login({ email, password });

      SessionService.sendToResponse(res, user, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }
}
