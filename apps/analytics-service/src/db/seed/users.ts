import { faker } from '@faker-js/faker';
import 'dotenv/config';

import { db } from '..';
import logger from '../../config/logger';
import { Password } from '../../utils';
import { projects, users } from '../schema';

const USERS_TO_CREATE = 10;
const MAX_PROJECTS_PER_USER = 3;

export const seedUsersAndProjects = async () => {
  logger.info('Seeding users and projects...');

  await db.delete(projects);
  await db.delete(users);

  const createdUsers = [];
  for (let i = 0; i < USERS_TO_CREATE; i++) {
    const passwordHash = await Password.hash('password123');
    const newUser = await db
      .insert(users)
      .values({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash,
      })
      .returning();
    createdUsers.push(newUser[0]);

    const numProjects = faker.number.int({
      min: 1,
      max: MAX_PROJECTS_PER_USER,
    });
    const projectValues = [];

    for (let j = 0; j < numProjects; j++) {
      projectValues.push({
        name: faker.company.name() + ' Site',
        userId: newUser[0].id,
      });
    }
    if (projectValues.length > 0) {
      await db.insert(projects).values(projectValues);
    }
  }

  logger.info(`Seeded ${createdUsers.length} users and their projects.`);
};
