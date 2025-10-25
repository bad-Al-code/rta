import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { MAX_RETRIES, RETRY_DELAY_MS } from '../config/constants';
import { env } from '../config/env';
import logger from '../config/logger';
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
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await pool.query('SELECT 1');

      logger.info(`Database connection verified successfully.`);
      return;
    } catch (err) {
      const error = err as Error;
      retries++;

      logger.error(
        `Failed to verify database connection. Retrying in ${
          RETRY_DELAY_MS / 1000
        }s...: %o`,
        { error: error.message, attempt: retries }
      );

      if (retries >= MAX_RETRIES) {
        logger.error('Max retries reached. Could not connect to database.');

        throw error;
      }

      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    }
  }
};
