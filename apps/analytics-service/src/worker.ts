import {
  BATCH_SIZE,
  BATCH_TIMEOUT_SECONDS,
  EVENT_QUEUE_KEY,
} from './config/constants';
import logger from './config/logger';
import { mongoConnection } from './config/mongo';
import { redisConnection } from './config/redis';
import { IAnalyticsEvent } from './models';
import AnalyticsEvent from './models/event.model';

const processQueue = async () => {
  logger.info(`Worker starting... Waiting for events.`);

  const redisClient = redisConnection.getClient();

  while (true) {
    try {
      const eventToProcess: IAnalyticsEvent[] = [];

      const results = await redisClient.lRange(
        EVENT_QUEUE_KEY,
        -BATCH_SIZE,
        -1
      );
      if (results.length === 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, BATCH_TIMEOUT_SECONDS * 1000)
        );
        continue;
      }

      for (const result of results) {
        try {
          const eventData = JSON.parse(result);
          eventToProcess.push(eventData);
        } catch (parseError) {
          logger.error(`Failed to parse event for Redis queue: %o`, {
            error: parseError,
            rawData: result,
          });
        }
      }

      if (eventToProcess.length > 0) {
        await AnalyticsEvent.insertMany(eventToProcess, { ordered: false });

        logger.info(
          `Successfully processed and inserted ${eventToProcess.length} events.`
        );

        await redisClient.lTrim(EVENT_QUEUE_KEY, 0, -results.length - 1);
      }
    } catch (error) {
      logger.error(`Error processing event queue: %o`, { error });

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

const initialize = async () => {
  try {
    await redisConnection.connect();
    await mongoConnection.connect();
    await processQueue();
  } catch (error) {
    logger.error(`Failed to initialze worker: %o`, { error });

    process.exit(1);
  }
};

initialize();
