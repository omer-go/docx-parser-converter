import { describe, it, expect } from 'vitest';
import {
  NumberingLevelModel,
  NumberingInstanceModel,
  NumberingSchemaModel,
} from '../../../src/models/numbering-models';

describe('Numbering Models', () => {
  describe('NumberingLevelModel', () => {
    it('should create valid numbering level', () => {
      const data = {
        numId: 1,
        ilvl: 0,
        start: 1,
        numFmt: 'decimal',
        lvlText: '%1.',
        lvlJc: 'left',
      };

      const level = NumberingLevelModel.create(data);
      expect(level.numId).toBe(1);
      expect(level.ilvl).toBe(0);
      expect(level.start).toBe(1);
      expect(level.numFmt).toBe('decimal');
      expect(level.lvlText).toBe('%1.');
      expect(level.lvlJc).toBe('left');
    });

    it('should handle optional properties', () => {
      const data = {
        numId: 2,
        ilvl: 1,
        start: 1,
        numFmt: 'bullet',
        lvlText: '•',
        lvlJc: 'left',
        counter: 5,
        tab_pt: 36.0,
        indent: {
          left_pt: 72.0,
          firstline_pt: -18.0,
        },
        fonts: {
          ascii: 'Symbol',
        },
      };

      const level = NumberingLevelModel.create(data);
      expect(level.counter).toBe(5);
      expect(level.tab_pt).toBe(36.0);
      expect(level.indent?.left_pt).toBe(72.0);
      expect(level.fonts?.ascii).toBe('Symbol');
    });

    it('should require all mandatory fields', () => {
      expect(() => NumberingLevelModel.create({})).toThrow();
      expect(() => NumberingLevelModel.create({ numId: 1 })).toThrow();
      expect(() => NumberingLevelModel.create({ numId: 1, ilvl: 0 })).toThrow();
    });
  });

  describe('NumberingInstanceModel', () => {
    it('should create valid numbering instance', () => {
      const data = {
        numId: 1,
        abstractNumId: 0,
      };

      const instance = NumberingInstanceModel.create(data);
      expect(instance.numId).toBe(1);
      expect(instance.abstractNumId).toBe(0);
    });

    it('should require numId and abstractNumId', () => {
      expect(() => NumberingInstanceModel.create({})).toThrow();
      expect(() => NumberingInstanceModel.create({ numId: 1 })).toThrow();
      expect(() => NumberingInstanceModel.create({ abstractNumId: 0 })).toThrow();
    });
  });

  describe('NumberingSchemaModel', () => {
    it('should create valid numbering schema', () => {
      const data = {
        levels: [
          {
            numId: 1,
            ilvl: 0,
            start: 1,
            numFmt: 'decimal',
            lvlText: '%1.',
            lvlJc: 'left',
          },
        ],
        instances: [
          {
            numId: 1,
            abstractNumId: 0,
          },
        ],
      };

      const schema = NumberingSchemaModel.create(data);
      expect(schema.levels).toHaveLength(1);
      expect(schema.instances).toHaveLength(1);
      expect(schema.levels[0]?.numId).toBe(1);
      expect(schema.instances[0]?.numId).toBe(1);
    });

    it('should handle empty arrays', () => {
      const data = {
        levels: [],
        instances: [],
      };

      const schema = NumberingSchemaModel.create(data);
      expect(schema.levels).toEqual([]);
      expect(schema.instances).toEqual([]);
    });

    it('should require levels and instances arrays', () => {
      expect(() => NumberingSchemaModel.create({})).toThrow();
      expect(() => NumberingSchemaModel.create({ levels: [] })).toThrow();
      expect(() => NumberingSchemaModel.create({ instances: [] })).toThrow();
    });
  });

  describe('Model validation edge cases', () => {
    it('should validate numbering level with all properties', () => {
      const result = NumberingLevelModel.validate({
        numId: 1,
        ilvl: 0,
        start: 1,
        numFmt: 'decimal',
        lvlText: '%1.',
        lvlJc: 'left',
        counter: 1,
        tab_pt: 36.0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numId).toBe(1);
        expect(result.data.counter).toBe(1);
      }
    });

    it('should fail validation for invalid level data', () => {
      const result = NumberingLevelModel.validate({
        numId: 'invalid',
        ilvl: 0,
      });

      expect(result.success).toBe(false);
    });
  });
});
