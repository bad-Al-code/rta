import { Response } from 'express';

import { User } from '../db/schema';
import { attachCookiesToResponse } from '../utils';

type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

export class SessionService {
  /**
   * Centralized method to create a session and send the final API response.
   * @param res The Express Response object.
   * @param user The full user object from the database.
   * @param statusCode The HTTP status code to send.
   */
  public static sendToResponse(
    res: Response,
    user: User,
    statusCode: number
  ): void {
    attachCookiesToResponse(res, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(statusCode).json({ user: publicUser });
  }
}
