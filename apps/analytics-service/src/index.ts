import 'dotenv/config';

import { app } from './app';
import { env } from './config/env';
import logger from './config/logger';

const startServer = () => {
  app.listen(env.PORT, () => {
    logger.info(
      `Analytics service listening on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
  });
};

startServer();
