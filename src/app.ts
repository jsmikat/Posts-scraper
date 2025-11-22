import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { crawlPosts } from './controllers/crawlController';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestSchema, validateRequest } from './middleware/validation';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, _res: Response, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

app.post('/api/crawl', validateRequest(requestSchema), crawlPosts);

app.use(errorHandler);
app.use(notFoundHandler);

const startServer = () => {
  try {
    app.listen(process.env.PORT, () => {
      logger.info(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
