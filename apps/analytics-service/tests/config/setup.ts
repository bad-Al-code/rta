import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { afterAll, beforeAll } from 'vitest';

import { env } from '../../src/config/env';
import logger from '../../src/config/logger';
import { redisConnection } from '../../src/config/redis';
import { pool } from '../../src/db';
import { initializeRateLimiter } from '../../src/middlewares/rate-limiter.middleware';

env.DATABASE_URL = `${env.DATABASE_URL}_test`;

const runMigrations = async () => {
  const execPromises = promisify(exec);
  logger.info(`\nMigrating test database: ${env.DATABASE_URL}`);

  try {
    await execPromises('pnpm db:migrate');
    logger.info(`Test Database migration successful`);
  } catch (error) {
    logger.error(`Test database migration failed: `, error);

    process.exit(1);
  }
};

beforeAll(async () => {
  await redisConnection.connect();
  await runMigrations();

  initializeRateLimiter();
});

afterAll(async () => {
  await pool.end();
  await redisConnection.disconnect();
});
