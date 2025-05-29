// test/unit/models/table-models.test.ts
import { describe, it, expect } from 'vitest';
import {
  TableCellPropertiesSchema,
  TableCellSchema,
  TableRowPropertiesSchema,
  TableRowSchema,
  TableGridColumnSchema,
  TablePropertiesSchema,
  TableModelSchema,
  TableCellContentElementSchema, // Import if you want to test cell content directly
} from '../../../src/models/table-models';
import { ParagraphSchema, TextRunSchema } from '../../../src/models/paragraph-models';

describe('Table Models Schemas', () => {
  describe('TableCellPropertiesSchema', () => {
    it('should validate correct cell properties', () => {
      const data = { width: { value: 1000, type: 'dxa' as const }, verticalAlignment: 'center' as const };
      expect(TableCellPropertiesSchema.safeParse(data).success).toBe(true);
    });
    it('should default width type and verticalAlignment', () => {
        const data = { width: { value: 1000 }};
        const parsed = TableCellPropertiesSchema.parse(data);
        expect(parsed.width?.type).toBe('auto');
        expect(parsed.verticalAlignment).toBe('top');
    });
  });

  describe('TableCellSchema', () => {
    it('should validate a correct table cell with paragraph content', () => {
      const data = {
        type: 'tableCell' as const,
        children: [
          { type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Cell content' }] }
        ],
        properties: { gridSpan: 2 }
      };
      expect(TableCellSchema.safeParse(data).success).toBe(true);
    });
     it('should fail if type is not tableCell', () => {
        const data = { type: 'notACell' as const, children: [] };
        expect(TableCellSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('TableRowPropertiesSchema', () => {
    it('should validate correct row properties', () => {
      const data = { isHeader: true, height: { value: 500, rule: 'exact' as const } };
      expect(TableRowPropertiesSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('TableRowSchema', () => {
    it('should validate a correct table row with cells', () => {
      const cellData = { type: 'tableCell' as const, children: [{ type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Cell' }] }] };
      const data = { type: 'tableRow' as const, children: [cellData, cellData] };
      expect(TableRowSchema.safeParse(data).success).toBe(true);
    });
    it('should fail if children is not an array of cells', () => {
        const data = { type: 'tableRow' as const, children: [{ type: 'paragraph' as const, children: [] }]};
        expect(TableRowSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('TableGridColumnSchema', () => {
    it('should validate correct grid column', () => {
      const data = { width: 2000 };
      expect(TableGridColumnSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('TablePropertiesSchema', () => {
    it('should validate correct table properties', () => {
      const data = { styleId: 'TableStyle1', width: { value: 100, type: 'pct' as const }, alignment: 'center' as const, cellSpacing: 80 };
      expect(TablePropertiesSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('TableModelSchema', () => {
    it('should validate a correct table model', () => {
      const cell = { type: 'tableCell' as const, children: [{ type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Data' }] }] };
      const row = { type: 'tableRow' as const, children: [cell] };
      const data = {
        type: 'table' as const,
        grid: [{ width: 3000 }, { width: 3000 }],
        children: [row],
        properties: { layout: 'fixed' as const }
      };
      expect(TableModelSchema.safeParse(data).success).toBe(true);
    });
    it('should default grid to empty array', () => {
        const row = { type: 'tableRow' as const, children: [{ type: 'tableCell' as const, children: [{ type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Data' }] }] }] };
        const data = { type: 'table' as const, children: [row] };
        const parsed = TableModelSchema.parse(data);
        expect(parsed.grid).toEqual([]);
    });
  });
  
  // Test for nested table in cell (basic)
  describe('TableCellContentElementSchema with Nested Table', () => {
    it('should validate a table cell containing a nested table', () => {
        const nestedTable = {
            type: 'table' as const,
            children: [
                { 
                    type: 'tableRow' as const, 
                    children: [
                        { 
                            type: 'tableCell' as const, 
                            children: [{ type: 'paragraph' as const, children: [{ type: 'textRun' as const, text: 'Nested Cell'}]}] 
                        }
                    ] 
                }
            ]
        };
        const cellWithNestedTable = {
            type: 'tableCell' as const,
            children: [nestedTable]
        };
        const result = TableCellSchema.safeParse(cellWithNestedTable);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.children[0].type).toBe('table');
        }
    });
  });
});
