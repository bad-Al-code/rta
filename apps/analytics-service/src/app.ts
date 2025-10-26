import express, { json, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { NotFoundError } from './errors';
import { errorHandler, httpLogger, jsonParseErrorHandler } from './middlewares';
import { authRouter } from './routes';

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(json());
app.use(jsonParseErrorHandler);
app.use(httpLogger);

app.use('/api/v1/auth', authRouter);

app.get('/health', (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: 'UP', message: 'Analytics service is healthy' });
});

app.all('/*path', async (req, res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

export { app };
