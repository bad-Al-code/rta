import mongoose from 'mongoose';

import { RetryService } from '../utils';
import { env } from './env';
import { healthState } from './health-state';
import logger from './logger';

class MongoConnection {
  public async connect(): Promise<void> {
    const retryService = new RetryService({ serviceName: 'MongoDB' });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: %o`, { error: err });

      healthState.set('mongo', false, err.message);
    });

    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB connected successfully.`);

      healthState.set('mongo', true);
    });

    mongoose.connection.on('disconnected', () => {
      logger.info(`MongoDB disconnected.`);

      healthState.set('mongo', false, 'Disconnected');
    });

    try {
      await retryService.execute(() => mongoose.connect(env.MONGO_URL));
    } catch (error) {
      healthState.set('mongo', false, (error as Error).message);

      logger.error(`Could not connect to MongoDB after multiple retries.`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await mongoose.connection.close();
  }
}

export const mongoConnection = new MongoConnection();
