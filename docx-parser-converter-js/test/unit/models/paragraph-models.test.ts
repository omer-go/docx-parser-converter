import { describe, it, expect } from 'vitest';
import {
  ParagraphNumberingModel,
  RunContentModel,
  RunModel,
  ParagraphModel,
} from '../../../src/models/paragraph-models';
import { RunStylePropertiesModel } from '../../../src/models/styles-models';

describe('Paragraph Models', () => {
  describe('ParagraphNumberingModel', () => {
    it('should create valid paragraph numbering', () => {
      const data = {
        ilvl: 0,
        numId: 1,
      };

      const numbering = ParagraphNumberingModel.create(data);
      expect(numbering.ilvl).toBe(0);
      expect(numbering.numId).toBe(1);
    });

    it('should require ilvl and numId fields', () => {
      expect(() => ParagraphNumberingModel.create({})).toThrow();
      expect(() => ParagraphNumberingModel.create({ ilvl: 0 })).toThrow();
      expect(() => ParagraphNumberingModel.create({ numId: 1 })).toThrow();
    });

    it('should handle different level values', () => {
      const data = {
        ilvl: 2,
        numId: 5,
      };

      const numbering = ParagraphNumberingModel.create(data);
      expect(numbering.ilvl).toBe(2);
      expect(numbering.numId).toBe(5);
    });
  });

  describe('RunContentModel', () => {
    it('should create valid run content with text', () => {
      const data = {
        run: {
          text: 'Hello World',
        },
      };

      const content = RunContentModel.create(data);
      if ('text' in content.run) {
        expect(content.run.text).toBe('Hello World');
      }
    });

    it('should create valid run content with tab', () => {
      const data = {
        run: {
          type: 'tab',
        },
      };

      const content = RunContentModel.create(data);
      if ('type' in content.run) {
        expect(content.run.type).toBe('tab');
      }
    });

    it('should handle empty text', () => {
      const data = {
        run: {
          text: '',
        },
      };

      const content = RunContentModel.create(data);
      if ('text' in content.run) {
        expect(content.run.text).toBe('');
      }
    });

    it('should require run object', () => {
      expect(() => RunContentModel.create({})).toThrow();
    });
  });

  describe('RunStylePropertiesModel', () => {
    it('should create valid run properties', () => {
      const data = {
        font: {
          ascii: 'Calibri',
          hAnsi: 'Calibri',
        },
        size_pt: 12.0,
        bold: true,
        italic: false,
        color: '000000',
      };

      const props = RunStylePropertiesModel.create(data);
      expect(props.font?.ascii).toBe('Calibri');
      expect(props.size_pt).toBe(12.0);
      expect(props.bold).toBe(true);
      expect(props.italic).toBe(false);
      expect(props.color).toBe('000000');
    });

    it('should handle empty properties', () => {
      const props = RunStylePropertiesModel.create({});
      expect(props.font).toBeUndefined();
      expect(props.size_pt).toBeUndefined();
      expect(props.bold).toBeUndefined();
    });

    it('should handle null values', () => {
      const data = {
        bold: null,
        italic: null,
      };

      const props = RunStylePropertiesModel.create(data);
      expect(props.bold).toBeNull();
      expect(props.italic).toBeNull();
    });
  });

  describe('RunModel', () => {
    it('should create valid run', () => {
      const data = {
        properties: {
          bold: true,
          size_pt: 12.0,
        },
        contents: [
          {
            run: {
              text: 'Bold text',
            },
          },
        ],
      };

      const run = RunModel.create(data);
      expect(run.properties?.bold).toBe(true);
      expect(run.properties?.size_pt).toBe(12.0);
      expect(run.contents).toHaveLength(1);
      if (run.contents[0] && 'text' in run.contents[0].run) {
        expect(run.contents[0].run.text).toBe('Bold text');
      }
    });

    it('should handle run without properties', () => {
      const data = {
        contents: [
          {
            run: {
              text: 'Plain text',
            },
          },
        ],
      };

      const run = RunModel.create(data);
      expect(run.properties).toBeUndefined();
      expect(run.contents).toHaveLength(1);
      if (run.contents[0] && 'text' in run.contents[0].run) {
        expect(run.contents[0].run.text).toBe('Plain text');
      }
    });

    it('should require contents array', () => {
      expect(() => RunModel.create({})).toThrow();
      expect(() => RunModel.create({ properties: {} })).toThrow();
    });

    it('should handle multiple content items', () => {
      const data = {
        contents: [
          { run: { text: 'First' } },
          { run: { text: ' Second' } },
          { run: { text: ' Third' } },
        ],
      };

      const run = RunModel.create(data);
      expect(run.contents).toHaveLength(3);
      if (run.contents[0] && 'text' in run.contents[0].run) {
        expect(run.contents[0].run.text).toBe('First');
      }
      if (run.contents[1] && 'text' in run.contents[1].run) {
        expect(run.contents[1].run.text).toBe(' Second');
      }
      if (run.contents[2] && 'text' in run.contents[2].run) {
        expect(run.contents[2].run.text).toBe(' Third');
      }
    });
  });

  describe('ParagraphModel', () => {
    it('should create valid paragraph', () => {
      const data = {
        properties: {
          style_id: 'Heading1',
          spacing: {
            before_pt: 12.0,
            after_pt: 6.0,
          },
        },
        runs: [
          {
            properties: {
              bold: true,
            },
            contents: [
              {
                run: {
                  text: 'Heading Text',
                },
              },
            ],
          },
        ],
      };

      const paragraph = ParagraphModel.create(data);
      expect(paragraph.properties.style_id).toBe('Heading1');
      expect(paragraph.properties.spacing?.before_pt).toBe(12.0);
      expect(paragraph.runs).toHaveLength(1);
      expect(paragraph.runs[0]?.properties?.bold).toBe(true);
      if (paragraph.runs[0]?.contents[0] && 'text' in paragraph.runs[0].contents[0].run) {
        expect(paragraph.runs[0].contents[0].run.text).toBe('Heading Text');
      }
      expect(paragraph.numbering).toBeUndefined();
    });

    it('should handle paragraph with numbering', () => {
      const data = {
        properties: {
          style_id: 'ListParagraph',
        },
        runs: [
          {
            contents: [
              {
                run: {
                  text: 'List item',
                },
              },
            ],
          },
        ],
        numbering: {
          ilvl: 0,
          numId: 1,
        },
      };

      const paragraph = ParagraphModel.create(data);
      expect(paragraph.properties.style_id).toBe('ListParagraph');
      expect(paragraph.numbering?.ilvl).toBe(0);
      expect(paragraph.numbering?.numId).toBe(1);
    });

    it('should require properties and runs', () => {
      expect(() => ParagraphModel.create({})).toThrow();
      expect(() => ParagraphModel.create({ properties: {} })).toThrow();
      expect(() => ParagraphModel.create({ runs: [] })).toThrow();
    });

    it('should handle empty runs array', () => {
      const data = {
        properties: {
          style_id: 'Normal',
        },
        runs: [],
      };

      const paragraph = ParagraphModel.create(data);
      expect(paragraph.runs).toEqual([]);
    });
  });

  describe('Model validation edge cases', () => {
    it('should validate paragraph numbering correctly', () => {
      const result = ParagraphNumberingModel.validate({
        ilvl: 0,
        numId: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ilvl).toBe(0);
        expect(result.data.numId).toBe(1);
      }
    });

    it('should fail validation for invalid numbering', () => {
      const result = ParagraphNumberingModel.validate({
        ilvl: 'invalid',
        numId: 1,
      });

      expect(result.success).toBe(false);
    });
  });
});
