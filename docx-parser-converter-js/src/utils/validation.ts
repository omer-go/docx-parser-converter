// src/utils/validation.ts
import { z } from 'zod';

/**
 * Utility to make all properties of a Zod schema optional.
 * Useful for partial updates or when properties are not always present.
 */
export function makeOptional<T extends z.ZodObject<any>>(schema: T): z.ZodObject<{[k in keyof T["shape"]]: z.ZodOptional<T["shape"][k]>}> {
  return schema.partial();
}

/**
 * Zod schema for non-negative integers.
 */
export const NonNegativeIntSchema = z.number().int().nonnegative();

/**
 * Zod schema for positive integers.
 */
export const PositiveIntSchema = z.number().int().positive();

/**
 *  Zod schema for strings that are not empty
 */
export const NotEmptyStringSchema = z.string().min(1);

// Add more validation utilities or custom Zod types as needed
