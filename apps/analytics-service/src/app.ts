import cookieParser from 'cookie-parser';
import express, { Application, json } from 'express';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { NotFoundError } from './errors';
import {
  correlationIdMiddleware,
  errorHandler,
  httpLogger,
  jsonParseErrorHandler,
  metricsRecorder,
} from './middlewares';
import {
  authRouter,
  healthRouter,
  metricsRouter,
  projectRouter,
  trackRouter,
  userRouter,
} from './routes';

const app: Application = express();

app.use(correlationIdMiddleware);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(json());
app.use(jsonParseErrorHandler);
app.use(httpLogger);
app.use(cookieParser(env.COOKIE_PARSER_SECRET));
app.use(metricsRecorder);

app.use('/api/v1', healthRouter);
app.use('/api/v1', metricsRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/track', trackRouter);

app.all('/*path', async (req, res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

export { app };
