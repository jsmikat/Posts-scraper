import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const requestSchema = z.object({
  keywords: z
    .array(z.string().trim().min(1, 'Keyword cannot be empty').max(100, 'Keyword too long'))
    .min(1, 'At least one keyword is required')
    .max(20, 'Maximum 20 keywords allowed'),
});

export type RequestBody = z.infer<typeof requestSchema>;

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.body = result.data;
    next();
  };
};
