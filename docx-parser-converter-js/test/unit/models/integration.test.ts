import { describe, expect, it } from 'vitest';
import {
  DocumentSchemaModel,
  ParagraphModel,
  RunModel,
  StyleModel,
  TableCellModel,
  TableModel,
  TableRowModel,
  TextContentModel,
} from '../../../src/models';

describe('Models Integration', () => {
  it('should create a complete document with paragraphs and tables', () => {
    // Create a text run
    const textContent = TextContentModel.create({ text: 'Hello World' });
    expect(textContent.text).toBe('Hello World');

    // Create a run with the text content
    const run = RunModel.create({
      contents: [{ run: textContent }],
      properties: {
        bold: true,
        size_pt: 12,
        color: '000000',
      },
    });

    expect(run.contents).toHaveLength(1);
    expect(run.properties?.bold).toBe(true);

    // Create a paragraph with the run
    const paragraph = ParagraphModel.create({
      properties: {
        style_id: 'Normal',
        justification: 'left',
      },
      runs: [run],
    });

    expect(paragraph.runs).toHaveLength(1);
    expect(paragraph.properties.style_id).toBe('Normal');

    // Create a table cell with the paragraph
    const tableCell = TableCellModel.create({
      properties: {
        gridSpan: 1,
      },
      paragraphs: [paragraph],
    });

    expect(tableCell.paragraphs).toHaveLength(1);

    // Create a table row with the cell
    const tableRow = TableRowModel.create({
      properties: {
        tblHeader: false,
      },
      cells: [tableCell],
    });

    expect(tableRow.cells).toHaveLength(1);

    // Create a table with the row
    const table = TableModel.create({
      properties: {
        tblStyle: 'TableGrid',
      },
      grid: {
        columns: [100],
      },
      rows: [tableRow],
    });

    expect(table.rows).toHaveLength(1);
    expect(table.grid?.columns).toEqual([100]);

    // Create a document with the paragraph and table
    const document = DocumentSchemaModel.create({
      elements: [paragraph, table],
      doc_margins: {
        top_pt: 72,
        bottom_pt: 72,
        left_pt: 72,
        right_pt: 72,
      },
    });

    expect(document.elements).toHaveLength(2);
    expect(document.doc_margins?.top_pt).toBe(72);
  });

  it('should create a style definition', () => {
    const style = StyleModel.create({
      style_id: 'Heading1',
      name: 'Heading 1',
      based_on: 'Normal',
      paragraph_properties: {
        outline_level: 1,
        spacing: {
          before_pt: 12,
          after_pt: 6,
        },
      },
      run_properties: {
        bold: true,
        size_pt: 16,
        font: {
          ascii: 'Calibri',
        },
      },
    });

    expect(style.style_id).toBe('Heading1');
    expect(style.name).toBe('Heading 1');
    expect(style.paragraph_properties?.outline_level).toBe(1);
    expect(style.run_properties?.bold).toBe(true);
    expect(style.run_properties?.font?.ascii).toBe('Calibri');
  });

  it('should validate model data correctly', () => {
    // Valid data should pass
    const validResult = ParagraphModel.validate({
      properties: { style_id: 'Normal' },
      runs: [
        {
          contents: [{ run: { text: 'Test' } }],
        },
      ],
    });

    expect(validResult.success).toBe(true);

    // Invalid data should fail
    const invalidResult = ParagraphModel.validate({
      properties: 'invalid', // Should be an object
      runs: [],
    });

    expect(invalidResult.success).toBe(false);
  });
});
