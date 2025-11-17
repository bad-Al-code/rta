import { faker } from '@faker-js/faker';
import 'dotenv/config';

import { db } from '..';
import logger from '../../config/logger';
import DeadLetterEvent from '../../models/dead-letter-event.model';
import AnalyticsEvent from '../../models/event.model';

const EVENTS_PER_PROJECT = 200;
const eventNames = ['pageview', 'click', 'form_submission', 'add_to_cart'];
const paths = [
  '/home',
  '/products',
  '/about',
  '/contact',
  '/products/a-cool-product',
];

export const seedEvents = async () => {
  logger.info('Seeding analytics events...');

  await AnalyticsEvent.deleteMany({});
  await DeadLetterEvent.deleteMany({});

  const allProjects = await db.query.projects.findMany();
  if (allProjects.length === 0) {
    logger.warn('No projects found in the database. Skipping event seeding.');

    return;
  }

  let totalEventsCreated = 0;
  for (const project of allProjects) {
    const events = [];
    for (let i = 0; i < EVENTS_PER_PROJECT; i++) {
      events.push({
        projectId: project.id,
        eventName: faker.helpers.arrayElement(eventNames),
        path: faker.helpers.arrayElement(paths),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        properties: {
          referrer: faker.internet.url(),
          productId: faker.string.uuid(),
        },

        createdAt: faker.date.recent({ days: 30 }),
      });
    }
    await AnalyticsEvent.insertMany(events);

    totalEventsCreated += events.length;
  }
  logger.info(
    `Seeded ${totalEventsCreated} events across ${allProjects.length} projects.`
  );
};
