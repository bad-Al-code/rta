import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { db } from '.';
import logger from '../config/logger';

const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runMigrations = async () => {
  logger.info(`Running database migrations...`);

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      await migrate(db, { migrationsFolder: 'src/db/migrations' });

      logger.info(`Migrations applied successfully!`);
      return;
    } catch (error) {
      const err = error as Error;
      retries++;

      if (
        err.message.includes('EAI_AGAIN') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNREFUSED')
      ) {
        if (retries < MAX_RETRIES) {
          logger.warn(
            `Migration attempt ${retries}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${RETRY_DELAY / 1000}s...`
          );

          await sleep(RETRY_DELAY);
          continue;
        }
      }

      logger.error('Error applying migrations: %o', { error });
      process.exit(1);
    }
  }

  logger.error(`Failed to apply migrations after ${MAX_RETRIES} attempts`);
  process.exit(1);
};

runMigrations();
