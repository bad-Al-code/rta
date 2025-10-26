import { createClient, RedisClientType } from 'redis';

import { RetryService } from '../utils';
import { env } from './env';
import logger from './logger';

class RedisConnection {
  private client!: RedisClientType;

  async connect(): Promise<void> {
    if (this.client?.isOpen) return;

    this.client = createClient({ url: env.REDIS_URL });

    this.client.on('error', (err) =>
      logger.error('Redis Client Error: %o', { error: err })
    );
    this.client.on('ready', () => logger.info('Redis connected successfully.'));

    const retryService = new RetryService({ serviceName: 'Redis' });
    await retryService.execute(async () => {
      await this.client.connect();
    });
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
