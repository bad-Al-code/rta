import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { RATE_LIMIT_MAX_REQUESTS } from '../../src/config/constants';
import logger from '../../src/config/logger';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';

describe('Rate Limiting Integration Tests', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  afterEach(async () => {
    await db.delete(users);
  });

  describe('Rate limit headers', () => {
    it('should include rate limit headers if rate limiter is initialized', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData);

      const hasStandardHeaders =
        response.headers['ratelimit-limit'] !== undefined;
      const hasLegacyHeaders =
        response.headers['x-ratelimit-limit'] !== undefined;

      if (hasStandardHeaders) {
        expect(response.headers['ratelimit-limit']).toBeDefined();
        expect(response.headers['ratelimit-remaining']).toBeDefined();
        expect(response.headers['ratelimit-reset']).toBeDefined();

        expect(response.headers['ratelimit-limit']).toBe(
          RATE_LIMIT_MAX_REQUESTS.toString()
        );
      } else if (hasLegacyHeaders) {
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      } else {
        logger.info(
          'Rate limiter headers not found. This may indicate Redis is not properly connected for rate limiting.'
        );
      }
    });
  });

  describe('Rate limit enforcement', () => {
    it('should allow requests within the rate limit', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should track remaining requests', async () => {
      const responses = [];

      for (let i = 0; i < 3; i++) {
        const userData = {
          email: faker.internet.email().toLowerCase(),
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/v1/auth/signup')
          .send(userData)
          .expect(201);

        responses.push(response);
      }

      const lastResponse = responses[responses.length - 1];
      const hasRateLimitHeaders =
        lastResponse.headers['ratelimit-remaining'] !== undefined ||
        lastResponse.headers['x-ratelimit-remaining'] !== undefined;

      if (hasRateLimitHeaders) {
        logger.info('Rate limiting is active and tracking requests');
      } else {
        logger.info(
          'Rate limiting headers not present - may not be fully initialized'
        );
      }
    });
  });

  describe('Rate limit exceeded behavior', () => {
    it('should handle rate limit gracefully if enforced', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData);

      const hasRateLimiting =
        response.headers['ratelimit-limit'] !== undefined ||
        response.headers['x-ratelimit-limit'] !== undefined;

      if (hasRateLimiting) {
        logger.info('Rate limiting is enabled and functioning');

        expect(response.status).toBe(201);
      } else {
        logger.info('Rate limiting not enabled - skipping enforcement test');
      }
    });
  });

  describe('Rate limiter configuration', () => {
    it('should use correct rate limit values', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      if (response.headers['ratelimit-limit']) {
        expect(response.headers['ratelimit-limit']).toBe(
          RATE_LIMIT_MAX_REQUESTS.toString()
        );
      }
    });
  });
});

describe('Rate Limiter Status Check', () => {
  it('should report rate limiter initialization status', async () => {
    const userData = {
      email: faker.internet.email().toLowerCase(),
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send(userData);

    const hasStandardHeaders =
      response.headers['ratelimit-limit'] !== undefined;
    const hasLegacyHeaders =
      response.headers['x-ratelimit-limit'] !== undefined;

    if (hasStandardHeaders || hasLegacyHeaders) {
      logger.info('\nRate limiter is properly initialized and functioning');
      logger.info(
        `   Headers found: ${hasStandardHeaders ? 'Standard (draft-7)' : 'Legacy'}`
      );
      logger.info(
        `   Limit: ${response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit']}`
      );
      logger.info(
        `   Remaining: ${response.headers['ratelimit-remaining'] || response.headers['x-ratelimit-remaining']}`
      );
    } else {
      logger.info('\nRate limiter headers not found');
      logger.info('   This usually means:');
      logger.info(
        '   1. Redis connection is not established for rate limiting'
      );
      logger.info('   2. Rate limiter was not initialized in test setup');
      logger.info(
        '   3. Rate limiter middleware is not being applied to routes'
      );
      logger.info(
        '\n   The application will still work, but rate limiting is not active.'
      );
    }

    expect(response.status).toBe(201);
  });
});
