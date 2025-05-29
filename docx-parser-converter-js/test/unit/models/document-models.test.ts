// test/unit/models/document-models.test.ts
import { describe, it, expect } from 'vitest';
import {
  PageMarginsSchema,
  PageSizeSchema,
  SectionPropertiesSchema,
  DocumentSettingsSchema,
  DocumentModelSchema,
  HeaderFooterContentSchema
} from '../../../src/models/document-models';
import { ParagraphSchema, TextRunSchema } from '../../../src/models/paragraph-models'; // For body content

describe('Document Structure Models Schemas', () => {
  describe('PageMarginsSchema', () => {
    it('should validate correct page margins', () => {
      const data = { top: 1440, bottom: 1440, left: 1800, right: 1800 }; // 1 inch, 1.25 inches
      expect(PageMarginsSchema.safeParse(data).success).toBe(true);
    });
    it('should fail for negative margins', () => {
      const data = { top: -100 };
      expect(PageMarginsSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('PageSizeSchema', () => {
    it('should validate correct page size', () => {
      const data = { width: 12240, height: 15840, orientation: 'portrait' as const }; // A4 size
      expect(PageSizeSchema.safeParse(data).success).toBe(true);
    });
    it('should default orientation to portrait', () => {
        const data = { width: 12240, height: 15840 };
        const parsed = PageSizeSchema.parse(data);
        expect(parsed.orientation).toBe('portrait');
    });
    it('should fail if width or height are missing or invalid', () => {
      expect(PageSizeSchema.safeParse({ width: 12240 }).success).toBe(false);
      expect(PageSizeSchema.safeParse({ height: 15840 }).success).toBe(false);
      expect(PageSizeSchema.safeParse({ width: -100, height: 15840 }).success).toBe(false);
    });
  });
  
  describe('HeaderFooterContentSchema', () => {
    it('should validate header/footer content with paragraphs and tables', () => {
      const data = { 
        children: [
          { type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Header text' }] },
          { 
            type: 'table' as const, 
            children: [ /* ... basic table structure ... */ ] 
          }
        ]
      };
      // Ensure you have a minimal valid table structure for the test
      // For example, from a previous test:
      const tableCell = { type: 'tableCell' as const, children: [{ type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Cell' }] }] };
      const tableRow = { type: 'tableRow' as const, children: [tableCell] };
      // @ts-ignore 
      data.children[1] = { type: 'table' as const, children: [tableRow] };

      expect(HeaderFooterContentSchema.safeParse(data).success).toBe(true);
    });

    it('should fail if children contains invalid elements', () => {
      const data = { children: [{ type: 'invalidType' as const }] };
      expect(HeaderFooterContentSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('SectionPropertiesSchema', () => {
    it('should validate correct section properties', () => {
      const data = {
        pageSize: { width: 12240, height: 15840 },
        pageMargins: { top: 1440 }
      };
      expect(SectionPropertiesSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('DocumentSettingsSchema', () => {
    it('should validate correct document settings', () => {
      const data = { defaultLanguage: 'fr-CA', updateFieldsOnOpen: true, defaultTabStop: 360 };
      expect(DocumentSettingsSchema.safeParse(data).success).toBe(true);
    });
     it('should default language and updateFields', () => {
        const parsed = DocumentSettingsSchema.parse({});
        expect(parsed.defaultLanguage).toBe('en-US');
        expect(parsed.updateFieldsOnOpen).toBe(false);
    });
  });

  describe('DocumentModelSchema', () => {
    it('should validate a minimal correct document model', () => {
      const data = {
        body: [
          { 
            type: 'paragraph' as const, 
            children: [{ type: 'textRun' as const, text: 'Document content.' }] 
          }
        ]
      };
      expect(DocumentModelSchema.safeParse(data).success).toBe(true);
    });

    it('should validate a document model with properties and settings', () => {
      const data = {
        properties: {
          pageSize: { width: 12240, height: 15840 }
        },
        settings: {
          defaultLanguage: 'de-DE'
        },
        styles: [
          { id: 'Normal', type: 'paragraph' as const, name: 'Normal' }
        ],
        body: [
          { 
            type: 'paragraph' as const, 
            children: [{ type: 'textRun' as const, text: 'Ein Dokument.' }],
            properties: { styleId: 'Normal' }
          }
        ],
        title: 'Test Document',
        createdAt: new Date()
      };
      expect(DocumentModelSchema.safeParse(data).success).toBe(true);
    });
    
    it('should fail if body is missing', () => {
        const data = {};
        expect(DocumentModelSchema.safeParse(data).success).toBe(false);
    });

    it('should default styles and numbering to empty arrays', () => {
        const data = { body: [] };
        const parsed = DocumentModelSchema.parse(data);
        expect(parsed.styles).toEqual([]);
        // expect(parsed.numberingDefinitions).toEqual([]); // Will test when numbering is added
    });

    it('should validate a document body with a paragraph and a table', () => {
      const data = {
        body: [
          { type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Some text.' }] },
          { 
            type: 'table' as const, 
            children: [
              { 
                type: 'tableRow' as const, 
                children: [
                  { 
                    type: 'tableCell' as const, 
                    children: [{ type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Cell A1' }] }] 
                  }
                ] 
              }
            ] 
          }
        ]
      };
      const result = DocumentModelSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body[0].type).toBe('paragraph');
        expect(result.data.body[1].type).toBe('table');
      }
    });
  });
});
