import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let errors: any[] = [];

  // Zod 验证错误
  if (err instanceof ZodError) {
    statusCode = 400;
    message = '请求参数验证失败';
    errors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
  }
  // 自定义应用错误
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // 其他错误
  else {
    logger.error('未处理的错误:', err);
    if (process.env.NODE_ENV === 'development') {
      message = err.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
