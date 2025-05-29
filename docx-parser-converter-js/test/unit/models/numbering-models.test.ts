// test/unit/models/numbering-models.test.ts
import { describe, it, expect } from 'vitest';
import {
  NumberingLevelSchema,
  AbstractNumberingDefinitionSchema,
  NumberingInstanceSchema,
  NumberFormatEnum
} from '../../../src/models/numbering-models';

describe('Numbering Models Schemas', () => {
  describe('NumberingLevelSchema', () => {
    it('should validate a correct numbering level', () => {
      const data = {
        level: 0,
        start: 1,
        format: 'decimal' as const,
        levelText: '%1.',
        justification: 'left' as const,
        runProperties: { bold: true },
        paragraphProperties: { indentation: { left: 720, hanging: 360 } }
      };
      expect(NumberingLevelSchema.safeParse(data).success).toBe(true);
    });

    it('should default optional fields', () => {
      const data = { level: 0 };
      const parsed = NumberingLevelSchema.parse(data);
      expect(parsed.start).toBe(1);
      expect(parsed.format).toBe('decimal');
      expect(parsed.justification).toBe('left');
    });

    it('should fail if level is missing', () => {
      const data = { format: 'bullet' as const };
      expect(NumberingLevelSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('AbstractNumberingDefinitionSchema', () => {
    it('should validate a correct abstract numbering definition', () => {
      const data = {
        id: 'absNumId123',
        name: 'MyList',
        levels: [
          { level: 0, format: 'decimal' as const, levelText: '%1.' },
          { level: 1, format: 'lowerLetter' as const, levelText: '%2)' }
        ]
      };
      expect(AbstractNumberingDefinitionSchema.safeParse(data).success).toBe(true);
    });

    it('should fail if id is missing', () => {
      const data = { levels: [{ level: 0 }] };
      expect(AbstractNumberingDefinitionSchema.safeParse(data).success).toBe(false);
    });

    it('should fail if levels array is empty', () => {
      const data = { id: 'absNumId1', levels: [] };
      expect(AbstractNumberingDefinitionSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('NumberingInstanceSchema', () => {
    it('should validate a correct numbering instance', () => {
      const data = { instanceId: 'inst1', abstractNumId: 'absNumId123' };
      expect(NumberingInstanceSchema.safeParse(data).success).toBe(true);
    });
    it('should fail if instanceId or abstractNumId is missing', () => {
      expect(NumberingInstanceSchema.safeParse({ instanceId: 'inst1' }).success).toBe(false);
      expect(NumberingInstanceSchema.safeParse({ abstractNumId: 'abs1' }).success).toBe(false);
    });
  });
});
