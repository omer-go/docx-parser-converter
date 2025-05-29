import { describe, it, expect } from 'vitest';
import { DocMarginsModel, DocumentSchemaModel } from '../../../src/models/document-models';

describe('Document Models', () => {
  describe('DocMarginsModel', () => {
    it('should create valid document margins', () => {
      const data = {
        top_pt: 72.0,
        right_pt: 72.0,
        bottom_pt: 72.0,
        left_pt: 72.0,
        header_pt: 36.0,
        footer_pt: 36.0,
        gutter_pt: 0.0,
      };

      const margins = DocMarginsModel.create(data);
      expect(margins.top_pt).toBe(72.0);
      expect(margins.right_pt).toBe(72.0);
      expect(margins.bottom_pt).toBe(72.0);
      expect(margins.left_pt).toBe(72.0);
      expect(margins.header_pt).toBe(36.0);
      expect(margins.footer_pt).toBe(36.0);
      expect(margins.gutter_pt).toBe(0.0);
    });

    it('should handle null/undefined values', () => {
      const data = {
        top_pt: null,
        right_pt: undefined,
        bottom_pt: 72.0,
      };

      const margins = DocMarginsModel.create(data);
      expect(margins.top_pt).toBeNull();
      expect(margins.right_pt).toBeUndefined();
      expect(margins.bottom_pt).toBe(72.0);
    });

    it('should handle empty object', () => {
      const margins = DocMarginsModel.create({});
      expect(margins.top_pt).toBeUndefined();
      expect(margins.right_pt).toBeUndefined();
      expect(margins.bottom_pt).toBeUndefined();
      expect(margins.left_pt).toBeUndefined();
    });
  });

  describe('DocumentSchemaModel', () => {
    it('should create valid document schema', () => {
      const data = {
        elements: [],
        doc_margins: {
          top_pt: 72.0,
          right_pt: 72.0,
          bottom_pt: 72.0,
          left_pt: 72.0,
        },
      };

      const doc = DocumentSchemaModel.create(data);
      expect(doc.elements).toEqual([]);
      expect(doc.doc_margins?.top_pt).toBe(72.0);
    });

    it('should handle empty elements array', () => {
      const data = {
        elements: [],
      };

      const doc = DocumentSchemaModel.create(data);
      expect(doc.elements).toEqual([]);
      expect(doc.doc_margins).toBeUndefined();
    });

    it('should require elements array', () => {
      expect(() => DocumentSchemaModel.create({})).toThrow();
    });

    it('should handle complex document with margins', () => {
      const data = {
        elements: [
          // Mock paragraph structure
          {
            properties: { style_id: 'Normal' },
            runs: [],
          },
        ],
        doc_margins: {
          top_pt: 72.0,
          right_pt: 72.0,
          bottom_pt: 72.0,
          left_pt: 72.0,
          header_pt: 36.0,
          footer_pt: 36.0,
          gutter_pt: 0.0,
        },
      };

      const doc = DocumentSchemaModel.create(data);
      expect(doc.elements).toHaveLength(1);
      expect(doc.doc_margins?.top_pt).toBe(72.0);
      expect(doc.doc_margins?.header_pt).toBe(36.0);
    });
  });

  describe('Model validation edge cases', () => {
    it('should validate document margins with partial data', () => {
      const result = DocMarginsModel.validate({
        top_pt: 72.0,
        left_pt: 72.0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.top_pt).toBe(72.0);
        expect(result.data.left_pt).toBe(72.0);
        expect(result.data.right_pt).toBeUndefined();
      }
    });

    it('should fail validation for invalid margin types', () => {
      const result = DocMarginsModel.validate({
        top_pt: 'invalid',
        left_pt: 72.0,
      });

      expect(result.success).toBe(false);
    });
  });
});
