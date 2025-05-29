import { describe, it, expect } from 'vitest';
import {
  BorderPropertiesModel,
  MarginPropertiesModel,
  TableLookModel,
  TableCellPropertiesModel,
  TableRowPropertiesModel,
  TablePropertiesModel,
  TableGridModel,
  TableModel,
} from '../../../src/models/table-models';

describe('Table Models', () => {
  describe('BorderPropertiesModel', () => {
    it('should create valid border properties', () => {
      const data = {
        color: '000000',
        size: 4,
        space: 0,
        val: 'single',
      };

      const border = BorderPropertiesModel.create(data);
      expect(border.color).toBe('000000');
      expect(border.size).toBe(4);
      expect(border.space).toBe(0);
      expect(border.val).toBe('single');
    });

    it('should handle null/undefined values', () => {
      const data = {
        color: null,
        size: undefined,
      };

      const border = BorderPropertiesModel.create(data);
      expect(border.color).toBeNull();
      expect(border.size).toBeUndefined();
    });

    it('should handle empty object', () => {
      const border = BorderPropertiesModel.create({});
      expect(border.color).toBeUndefined();
      expect(border.size).toBeUndefined();
    });
  });

  describe('MarginPropertiesModel', () => {
    it('should create valid margin properties', () => {
      const data = {
        top: 108,
        right: 108,
        bottom: 108,
        left: 108,
      };

      const margin = MarginPropertiesModel.create(data);
      expect(margin.top).toBe(108);
      expect(margin.right).toBe(108);
      expect(margin.bottom).toBe(108);
      expect(margin.left).toBe(108);
    });
  });

  describe('TableLookModel', () => {
    it('should create valid table look', () => {
      const data = {
        val: '04A0',
        firstRow: true,
        lastRow: false,
        firstColumn: true,
        lastColumn: false,
        noHBand: false,
        noVBand: true,
      };

      const look = TableLookModel.create(data);
      expect(look.val).toBe('04A0');
      expect(look.firstRow).toBe(true);
      expect(look.lastRow).toBe(false);
      expect(look.firstColumn).toBe(true);
      expect(look.lastColumn).toBe(false);
      expect(look.noHBand).toBe(false);
      expect(look.noVBand).toBe(true);
    });
  });

  describe('TableCellPropertiesModel', () => {
    it('should create valid table cell properties', () => {
      const data = {
        width: 2880,
        borders: {
          top: { color: '000000', size: 4, val: 'single' },
          right: { color: '000000', size: 4, val: 'single' },
          bottom: { color: '000000', size: 4, val: 'single' },
          left: { color: '000000', size: 4, val: 'single' },
        },
        margins: {
          top: 108,
          right: 108,
          bottom: 108,
          left: 108,
        },
        shading: 'FFFFFF',
        vAlign: 'top',
      };

      const props = TableCellPropertiesModel.create(data);
      expect(props.width).toBe(2880);
      expect(props.borders?.top?.color).toBe('000000');
      expect(props.margins?.top).toBe(108);
      expect(props.shading).toBe('FFFFFF');
      expect(props.vAlign).toBe('top');
    });
  });

  describe('TableRowPropertiesModel', () => {
    it('should create valid table row properties', () => {
      const data = {
        height: 360,
        cantSplit: false,
        tblHeader: true,
      };

      const props = TableRowPropertiesModel.create(data);
      expect(props.height).toBe(360);
      expect(props.cantSplit).toBe(false);
      expect(props.tblHeader).toBe(true);
    });
  });

  describe('TablePropertiesModel', () => {
    it('should create valid table properties', () => {
      const data = {
        width: 5760,
        alignment: 'center',
        borders: {
          top: { color: '000000', size: 4, val: 'single' },
          right: { color: '000000', size: 4, val: 'single' },
          bottom: { color: '000000', size: 4, val: 'single' },
          left: { color: '000000', size: 4, val: 'single' },
        },
        margins: {
          top: 108,
          right: 108,
          bottom: 108,
          left: 108,
        },
        look: {
          val: '04A0',
          firstRow: true,
          lastRow: false,
        },
        style: 'TableGrid',
        indent: 144,
      };

      const props = TablePropertiesModel.create(data);
      expect(props.width).toBe(5760);
      expect(props.alignment).toBe('center');
      expect(props.borders?.top?.color).toBe('000000');
      expect(props.look?.val).toBe('04A0');
      expect(props.style).toBe('TableGrid');
      expect(props.indent).toBe(144);
    });
  });

  describe('TableGridModel', () => {
    it('should create valid table grid', () => {
      const data = {
        columns: [2880, 2880],
      };

      const grid = TableGridModel.create(data);
      expect(grid.columns).toEqual([2880, 2880]);
      expect(grid.columns).toHaveLength(2);
    });

    it('should require columns array', () => {
      expect(() => TableGridModel.create({})).toThrow();
    });
  });

  describe('TableModel', () => {
    it('should create valid table', () => {
      const data = {
        properties: {
          width: 5760,
          alignment: 'center',
        },
        grid: {
          columns: [2880, 2880],
        },
        rows: [
          {
            properties: {
              height: 360,
            },
            cells: [
              {
                properties: {
                  width: 2880,
                },
                paragraphs: [],
              },
              {
                properties: {
                  width: 2880,
                },
                paragraphs: [],
              },
            ],
          },
        ],
      };

      const table = TableModel.create(data);
      expect(table.properties?.width).toBe(5760);
      expect(table.grid?.columns).toHaveLength(2);
      expect(table.rows).toHaveLength(1);
      expect(table.rows[0]?.cells).toHaveLength(2);
    });

    it('should require rows array', () => {
      expect(() => TableModel.create({})).toThrow();
    });

    it('should handle table without properties or grid', () => {
      const data = {
        rows: [],
      };

      const table = TableModel.create(data);
      expect(table.properties).toBeUndefined();
      expect(table.grid).toBeUndefined();
      expect(table.rows).toEqual([]);
    });
  });

  describe('Model validation edge cases', () => {
    it('should validate border properties correctly', () => {
      const result = BorderPropertiesModel.validate({
        color: 'FF0000',
        size: 8,
        val: 'double',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('FF0000');
        expect(result.data.size).toBe(8);
      }
    });

    it('should fail validation for invalid border data', () => {
      const result = BorderPropertiesModel.validate({
        size: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });
});
