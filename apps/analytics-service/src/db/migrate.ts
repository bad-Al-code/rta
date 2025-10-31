import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import dns from 'dns/promises';

import { db, pool } from '.';
import logger from '../config/logger';

const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wait for DNS to resolve before attempting database connection
 */
const waitForDNS = async (hostname: string): Promise<void> => {
  logger.info(`Waiting for DNS resolution of ${hostname}...`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await dns.lookup(hostname);
      logger.info(`DNS resolution successful for ${hostname}`);
      return;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (attempt < MAX_RETRIES) {
        logger.warn(
          `DNS lookup attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${RETRY_DELAY / 1000}s...`
        );
        await sleep(RETRY_DELAY);
      } else {
        logger.error(`DNS lookup failed after ${MAX_RETRIES} attempts`);
        throw error;
      }
    }
  }
};

const runMigrations = async () => {
  logger.info(`Running database migrations...`);

  // Extract hostname from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || '';
  const hostnameMatch = dbUrl.match(/@([^:]+):/);
  const hostname = hostnameMatch ? hostnameMatch[1] : 'postgres-service';

  // Wait for DNS first
  await waitForDNS(hostname);

  // Give a little extra time for the service to be fully ready
  await sleep(2000);

  // Now attempt migration with retries
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      await migrate(db, { migrationsFolder: 'src/db/migrations' });
      logger.info(`Migrations applied successfully!`);
      return;
    } catch (error) {
      const err = error as Error;
      retries++;

      // Check if it's a connection error
      if (
        err.message.includes('EAI_AGAIN') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('connection') ||
        err.message.includes('timeout')
      ) {
        if (retries < MAX_RETRIES) {
          logger.warn(
            `Migration attempt ${retries}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${RETRY_DELAY / 1000}s...`
          );
          await sleep(RETRY_DELAY);
          continue;
        }
      }

      // If it's a different error or max retries reached, fail
      logger.error('Error applying migrations: %o', { error: err });
      process.exit(1);
    }
  }

  logger.error(`Failed to apply migrations after ${MAX_RETRIES} attempts`);
  process.exit(1);
};

runMigrations();
