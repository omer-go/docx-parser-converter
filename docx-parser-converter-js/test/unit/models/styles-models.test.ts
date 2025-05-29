// test/unit/models/styles-models.test.ts
import { describe, it, expect } from 'vitest';
import {
  FontPropertiesSchema,
  SpacingPropertiesSchema,
  IndentationPropertiesSchema,
  ParagraphBordersSchema,
  IndividualBorderPropertiesSchema,
  ShadingPropertiesSchema,
  RunPropertiesSchema,
  ParagraphPropertiesSchema,
  StyleDefinitionSchema,
  AlignmentEnum,
  LineRuleEnum,
  UnderlineEnum,
  EmphasisMarkEnum,
  ScriptEnum,
  BorderStyleEnum,
  ShadingPatternEnum,
  StyleTypeEnum,
} from '../../../src/models/styles-models';

describe('Styles Models Schemas', () => {
  describe('FontPropertiesSchema', () => {
    it('should validate correct font properties', () => {
      const data = { name: 'Arial', size: 24, color: 'FF0000', bold: true };
      expect(FontPropertiesSchema.safeParse(data).success).toBe(true);
    });
    it('should fail on invalid size', () => {
      const data = { size: -10 };
      expect(FontPropertiesSchema.safeParse(data).success).toBe(false);
    });
    it('should allow optional fields to be absent', () => {
      expect(FontPropertiesSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('SpacingPropertiesSchema', () => {
    it('should validate correct spacing properties', () => {
      const data = { before: 100, after: 100, line: 240, lineRule: 'auto' as const };
      expect(SpacingPropertiesSchema.safeParse(data).success).toBe(true);
    });
    it('should fail on invalid lineRule', () => {
      const data = { lineRule: 'invalidValue' };
      expect(SpacingPropertiesSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('IndentationPropertiesSchema', () => {
    it('should validate correct indentation properties', () => {
      const data = { left: 720, firstLine: 360 };
      expect(IndentationPropertiesSchema.safeParse(data).success).toBe(true);
    });
  });
  
  describe('IndividualBorderPropertiesSchema', () => {
    it('should validate correct individual border properties', () => {
      const data = { type: 'single' as const, color: '000000', size: 4 };
      expect(IndividualBorderPropertiesSchema.safeParse(data).success).toBe(true);
    });
    it('should default type to none if not provided', () => {
      const result = IndividualBorderPropertiesSchema.parse({});
      expect(result.type).toBe('none');
    });
  });

  describe('ParagraphBordersSchema', () => {
    it('should validate correct paragraph borders', () => {
      const data = { top: { type: 'dashed' as const, color: 'auto', size: 8 } };
      expect(ParagraphBordersSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('ShadingPropertiesSchema', () => {
    it('should validate correct shading properties', () => {
      const data = { type: 'solid' as const, fill: 'FFFF00', color: '000000' };
      expect(ShadingPropertiesSchema.safeParse(data).success).toBe(true);
    });
     it('should default type to clear if not provided', () => {
      const result = ShadingPropertiesSchema.parse({});
      expect(result.type).toBe('clear');
    });
  });

  describe('RunPropertiesSchema', () => {
    it('should validate correct run properties (inherits FontProperties)', () => {
      const data = { name: 'Times New Roman', bold: true, language: 'en-GB' };
      expect(RunPropertiesSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('ParagraphPropertiesSchema', () => {
    it('should validate correct paragraph properties', () => {
      const data = {
        alignment: 'center' as const,
        spacing: { after: 200 },
        runProperties: { color: '333333' },
      };
      expect(ParagraphPropertiesSchema.safeParse(data).success).toBe(true);
    });
    it('should allow complex nested structures', () => {
        const data = {
            styleId: "MyStyle",
            indentation: { left: 100, right: 100, firstLine: 50 },
            spacing: { before: 60, after: 60, line: 240, lineRule: "auto" as const },
            alignment: "justify" as const,
            keepNext: true,
            tabs: [{ position: 720, type: "left" as const }],
            numbering: { instanceId: "numInst1", level: 0 }
        };
        expect(ParagraphPropertiesSchema.safeParse(data).success).toBe(true);
    });

    it('should validate correct numbering property', () => {
      const data = {
        numbering: { instanceId: 'numInst1', level: 0 }
      };
      expect(ParagraphPropertiesSchema.safeParse(data).success).toBe(true);
    });

    it('should fail for invalid numbering property', () => {
      const data = { numbering: { level: 0 } }; // Missing instanceId
      expect(ParagraphPropertiesSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('StyleDefinitionSchema', () => {
    it('should validate a correct paragraph style definition', () => {
      const data = {
        id: 'Heading1',
        name: 'Heading 1',
        type: 'paragraph' as const,
        basedOn: 'Normal',
        next: 'Normal',
        uiPriority: 1,
        isDefault: false,
        paragraphProperties: { alignment: 'center' as const, spacing: { before: 240 } },
        runProperties: { bold: true, size: 32 },
      };
      expect(StyleDefinitionSchema.safeParse(data).success).toBe(true);
    });
     it('should fail if id is missing', () => {
      const data = { name: 'Test Style', type: 'character' as const };
      expect(StyleDefinitionSchema.safeParse(data).success).toBe(false);
    });

    it('should validate a table style definition', () => {
      const data = {
        id: 'CustomTableStyle',
        name: 'Custom Table',
        type: 'table' as const,
        tableProperties: { alignment: 'center' as const, cellSpacing: 40 },
        // Optionally add tableRowProperties and tableCellProperties
        tableCellProperties: { verticalAlignment: 'center' as const, padding: { top: 20, bottom: 20 } }
      };
      expect(StyleDefinitionSchema.safeParse(data).success).toBe(true);
    });
  });

  // Test enums to ensure they are correctly defined
  it('should have correct AlignmentEnum values', () => {
    expect(AlignmentEnum.Values.left).toBe('left');
  });
   it('should have correct LineRuleEnum values', () => {
    expect(LineRuleEnum.Values.auto).toBe('auto');
  });
});
