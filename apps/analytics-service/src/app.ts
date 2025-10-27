import express, { Application, json } from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { NotFoundError } from './errors';
import { errorHandler, httpLogger, jsonParseErrorHandler } from './middlewares';
import { authRouter, healthRouter } from './routes';

const app: Application = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(json());
app.use(jsonParseErrorHandler);
app.use(httpLogger);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', healthRouter);

app.all('/*path', async (req, res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

export { app };
