import winston from 'winston';

import { env } from './env';

const { combine, colorize, timestamp, splat, errors, printf, json } =
  winston.format;
const isDevelopment = env.NODE_ENV === 'development';

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment
    ? combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        splat(),
        errors({ stack: true }),
        printf(
          (info) =>
            `${info.timestamp} ${info.level}: ${info.message} ${
              info.stack ? `\n${info.stack}` : ''
            }`
        )
      )
    : combine(timestamp(), splat(), errors({ stack: true }), json()),
  transports: [new winston.transports.Console()],
});

export default logger;
