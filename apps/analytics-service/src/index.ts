import 'dotenv/config';
import express, { type Request, type Response } from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/health', (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: 'UP', message: 'Analytics service is healthy.' });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Analytics service listening on port ${PORT}`);
  });
};

startServer();
