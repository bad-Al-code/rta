import winston from 'winston';

import { getRequestContext } from '../middlewares';
import { env } from './env';

const contextFormat = winston.format((info) => {
  const requestContext = getRequestContext();
  if (requestContext) {
    info.correlationId = requestContext.correlationId;
  }
  return info;
});

const { combine, colorize, timestamp, splat, errors, printf, json } =
  winston.format;
const isDevelopment = env.NODE_ENV === 'development';

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment
    ? combine(
        contextFormat(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        splat(),
        errors({ stack: true }),
        printf(
          (info) =>
            `${info.timestamp} [${info.correlationId || 'NO-CTX'}] ${info.level}: ${info.message} ${
              info.stack ? `\n${info.stack}` : ''
            }`
        )
      )
    : combine(
        contextFormat(),
        timestamp(),
        splat(),
        errors({ stack: true }),
        json()
      ),
  transports: [new winston.transports.Console()],
});

export default logger;
