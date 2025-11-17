import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import logger from '../config/logger';
import { UserRepository } from '../db/repositories';
import { User } from '../db/schema';
import { UnauthenticatedError } from '../errors';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.signedCookies.token;

  if (!token) {
    throw new UnauthenticatedError('Authentication invalid: No token provided');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await UserRepository.findByEmail(payload.email);
    if (!user) {
      throw new UnauthenticatedError('Authentication invalid: User not found');
    }

    req.currentUser = user;
    next();
  } catch (error) {
    logger.error(`Authenticaion failed: %o`, error);

    throw new UnauthenticatedError(
      'Authentication invalid: Token is invalid or expired'
    );
  }
};
