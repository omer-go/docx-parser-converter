import { describe, expect, it } from 'vitest';
import {
  FontPropertiesModel,
  IndentationPropertiesModel,
  LanguagePropertiesModel,
  ParagraphStylePropertiesModel,
  RunStylePropertiesModel,
  SpacingPropertiesModel,
  StyleDefaultsModel,
  StyleModel,
  StylesSchemaModel,
  TabStopModel,
} from '../../../src/models/styles-models';

describe('Styles Models', () => {
  describe('SpacingPropertiesModel', () => {
    it('should create valid spacing properties', () => {
      const data = {
        before_pt: 12.0,
        after_pt: 6.0,
        line_pt: 18.0,
      };

      const spacing = SpacingPropertiesModel.create(data);
      expect(spacing.before_pt).toBe(12.0);
      expect(spacing.after_pt).toBe(6.0);
      expect(spacing.line_pt).toBe(18.0);
    });

    it('should handle null/undefined values', () => {
      const data = {
        before_pt: null,
        after_pt: undefined,
        line_pt: 15.0,
      };

      const spacing = SpacingPropertiesModel.create(data);
      expect(spacing.before_pt).toBeNull();
      expect(spacing.after_pt).toBeUndefined();
      expect(spacing.line_pt).toBe(15.0);
    });

    it('should handle empty object', () => {
      const spacing = SpacingPropertiesModel.create({});
      expect(spacing.before_pt).toBeUndefined();
      expect(spacing.after_pt).toBeUndefined();
      expect(spacing.line_pt).toBeUndefined();
    });
  });

  describe('IndentationPropertiesModel', () => {
    it('should create valid indentation properties', () => {
      const data = {
        left_pt: 36.0,
        right_pt: 0.0,
        firstline_pt: 18.0,
      };

      const indent = IndentationPropertiesModel.create(data);
      expect(indent.left_pt).toBe(36.0);
      expect(indent.right_pt).toBe(0.0);
      expect(indent.firstline_pt).toBe(18.0);
    });
  });

  describe('FontPropertiesModel', () => {
    it('should create valid font properties', () => {
      const data = {
        ascii: 'Calibri',
        hAnsi: 'Calibri',
        eastAsia: 'SimSun',
        cs: 'Times New Roman',
      };

      const font = FontPropertiesModel.create(data);
      expect(font.ascii).toBe('Calibri');
      expect(font.hAnsi).toBe('Calibri');
      expect(font.eastAsia).toBe('SimSun');
      expect(font.cs).toBe('Times New Roman');
    });
  });

  describe('LanguagePropertiesModel', () => {
    it('should create valid language properties', () => {
      const data = {
        val: 'en-US',
        eastAsia: 'zh-CN',
        bidi: 'ar-SA',
      };

      const lang = LanguagePropertiesModel.create(data);
      expect(lang.val).toBe('en-US');
      expect(lang.eastAsia).toBe('zh-CN');
      expect(lang.bidi).toBe('ar-SA');
    });
  });

  describe('TabStopModel', () => {
    it('should create valid tab stop', () => {
      const data = {
        val: 'left',
        pos: 72.0,
      };

      const tab = TabStopModel.create(data);
      expect(tab.val).toBe('left');
      expect(tab.pos).toBe(72.0);
    });

    it('should require val and pos fields', () => {
      expect(() => TabStopModel.create({})).toThrow();
      expect(() => TabStopModel.create({ val: 'left' })).toThrow();
      expect(() => TabStopModel.create({ pos: 72.0 })).toThrow();
    });
  });

  describe('ParagraphStylePropertiesModel', () => {
    it('should create complex paragraph style properties', () => {
      const data = {
        style_id: 'Heading1',
        spacing: {
          before_pt: 12.0,
          after_pt: 6.0,
          line_pt: 18.0,
        },
        indent: {
          left_pt: 0.0,
          right_pt: 0.0,
          firstline_pt: 0.0,
        },
        outline_level: 1,
        widow_control: true,
        justification: 'left',
        tabs: [
          { val: 'left', pos: 72.0 },
          { val: 'center', pos: 144.0 },
        ],
      };

      const props = ParagraphStylePropertiesModel.create(data);
      expect(props.style_id).toBe('Heading1');
      expect(props.spacing?.before_pt).toBe(12.0);
      expect(props.indent?.left_pt).toBe(0.0);
      expect(props.outline_level).toBe(1);
      expect(props.tabs).toHaveLength(2);
      expect(props.tabs?.[0]?.val).toBe('left');
    });
  });

  describe('RunStylePropertiesModel', () => {
    it('should create complex run style properties', () => {
      const data = {
        font: {
          ascii: 'Calibri',
          hAnsi: 'Calibri',
        },
        size_pt: 11.0,
        color: '000000',
        bold: true,
        italic: false,
        underline: 'single',
        lang: {
          val: 'en-US',
        },
        highlight: 'yellow',
      };

      const props = RunStylePropertiesModel.create(data);
      expect(props.font?.ascii).toBe('Calibri');
      expect(props.size_pt).toBe(11.0);
      expect(props.color).toBe('000000');
      expect(props.bold).toBe(true);
      expect(props.italic).toBe(false);
      expect(props.underline).toBe('single');
      expect(props.lang?.val).toBe('en-US');
      expect(props.highlight).toBe('yellow');
    });
  });

  describe('StyleModel', () => {
    it('should create valid style', () => {
      const data = {
        style_id: 'Heading1',
        name: 'Heading 1',
        based_on: 'Normal',
        paragraph_properties: {
          style_id: 'Heading1',
          outline_level: 1,
        },
        run_properties: {
          size_pt: 16.0,
          bold: true,
        },
      };

      const style = StyleModel.create(data);
      expect(style.style_id).toBe('Heading1');
      expect(style.name).toBe('Heading 1');
      expect(style.based_on).toBe('Normal');
      expect(style.paragraph_properties?.outline_level).toBe(1);
      expect(style.run_properties?.size_pt).toBe(16.0);
    });

    it('should require style_id and name', () => {
      expect(() => StyleModel.create({})).toThrow();
      expect(() => StyleModel.create({ style_id: 'test' })).toThrow();
      expect(() => StyleModel.create({ name: 'Test' })).toThrow();
    });
  });

  describe('StyleDefaultsModel', () => {
    it('should create valid style defaults', () => {
      const data = {
        paragraph: 'Normal',
        character: 'DefaultParagraphFont',
        numbering: 'NoList',
        table: 'TableNormal',
      };

      const defaults = StyleDefaultsModel.create(data);
      expect(defaults.paragraph).toBe('Normal');
      expect(defaults.character).toBe('DefaultParagraphFont');
      expect(defaults.numbering).toBe('NoList');
      expect(defaults.table).toBe('TableNormal');
    });
  });

  describe('StylesSchemaModel', () => {
    it('should create valid styles schema', () => {
      const data = {
        styles: [
          {
            style_id: 'Normal',
            name: 'Normal',
          },
          {
            style_id: 'Heading1',
            name: 'Heading 1',
            based_on: 'Normal',
          },
        ],
        style_type_defaults: {
          paragraph: 'Normal',
          character: 'DefaultParagraphFont',
        },
        doc_defaults_rpr: {
          font: {
            ascii: 'Calibri',
          },
          size_pt: 11.0,
        },
      };

      const schema = StylesSchemaModel.create(data);
      expect(schema.styles).toHaveLength(2);
      expect(schema.styles[0]?.style_id).toBe('Normal');
      expect(schema.styles[1]?.based_on).toBe('Normal');
      expect(schema.style_type_defaults.paragraph).toBe('Normal');
      expect(schema.doc_defaults_rpr?.font?.ascii).toBe('Calibri');
    });

    it('should require styles and style_type_defaults', () => {
      expect(() => StylesSchemaModel.create({})).toThrow();
      expect(() => StylesSchemaModel.create({ styles: [] })).toThrow();
    });
  });

  describe('Model validation', () => {
    it('should validate successfully for valid data', () => {
      const data = { before_pt: 12.0 };
      const result = SpacingPropertiesModel.validate(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.before_pt).toBe(12.0);
      }
    });

    it('should fail validation for invalid data', () => {
      const data = { before_pt: 'invalid' };
      const result = SpacingPropertiesModel.validate(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
