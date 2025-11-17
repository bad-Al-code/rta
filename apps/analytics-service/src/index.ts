import 'dotenv/config';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';

import { app } from './app';
import { env } from './config/env';
import logger from './config/logger';
import { mongoConnection } from './config/mongo';
import { redisConnection } from './config/redis';
import { checkDatabaseConnection } from './db';
import { initializeRateLimiter } from './middlewares';

const numCPUs = availableParallelism();

const startServer = async () => {
  try {
    await Promise.all([
      checkDatabaseConnection(),
      redisConnection.connect(),
      mongoConnection.connect(),
    ]);

    initializeRateLimiter();

    app.listen(env.PORT, () => {
      logger.info(
        `Worker ${process.pid} - Analytics service listening on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
    });
  } catch (error) {
    logger.error('Failed to start the server: %o', { error });
    process.exit(1);
  }
};

if (env.NODE_ENV === 'production' && cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} is running`);
  logger.info(`Forking server for ${numCPUs} CPUs`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`
    );
    logger.info('Starting a new worker...');
    cluster.fork();
  });
} else {
  startServer();
}
