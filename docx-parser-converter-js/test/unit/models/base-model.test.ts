import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  BaseModel,
  createModel,
  ModelValidationError,
  optionalWithDefault,
  nullableOptional,
} from '../../../src/models/base-model';

describe('Base Model System', () => {
  describe('ModelValidationError', () => {
    it('should create error with message', () => {
      const error = new ModelValidationError('Test error');
      expect(error.name).toBe('ModelValidationError');
      expect(error.message).toBe('Test error');
      expect(error.zodError).toBeUndefined();
    });

    it('should create error with Zod error', () => {
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });

      if (!result.success) {
        const error = new ModelValidationError('Validation failed', result.error);
        expect(error.zodError).toBeDefined();
        expect(error.zodError?.issues).toHaveLength(1);
      }
    });
  });

  describe('createModel', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number().optional(),
      active: z.boolean().default(true),
    });

    const TestModel = createModel(testSchema);

    it('should create model with valid data', () => {
      const data = { name: 'John', age: 30, active: true };
      const result = TestModel.create(data);

      expect(result).toEqual(data);
    });

    it('should create model with partial data', () => {
      const data = { name: 'Jane', active: true };
      const result = TestModel.create(data);

      expect(result.name).toBe('Jane');
      expect(result.active).toBe(true);
    });

    it('should throw validation error for invalid data', () => {
      const invalidData = { name: 123, age: 'invalid' };

      expect(() => TestModel.create(invalidData)).toThrow(ModelValidationError);
    });

    it('should construct model without validation', () => {
      const data = { name: 'Bob', age: 25, active: false };
      const result = TestModel.construct(data);

      expect(result).toEqual(data);
    });

    it('should validate data and return success result', () => {
      const data = { name: 'Alice', age: 28 };
      const result = TestModel.validate(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.age).toBe(28);
      }
    });

    it('should validate data and return error result', () => {
      const invalidData = { name: 123 };
      const result = TestModel.validate(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues).toHaveLength(1);
      }
    });

    it('should expose schema property', () => {
      expect(TestModel.schema).toBe(testSchema);
    });
  });

  describe('Utility functions', () => {
    describe('optionalWithDefault', () => {
      it('should use default value for undefined', () => {
        const schema = z.object({
          value: optionalWithDefault('default'),
        });

        const result = schema.parse({ value: undefined });
        expect(result.value).toBe('default');
      });

      it('should use default value for missing field', () => {
        const schema = z.object({
          value: optionalWithDefault('default'),
        });

        const result = schema.parse({});
        expect(result.value).toBe('default');
      });

      it('should use provided value when present', () => {
        const schema = z.object({
          value: optionalWithDefault('default'),
        });

        const result = schema.parse({ value: 'provided' });
        expect(result.value).toBe('provided');
      });
    });

    describe('nullableOptional', () => {
      it('should accept string value', () => {
        const schema = z.object({
          value: nullableOptional(z.string()),
        });

        const result = schema.parse({ value: 'test' });
        expect(result.value).toBe('test');
      });

      it('should accept null value', () => {
        const schema = z.object({
          value: nullableOptional(z.string()),
        });

        const result = schema.parse({ value: null });
        expect(result.value).toBeNull();
      });

      it('should accept undefined value', () => {
        const schema = z.object({
          value: nullableOptional(z.string()),
        });

        const result = schema.parse({ value: undefined });
        expect(result.value).toBeUndefined();
      });

      it('should accept missing field', () => {
        const schema = z.object({
          value: nullableOptional(z.string()),
        });

        const result = schema.parse({});
        expect(result.value).toBeUndefined();
      });
    });
  });

  describe('BaseModel interface', () => {
    it('should allow string keys with unknown values', () => {
      const model: BaseModel = {
        name: 'test',
        age: 30,
        active: true,
        settings: { theme: 'dark' },
        tags: ['typescript', 'zod'],
      };

      expect(model.name).toBe('test');
      expect(model.age).toBe(30);
      expect(model.active).toBe(true);
      expect(model.settings).toEqual({ theme: 'dark' });
      expect(model.tags).toEqual(['typescript', 'zod']);
    });
  });
});
