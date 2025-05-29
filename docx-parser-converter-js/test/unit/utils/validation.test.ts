// test/unit/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { makeOptional, NonNegativeIntSchema, PositiveIntSchema, NotEmptyStringSchema } from '../../../src/utils/validation';

describe('Validation Utilities', () => {
  describe('makeOptional', () => {
    const MySchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const OptionalMySchema = makeOptional(MySchema);

    it('should make all fields optional', () => {
      const result = OptionalMySchema.safeParse({});
      expect(result.success).toBe(true);
      // @ts-expect-error this is a valid test
      expect(result.data?.name).toBeUndefined();
      // @ts-expect-error this is a valid test
      expect(result.data?.age).toBeUndefined();
    });

    it('should still validate fields if present', () => {
      const result = OptionalMySchema.safeParse({ name: 'Test', age: 30 });
      expect(result.success).toBe(true);
      // @ts-expect-error this is a valid test
      expect(result.data?.name).toBe('Test');
      // @ts-expect-error this is a valid test
      expect(result.data?.age).toBe(30);
    });
  });

  describe('NonNegativeIntSchema', () => {
    it('should pass for zero', () => {
      expect(NonNegativeIntSchema.safeParse(0).success).toBe(true);
    });
    it('should pass for positive integers', () => {
      expect(NonNegativeIntSchema.safeParse(10).success).toBe(true);
    });
    it('should fail for negative integers', () => {
      expect(NonNegativeIntSchema.safeParse(-1).success).toBe(false);
    });
    it('should fail for non-integers', () => {
      expect(NonNegativeIntSchema.safeParse(1.5).success).toBe(false);
    });
  });
  
  describe('PositiveIntSchema', () => {
    it('should fail for zero', () => {
      expect(PositiveIntSchema.safeParse(0).success).toBe(false);
    });
    it('should pass for positive integers', () => {
      expect(PositiveIntSchema.safeParse(10).success).toBe(true);
    });
    it('should fail for negative integers', () => {
      expect(PositiveIntSchema.safeParse(-1).success).toBe(false);
    });
    it('should fail for non-integers', () => {
      expect(PositiveIntSchema.safeParse(1.5).success).toBe(false);
    });
  });

  describe('NotEmptyStringSchema', () => {
    it('should pass for non-empty strings', () => {
      expect(NotEmptyStringSchema.safeParse('hello').success).toBe(true);
    });
    it('should fail for empty strings', () => {
      expect(NotEmptyStringSchema.safeParse('').success).toBe(false);
    });
     it('should fail for non-string types', () => {
      expect(NotEmptyStringSchema.safeParse(123).success).toBe(false);
    });
  });
});
