/**
 * Validation Schemas
 * Backend validation with Zod for all API inputs
 * Prevents attacks and invalid data
 */

import { z } from 'zod';

// Generation Request Schema
export const generationRequestSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt no puede estar vacío')
    .max(2000, 'Prompt demasiado largo (máximo 2000 caracteres)')
    .trim(),
  style: z.string()
    .optional()
    .default('pop')
    .refine(val => val && val.length >= 2 && val.length <= 200, {
      message: 'Estilo debe tener entre 2 y 200 caracteres'
    }),
  duration: z.number()
    .int()
    .min(5, 'Duración mínima: 5 segundos')
    .max(600, 'Duración máxima: 600 segundos (10 minutos)')
    .optional()
    .default(60),
  quality: z.enum(['standard', 'premium', 'ultra'])
    .optional()
    .default('standard'),
  customMode: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

// Generation Status Schema
export const generationStatusSchema = z.object({
  generationId: z.string().uuid('Generation ID inválido'),
});

// Feedback Schema
export const feedbackSchema = z.object({
  generationId: z.string().uuid('Generation ID inválido'),
  rating: z.number()
    .int()
    .min(1, 'Rating mínimo: 1')
    .max(5, 'Rating máximo: 5'),
  feedback: z.string()
    .max(1000, 'Feedback demasiado largo (máximo 1000 caracteres)')
    .optional(),
});

// Token Add Schema
export const tokenAddSchema = z.object({
  token: z.string()
    .min(20, 'Token inválido (muy corto)')
    .max(500, 'Token inválido (muy largo)'),
  label: z.string()
    .max(100, 'Label demasiado largo')
    .optional(),
  email: z.string()
    .email('Email inválido')
    .optional(),
  source: z.string()
    .optional()
    .default('extension'),
});

// Helper function to validate request body
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Invalid input', errors);
  }

  return result.data;
}

// Custom error for validation
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

