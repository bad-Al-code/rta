import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { MAX_RETRIES, RETRY_DELAY_MS } from '../config/constants';
import { env } from '../config/env';
import logger from '../config/logger';
import { RetryService } from '../utils';
import * as schema from './schema';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('connect', () => {
  logger.info(`Database connected successfully.`);
});

pool.on('error', (err) => {
  logger.error('Database connection error: %o', { error: err.stack });
});

export const db = drizzle(pool, {
  schema,
  logger: env.NODE_ENV === 'development',
});

/**
 * A simple function to verify the database connection on startup.
 */
export const checkDatabaseConnection = async () => {
  const retryService = new RetryService({
    serviceName: 'Postgres',
    retries: MAX_RETRIES,
    delayMs: RETRY_DELAY_MS,
  });

  await retryService.execute(async () => {
    await pool.query('SELECT 1');

    logger.info('Database connection verified successfully.');
  });
};
