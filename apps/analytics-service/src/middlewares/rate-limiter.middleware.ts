import { NextFunction, Request, Response } from 'express';
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { RedisStore } from 'rate-limit-redis';

import {
  RATE_LIMIT_LEGACY_HEADERS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_STANDARD_HEADERS,
  RATE_LIMIT_WINDOW_MS,
} from '../config/constants';
import { env } from '../config/env';
import logger from '../config/logger';
import { redisConnection } from '../config/redis';

let apiLimiterInstance: RateLimitRequestHandler | null = null;

/**
 * Creates and returns a rate limiter instance.
 * This should be called once during app initialization.
 */
function createRateLimiter(): RateLimitRequestHandler {
  const redisClient = redisConnection.getClient();

  const store = new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: RATE_LIMIT_STANDARD_HEADERS,
    legacyHeaders: RATE_LIMIT_LEGACY_HEADERS,
    store: store,
    handler: (req, res, next, options) => {
      const retryAfterSeconds = Math.ceil(options.windowMs / 1000);

      res.setHeader('Retry-After', retryAfterSeconds);

      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        errors: [
          {
            message: `Too many requests. You may try again after ${retryAfterSeconds} seconds.`,
          },
        ],
      });
    },
  });
}

export function initializeRateLimiter(): void {
  if (!apiLimiterInstance) {
    apiLimiterInstance = createRateLimiter();
  }
}

/**
 * Rate limiter middleware for API routes.
 * This function wraps the actual rate limiter instance.
 *
 * Can be bypassed by setting SKIP_RATE_LIMIT=true environment variable.
 */
export function apiLimiter(req: Request, res: Response, next: NextFunction) {
  if (process.env.SKIP_RATE_LIMIT === 'true') {
    logger.debug('Rate limiting skipped (SKIP_RATE_LIMIT=true)');

    return next();
  }

  if (env.NODE_ENV === 'test') {
    return next();
  }

  if (!apiLimiterInstance) {
    initializeRateLimiter();
  }

  return apiLimiterInstance!(req, res, next);
}
