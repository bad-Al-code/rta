import { faker } from '@faker-js/faker';
import 'dotenv/config';

import logger from '../../config/logger';
import { Password } from '../../utils/password';
import { db, pool } from '../index';
import { projects, users } from '../schema';

const USERS_TO_CREATE = 30;
const MAX_PROJECTS_PER_USER = 5;

const seed = async () => {
  logger.info('Starting database seeding process...');

  try {
    logger.info('Clearing existing data...');
    await db.delete(projects);
    await db.delete(users);
    logger.info('Data cleared successfully.');

    logger.info(`Creating ${USERS_TO_CREATE} new users...`);

    for (let i = 0; i < USERS_TO_CREATE; i++) {
      const passwordHash = await Password.hash('password123');

      const [newUser] = await db
        .insert(users)
        .values({
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          passwordHash,
        })
        .returning({ id: users.id });

      logger.debug(`Created user ${newUser.id}`);

      const numProjects = faker.number.int({
        min: 1,
        max: MAX_PROJECTS_PER_USER,
      });
      const projectValues = [];
      for (let j = 0; j < numProjects; j++) {
        projectValues.push({
          name:
            faker.lorem
              .words(2)
              .split(' ')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ') + ' Site',
          userId: newUser.id,
        });
      }

      if (projectValues.length > 0) {
        await db.insert(projects).values(projectValues);

        logger.debug(`Created ${numProjects} projects for user ${newUser.id}`);
      }
    }

    logger.info('Seeding completed successfully!');
  } catch (error) {
    logger.error('An error occurred during the seeding process: %o', {
      error: (error as Error).message,
    });

    process.exit(1);
  } finally {
    await pool.end();

    logger.info('Database connection closed.');
  }
};

seed();
