import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { updateUserSchema } from '../schema';
import { UserService } from '../services';

export class UserController {
  public static async updateCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.currentUser!.id;
      const { name } = updateUserSchema.parse({ body: req.body }).body;

      const updatedUser = await UserService.updateUser(userId, { name });

      res.status(StatusCodes.OK).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}
