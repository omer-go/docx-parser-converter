import {
  TableModel,
  TableRowModel,
  TableCellModel,
  ParagraphModel,
  NumberingModel as DocxNumberingModel,
} from '../../../docx_parsers/models/index';
import { convertParagraphToTxt, ConvertParagraphToTxtOptions } from './paragraph_converter';
import { TxtNumberingStateService } from './numbering_converter';

// Type guards
function isParagraphModel(element: any): element is ParagraphModel {
  return element && Array.isArray(element.runs);
}

function isTableModel(element: any): element is TableModel {
  return element && Array.isArray(element.rows) && element.grid;
}

/**
 * Converts a single table cell's content to plain text.
 * @param cell The TableCellModel to convert.
 * @param numberingModel The full NumberingModel for list context.
 * @param numberingStateService The service managing numbering state.
 * @param options Options for paragraph to text conversion (e.g., indentation).
 * @returns Plain text string of the cell's content.
 */
function convertCellToTxt(
  cell: TableCellModel,
  numberingModel: DocxNumberingModel | undefined,
  numberingStateService: TxtNumberingStateService,
  options: ConvertParagraphToTxtOptions
): string {
  let cellText = "";
  if (cell.elements) {
    cell.elements.forEach((element, index) => {
      if (isParagraphModel(element)) {
        cellText += convertParagraphToTxt(element, numberingModel, numberingStateService, options);
      } else if (isTableModel(element)) {
        // For nested tables, create a new numbering state service if desired,
        // or pass the existing one. Passing existing one for continuous numbering.
        cellText += convertTableToTxt(element, numberingModel, numberingStateService, options);
      }
      // Add a space as a separator if there are multiple elements in the cell,
      // and this is not the last element.
      if (index < cell.elements.length - 1) {
        cellText += " ";
      }
    });
  }
  return cellText.trim();
}

/**
 * Converts a table row to a plain text string, with cells separated by " | ".
 * @param row The TableRowModel to convert.
 * @param numberingModel The full NumberingModel for list context.
 * @param numberingStateService The service managing numbering state.
 * @param options Options for paragraph to text conversion.
 * @returns Plain text string of the row.
 */
function convertRowToTxt(
  row: TableRowModel,
  numberingModel: DocxNumberingModel | undefined,
  numberingStateService: TxtNumberingStateService,
  options: ConvertParagraphToTxtOptions
): string {
  if (!row.cells) {
    return "";
  }
  return row.cells.map(cell =>
    convertCellToTxt(cell, numberingModel, numberingStateService, options)
  ).join(" | ");
}

/**
 * Converts a TableModel object to its plain text representation.
 * Rows are separated by newlines, and cells within rows by " | ".
 * @param table The TableModel object to convert.
 * @param numberingModel The full NumberingModel for list context within table cells.
 * @param numberingStateService The service managing numbering state for lists.
 * @param options Configuration options for text conversion (e.g., applyIndentation).
 * @returns Plain text string representing the table.
 */
export function convertTableToTxt(
  table: TableModel,
  numberingModel: DocxNumberingModel | undefined,
  numberingStateService: TxtNumberingStateService,
  options: ConvertParagraphToTxtOptions = { applyIndentation: true } // Default options
): string {
  if (!table || !table.rows || table.rows.length === 0) {
    return "";
  }

  const rowTexts = table.rows.map(row =>
    convertRowToTxt(row, numberingModel, numberingStateService, options)
  );

  // For TXT, simple newline separation for rows.
  // The TxtGenerator will handle newlines before/after the entire table block.
  return rowTexts.join("\n");
}
