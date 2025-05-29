import { z } from 'zod';

/**
 * Base validation error for model validation failures
 */
export class ModelValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: z.ZodError
  ) {
    super(message);
    this.name = 'ModelValidationError';
  }
}

/**
 * Base model interface - all models should extend this
 */
export interface BaseModel {
  [key: string]: unknown;
}

/**
 * Utility function to create a model constructor with validation
 */
export function createModel<T extends BaseModel>(schema: z.ZodSchema<T>) {
  return {
    schema,
    /**
     * Create a new instance with validation
     */
    create: (data: unknown): T => {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new ModelValidationError(
          `Model validation failed: ${result.error.message}`,
          result.error
        );
      }
      return result.data;
    },
    /**
     * Create instance without validation (for trusted data)
     */
    construct: (data: T): T => {
      return data;
    },
    /**
     * Validate data without creating instance
     */
    validate: (
      data: unknown
    ): { success: true; data: T } | { success: false; error: z.ZodError } => {
      const result = schema.safeParse(data);
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error };
    },
  };
}

/**
 * Utility for optional field with default value
 */
export const optionalWithDefault = <T>(defaultValue: T) =>
  z.optional(z.any()).transform(val => val ?? defaultValue);

/**
 * Utility for nullable optional field
 */
export const nullableOptional = <T>(schema: z.ZodSchema<T>) => schema.nullable().optional();
