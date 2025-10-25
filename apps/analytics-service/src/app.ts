import express, { Request, Response, json } from 'express';

import { NotFoundError } from './errors';
import { errorHandler, httpLogger } from './middlewares';

const app = express();
app.use(json());
app.use(httpLogger);

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
