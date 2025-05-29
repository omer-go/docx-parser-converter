// test/unit/models/paragraph-models.test.ts
import { describe, it, expect } from 'vitest';
import {
  TextRunSchema,
  HyperlinkSchema,
  ImageDrawingSchema,
  ParagraphSchema,
  ParagraphContentElementSchema
} from '../../../src/models/paragraph-models';
import { RunPropertiesSchema, ParagraphPropertiesSchema } from '../../../src/models/styles-models';

describe('Paragraph and Content Models Schemas', () => {
  describe('TextRunSchema', () => {
    it('should validate a correct text run', () => {
      const data = { type: 'textRun' as const, text: 'Hello World', properties: { bold: true } };
      expect(TextRunSchema.safeParse(data).success).toBe(true);
    });
    it('should fail if text is missing', () => {
      const data = { type: 'textRun' as const, properties: { bold: true } };
      expect(TextRunSchema.safeParse(data).success).toBe(false);
    });
     it('should fail if type is incorrect', () => {
      const data = { type: 'wrongType' as const, text: 'Hello' };
      expect(TextRunSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('HyperlinkSchema', () => {
    it('should validate a correct hyperlink', () => {
      const data = {
        type: 'hyperlink' as const,
        url: 'https://example.com',
        children: [{ type: 'textRun' as const, text: 'Example' }],
        properties: { color: '0000FF' }
      };
      expect(HyperlinkSchema.safeParse(data).success).toBe(true);
    });
    it('should fail if URL is missing', () => {
      const data = { type: 'hyperlink' as const, children: [{ type: 'textRun' as const, text: 'Example' }] };
      expect(HyperlinkSchema.safeParse(data).success).toBe(false);
    });
    it('should fail if children are not valid TextRuns', () => {
      const data = { type: 'hyperlink' as const, url: 'https://example.com', children: [{ text: 'Invalid' }] };
      expect(HyperlinkSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('ImageDrawingSchema', () => {
    it('should validate a correct image drawing', () => {
      const data = {
        type: 'imageDrawing' as const,
        src: 'image.png',
        width: 914400, // 1 inch in EMU
        height: 914400,
        alt: 'An example image'
      };
      expect(ImageDrawingSchema.safeParse(data).success).toBe(true);
    });
    it('should fail if src is missing', () => {
      const data = { type: 'imageDrawing' as const, width: 100, height: 100 };
      expect(ImageDrawingSchema.safeParse(data).success).toBe(false);
    });
    it('should fail if width or height is negative', () => {
      const data = { type: 'imageDrawing' as const, src: 'img.png', width: -100, height: 100 };
      expect(ImageDrawingSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('ParagraphSchema', () => {
    it('should validate a correct paragraph with text runs', () => {
      const data = {
        type: 'paragraph' as const,
        children: [
          { type: 'textRun' as const, text: 'Hello ' },
          { type: 'textRun' as const, text: 'World', properties: { bold: true } }
        ],
        properties: { alignment: 'center' as const }
      };
      expect(ParagraphSchema.safeParse(data).success).toBe(true);
    });

    it('should validate a paragraph with mixed content', () => {
      const data = {
        type: 'paragraph' as const,
        children: [
          { type: 'textRun' as const, text: 'Click ' },
          { 
            type: 'hyperlink' as const, 
            url: 'https://example.com', 
            children: [{ type: 'textRun' as const, text: 'here' }] 
          },
          { type: 'textRun' as const, text: ' for an image: ' },
          { type: 'imageDrawing' as const, src: 'pic.jpg', width: 1000, height: 800}
        ]
      };
      expect(ParagraphSchema.safeParse(data).success).toBe(true);
      // Check if the union type is correctly parsing
      const parsed = ParagraphSchema.parse(data);
      expect(parsed.children[1].type).toBe('hyperlink');
      expect(parsed.children[3].type).toBe('imageDrawing');
    });

    it('should fail if children array contains invalid elements', () => {
      const data = { type: 'paragraph' as const, children: [{ type: 'invalidElement' }] };
      expect(ParagraphSchema.safeParse(data).success).toBe(false);
    });
    
    it('should allow empty children array', () => {
      const data = { type: 'paragraph' as const, children: [] };
      expect(ParagraphSchema.safeParse(data).success).toBe(true);
    });
  });
});
