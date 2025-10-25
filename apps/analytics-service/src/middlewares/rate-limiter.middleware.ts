import { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { RedisStore } from 'rate-limit-redis';

import {
  RATE_LIMIT_LEGACY_HEADERS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_STANDARD_HEADERS,
  RATE_LIMIT_WINDOW_MS,
} from '../config/constants';
import { redisConnection } from '../config/redis';

const redisStore = new RedisStore({
  sendCommand: (...args: string[]) =>
    redisConnection.getClient().sendCommand(args),
});

export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  store: redisStore,
  standardHeaders: RATE_LIMIT_STANDARD_HEADERS,
  legacyHeaders: RATE_LIMIT_LEGACY_HEADERS,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      errors: [{ message: 'Too many requests, please try again later.' }],
    });
  },
});
