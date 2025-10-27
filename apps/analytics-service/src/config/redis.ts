import { createClient, RedisClientType } from 'redis';

import { RetryService } from '../utils';
import { env } from './env';
import { healthState } from './health-state';
import logger from './logger';

class RedisConnection {
  private client!: RedisClientType;

  async connect(): Promise<void> {
    if (this.client?.isOpen) return;

    this.client = createClient({ url: env.REDIS_URL });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error: %o', { error: err });

      healthState.set('redis', false, (err as Error).message);
    });

    this.client.on('ready', () => {
      logger.info('Redis connected successfully.');

      healthState.set('redis', true);
    });

    const retryService = new RetryService({ serviceName: 'Redis' });

    try {
      await retryService.execute(async () => {
        await this.client.connect();
      });
    } catch (error) {
      healthState.set('redis', false, (error as Error).message);

      logger.error('Could not connect to Redis after multiple retries.');

      throw error;
    }
  }

  getClient(): RedisClientType {
    if (!this.client)
      throw new Error('Redis client not available. Call connect() first.');

    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis client disconnected.');
    }
  }
}

export const redisConnection = new RedisConnection();
