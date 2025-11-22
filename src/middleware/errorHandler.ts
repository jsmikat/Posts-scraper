import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../types';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const response: ApiError = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};
