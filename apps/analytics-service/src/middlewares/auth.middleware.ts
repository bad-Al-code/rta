import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
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
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid: No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await UserRepository.findByEmail(payload.email);
    if (!user) {
      throw new UnauthenticatedError('Authentication invalid: User not found');
    }

    req.currentUser = user;
    next();
  } catch (error) {
    throw new UnauthenticatedError(
      'Authentication invalid: Token is invalid or expired'
    );
  }
};
