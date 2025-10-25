import 'dotenv/config';

import { app } from './app';
import { env } from './config/env';
import logger from './config/logger';
import { redisConnection } from './config/redis';
import { checkDatabaseConnection } from './db';

const startServer = async () => {
  try {
    await checkDatabaseConnection();
    await redisConnection.connect();

    app.listen(env.PORT, () => {
      logger.info(
        `Analytics service listening on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
    });
  } catch (error) {
    logger.error('Failed to start the server: %o', { error });
    process.exit(1);
  }
};

startServer();
