import 'dotenv/config';

import { pool } from '..';
import logger from '../../config/logger';
import { mongoConnection } from '../../config/mongo';
import { seedEvents } from './events';
import { seedUsersAndProjects } from './users';

const masterSeed = async () => {
  logger.info('Seeding Started...');
  try {
    await mongoConnection.connect();

    await seedUsersAndProjects();
    await seedEvents();

    logger.info('Seeding Completed.');
  } catch (error) {
    logger.error('Seeding failed: %o', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    process.exit(1);
  } finally {
    await pool.end();
    await mongoConnection.disconnect();
  }
};

masterSeed();
