import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { db, pool } from '.';
import logger from '../config/logger';

const runMigrations = async () => {
  logger.info(`Running database migrations...`);

  try {
    await migrate(db, { migrationsFolder: 'src/db/migrations' });

    logger.info(`Migrations applied successfully!`);
  } catch (error) {
    logger.error('Error applying migrations: %o', {
      error,
    });

    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
