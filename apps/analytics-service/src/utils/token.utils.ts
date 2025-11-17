import { Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { User } from '../db/schema';

type UserPayload = Pick<User, 'id' | 'email' | 'role'>;

export const attachCookiesToResponse = (res: Response, user: UserPayload) => {
  const accessToken = jwt.sign(user, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const oneDayInMs = 1000 * 60 * 60 * 24;

  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    signed: true,
    expires: new Date(Date.now() + oneDayInMs),
    sameSite: 'lax',
  });
};
