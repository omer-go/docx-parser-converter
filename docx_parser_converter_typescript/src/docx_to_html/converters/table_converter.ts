import {
  TableModel,
  TableGridModel,
  TableRowModel,
  TableCellModel,
  ParagraphModel, // For cell content
  // TablePropertiesModel, // For typing table.properties
  NumberingModel as DocxNumberingModel,
  StyleModel,
} from '../../../docx_parsers/models/index';
import {
  getTablePropertiesCss,
  getTableRowPropertiesCss,
  getTableCellPropertiesCss,
  // getParagraphStyles, // Not directly used here, but by convertParagraphToHtml
  aggregateCss,
} from './style_converter';
import { convertParagraphToHtml } from './paragraph_converter';
import { NumberingStateService } from './numbering_converter'; // For passing through

// --- Helper: Convert Table Grid to <colgroup> ---
/**
 * Converts table grid information to HTML <colgroup> and <col> elements.
 * @param grid The TableGridModel object.
 * @returns HTML string for <colgroup> or empty string.
 */
function convertGridToHtml(grid?: TableGridModel): string {
  if (!grid || !grid.columns || grid.columns.length === 0) {
    return '';
  }
  const colsHtml = grid.columns.map(colWidthInPoints =>
    `<col style="width:${colWidthInPoints}pt;">`
  ).join('');
  return `<colgroup>${colsHtml}</colgroup>`;
}


// --- Recursive Helper: Convert Cell Content ---
/**
 * Converts the content of a table cell (paragraphs and nested tables) to HTML.
 * @param elements Array of ParagraphModel or TableModel.
 * @param numberingModel Full numbering definitions.
 * @param numberingStateService Service to manage list state.
 * @param stylesMap Resolved styles map.
 * @returns HTML string of concatenated cell content.
 */
function convertCellElementsToHtml(
    elements: (ParagraphModel | TableModel)[],
    numberingModel?: DocxNumberingModel,
    numberingStateService?: NumberingStateService,
    stylesMap?: Map<string, StyleModel> // For resolving styles if needed by deeper converters
): string {
    let cellContentHtml = "";
    if (elements) {
        for (const element of elements) {
            if ('runs' in element) { // Type guard for ParagraphModel
                // numberingStateService is now guaranteed to be available (either passed or locally created by convertTableToHtml)
                cellContentHtml += convertParagraphToHtml(element as ParagraphModel, numberingModel, numberingStateService!);
            } else if ('rows' in element) { // Type guard for TableModel
                // Pass the same numberingStateService down for nested tables
                cellContentHtml += convertTableToHtml(element as TableModel, numberingModel, numberingStateService, stylesMap);
            }
        }
    }
    if (cellContentHtml.trim() === "") {
        return "&nbsp;"; // Ensure cell takes up space if empty
    }
    return cellContentHtml;
}


// --- Helper: Convert Single Table Cell to <td> ---
/**
 * Converts a single TableCellModel to an HTML <td> (or <th>) element.
 * @param cell The TableCellModel object.
 * @param tableProperties The properties of the parent table (for default cell margins, etc.).
 * @param numberingModel Full numbering definitions.
 * @param numberingStateService Service to manage list state.
 * @param stylesMap Resolved styles map.
 * @returns HTML string for the cell.
 */
function convertCellToHtml(
    cell: TableCellModel,
    tableProperties?: TablePropertiesModel, // Pass table properties for context if needed
    numberingModel?: DocxNumberingModel,
    numberingStateService?: NumberingStateService,
    stylesMap?: Map<string, StyleModel>
): string {
  if (!cell) return '';

  // Handle vMerge: 'continue' cells are skipped. 'restart' cells are rendered with rowspan.
  if (cell.properties?.vMerge === 'continue') {
    return ""; // This cell is merged into the one above.
  }

  const cellStyles = getTableCellPropertiesCss(cell.properties /*, tableProperties?.cell_margins */); // Pass default cell margin from table if that pattern is used

  let tagName = 'td'; // TODO: Determine if it should be <th> based on cell/row/table properties or styles

  let attributes = "";
  if (cell.properties?.gridSpan && cell.properties.gridSpan > 1) {
    attributes += ` colspan="${cell.properties.gridSpan}"`;
  }
  if (cell.properties?.vMerge === 'restart') {
    // Basic rowspan handling. Actual rowspan value requires lookahead or pre-scan of the table.
    // For now, just marking it as starting a span. CSS might be needed to hide subsequent 'continue' cells visually.
    // A full rowspan calculation is complex and typically done by pre-processing the table model.
    attributes += ` rowspan="1"`; // Placeholder, actual calculation is complex
  }

  const cellContentHtml = convertCellElementsToHtml(cell.elements, numberingModel, numberingStateService, stylesMap);

  return `<${tagName}${attributes}${cellStyles ? ' style="' + cellStyles + '"' : ''}>${cellContentHtml}</${tagName}>`;
}

// --- Helper: Convert Table Cells of a Row to <td>s ---
/**
 * Converts all cells in a TableRowModel to HTML <td> elements.
 * @param cells Array of TableCellModel.
 * @param tableProperties Properties of the parent table.
 * @param numberingModel Full numbering definitions.
 * @param numberingStateService Service to manage list state.
 * @param stylesMap Resolved styles map.
 * @returns HTML string of concatenated <td> elements.
 */
function convertTableCellsToHtml(
    cells: TableCellModel[],
    tableProperties?: TablePropertiesModel,
    numberingModel?: DocxNumberingModel,
    numberingStateService?: NumberingStateService,
    stylesMap?: Map<string, StyleModel>
): string {
  if (!cells) return '';
  return cells.map(cell => convertCellToHtml(cell, tableProperties, numberingModel, numberingStateService, stylesMap)).join('');
}


// --- Helper: Convert Single Table Row to <tr> ---
/**
 * Converts a single TableRowModel to an HTML <tr> element.
 * @param row The TableRowModel object.
 * @param tableProperties Properties of the parent table.
 * @param numberingModel Full numbering definitions.
 * @param numberingStateService Service to manage list state.
 * @param stylesMap Resolved styles map.
 * @returns HTML string for the row.
 */
function convertRowToHtml(
    row: TableRowModel,
    tableProperties?: TablePropertiesModel,
    numberingModel?: DocxNumberingModel,
    numberingStateService?: NumberingStateService,
    stylesMap?: Map<string, StyleModel>
): string {
  if (!row) return '';
  const rowStyles = getTableRowPropertiesCss(row.properties);
  const cellsHtml = convertTableCellsToHtml(row.cells, tableProperties, numberingModel, numberingStateService, stylesMap);
  return `<tr${rowStyles ? ' style="' + rowStyles + '"' : ''}>${cellsHtml}</tr>`;
}

// --- Helper: Convert Table Rows to <tbody> content ---
/**
 * Converts all rows in a TableModel to HTML <tr> elements.
 * @param rows Array of TableRowModel.
 * @param tableProperties Properties of the parent table.
 * @param numberingModel Full numbering definitions.
 * @param numberingStateService Service to manage list state.
 * @param stylesMap Resolved styles map.
 * @returns HTML string of concatenated <tr> elements.
 */
function convertTableRowsToHtml(
    rows: TableRowModel[],
    tableProperties?: TablePropertiesModel,
    numberingModel?: DocxNumberingModel,
    numberingStateService?: NumberingStateService,
    stylesMap?: Map<string, StyleModel>
): string {
  if (!rows) return '';
  return rows.map(row => convertRowToHtml(row, tableProperties, numberingModel, numberingStateService, stylesMap)).join('');
}


// --- Main Exported Function ---
/**
 * Converts a TableModel object to its HTML representation.
 * @param table The TableModel object to convert.
 * @param numberingModel Optional full NumberingModel for list processing within table cells.
 * @param numberingStateService Optional NumberingStateService for list processing.
 * @param stylesMap Optional resolved styles map.
 * @returns HTML string representing the table.
 */
export function convertTableToHtml(
  table: TableModel,
  numberingModel?: DocxNumberingModel,
  numberingStateService?: NumberingStateService, // Pass this through for paragraphs in cells
  stylesMap?: Map<string, StyleModel> // Pass this through if needed by deeper converters
): string {
  if (!table) {
    return "";
  }

  const tableStyles = getTablePropertiesCss(table.properties);
  const colgroupHtml = convertGridToHtml(table.grid);

  // If numberingStateService is not provided, create a temporary one for this table's scope.
  // This ensures that lists within this table are handled independently if no outer service is passed.
  const localNumberingStateService = numberingStateService || new NumberingStateService();

  const tbodyHtml = convertTableRowsToHtml(table.rows, table.properties, numberingModel, localNumberingStateService, stylesMap);

  let finalTableHtml = `<table${tableStyles ? ' style="' + tableStyles + '"' : ''}>${colgroupHtml}<tbody>${tbodyHtml}</tbody></table>`;

  // If a local numbering service was used, close any lists opened within this table.
  if (!numberingStateService && localNumberingStateService) {
      finalTableHtml += localNumberingStateService.closeAllOpenLists();
  }

  return finalTableHtml;
}
