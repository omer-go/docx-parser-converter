import { z } from 'zod';
import { ParagraphSchema } from './paragraph_models.js'; // Assuming this path is correct

import { ColorSchema, MeasurementSchema, OnOffSchema, ShadingSchema } from './properties_models.js'; // Assuming path


// --- Border Types ---
// Generic border type used by table, row, and cell borders.
// <w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
export const BorderTypeSchema = z.object({
  val: z.string().describe("Border style (e.g., 'single', 'double', 'nil')."), // e.g., <w:top w:val="single">
  sz: MeasurementSchema.optional().describe("Border size/width, typically in eighths of a point."), // <w:top w:sz="4"> (0.5pt)
  space: MeasurementSchema.optional().describe("Spacing offset for the border."), // <w:top w:space="0">
  color: ColorSchema.optional().describe("Border color."), // <w:top w:color="auto"> or specific hex
  themeColor: z.string().optional(),
  themeTint: z.string().optional(),
  themeShade: z.string().optional(),
}).describe("Schema for a single border type (e.g., top, bottom, left, right).");


// --- Table Cell Properties ---

/** Schema for cell margins within tcMar or tblCellMar */
export const CellMarginValuesSchema = z.object({
    top: MeasurementSchema.optional(),    // <w:top w:w="dxa" w:type="dxa"/>
    bottom: MeasurementSchema.optional(), // <w:bottom w:w="dxa" w:type="dxa"/>
    left: MeasurementSchema.optional(),   // <w:left w:w="dxa" w:type="dxa"/> (or start)
    right: MeasurementSchema.optional(),  // <w:right w:w="dxa" w:type="dxa"/> (or end)
}).describe("Schema for cell margin values (top, bottom, left, right).");


/** Zod schema for table cell borders (<w:tcBorders>) */
export const TableCellBordersSchema = z.object({
  top: BorderTypeSchema.optional(),
  bottom: BorderTypeSchema.optional(),
  left: BorderTypeSchema.optional(), // Corresponds to <w:start> in LTR or <w:left>
  right: BorderTypeSchema.optional(), // Corresponds to <w:end> in LTR or <w:right>
  insideH: BorderTypeSchema.optional().describe("Inner horizontal borders."), // <w:insideH/>
  insideV: BorderTypeSchema.optional().describe("Inner vertical borders."),   // <w:insideV/>
  // tl2br: BorderTypeSchema.optional().describe("Top-left to bottom-right diagonal border."),
  // tr2bl: BorderTypeSchema.optional().describe("Top-right to bottom-left diagonal border."),
}).describe("Schema for table cell border properties.");


/**
 * Zod schema for table cell properties (<w:tcPr>).
 */
export const TableCellPropertiesSchema = z.object({
  tcW: MeasurementSchema.optional().describe("Preferred cell width. <w:tcW w:w='...' w:type='dxa|pct|auto'>"),
  gridSpan: z.number().int().min(1).optional().describe("Number of grid columns spanned by the cell (<w:gridSpan w:val='...'/>)."),
  vAlign: z.enum(['top', 'center', 'bottom']).optional().describe("Vertical alignment (<w:vAlign w:val='...'/>)."),
  textDirection: z.string().optional().describe("Text direction (<w:textDirection w:val='...'/> e.g. btLr, tbRl)."),
  tcBorders: TableCellBordersSchema.optional().describe("Cell borders."),
  shd: ShadingSchema.optional().describe("Cell shading/background color."), // <w:shd ... />
  tcMar: CellMarginValuesSchema.optional().describe("Cell margins (padding)."), // <w:tcMar>
  // noWrap: OnOffSchema.optional().describe("Prevent text wrapping in cell (<w:noWrap/>)."),
  // hideMark: OnOffSchema.optional().describe("Ignore end of cell marker in row height calculation (<w:hideMark/>)."),
}).strict().describe("Schema for table cell properties.");

/**
 * Zod schema for a table cell.
 * Cells can contain paragraphs or nested tables.
 */
export const TableCellSchema = z.object({
  elements: z.array(z.union([ParagraphSchema, z.lazy(() => TableSchema)])) // Allows nested tables
    .describe("Elements within a table cell, can be Paragraphs or nested Tables."),
  properties: TableCellPropertiesSchema,
  type: z.literal('table_cell').default('table_cell'),
});

// --- Table Row Properties ---

/**
 * Zod schema for table row properties (<w:trPr>).
 */
export const TableRowPropertiesSchema = z.object({
  trHeight: MeasurementSchema.optional().describe("Row height configuration. <w:trHeight w:val='...' w:hRule='atLeast|exact|auto'>"),
  // hRule attribute for trHeight is important: 'atLeast', 'exact', 'auto'
  // We can store hRule alongside val in MeasurementSchema if needed, or add here.
  // For now, MeasurementSchema just stores val.
  tblHeader: OnOffSchema.optional().describe("Row is a table header (<w:tblHeader/>)."),
  // cantSplit: OnOffSchema.optional().describe("Row cannot be split across pages (<w:cantSplit/>)."),
  // TODO: Add other row properties like tblCellSpacing (if applied at row level), jc (row alignment)
}).strict().describe("Schema for table row properties.");

/**
 * Zod schema for a table row.
 * A row consists of multiple cells.
 */
export const TableRowSchema = z.object({
  cells: z.array(TableCellSchema),
  properties: TableRowPropertiesSchema,
  type: z.literal('table_row').default('table_row'),
});

// --- Table Properties ---

/** Zod schema for table-wide cell margins (<w:tblCellMar>) */
// Uses CellMarginValuesSchema defined earlier.

/** Zod schema for table borders (<w:tblBorders>) */
export const TableBordersSchema = z.object({
  top: BorderTypeSchema.optional(),
  left: BorderTypeSchema.optional(),
  bottom: BorderTypeSchema.optional(),
  right: BorderTypeSchema.optional(),
  insideH: BorderTypeSchema.optional().describe("Inner horizontal borders for the entire table."),
  insideV: BorderTypeSchema.optional().describe("Inner vertical borders for the entire table."),
}).describe("Schema for table-wide border properties.");


/**
 * Zod schema for table properties (<w:tblPr>).
 */
export const TablePropertiesSchema = z.object({
  tblW: MeasurementSchema.optional().describe("Preferred table width. <w:tblW w:w='...' w:type='dxa|pct|auto'>"),
  jc: z.enum(['left', 'center', 'right', 'start', 'end']).optional().describe("Table alignment (<w:jc w:val='...'/>)."),
  tblCellSpacing: MeasurementSchema.optional().describe("Spacing between cells. <w:tblCellSpacing w:w='...' w:type='dxa'>"),
  tblInd: MeasurementSchema.optional().describe("Table indentation from the left. <w:tblInd w:w='...' w:type='dxa'>"),
  tblBorders: TableBordersSchema.optional().describe("Table-wide border settings."),
  shd: ShadingSchema.optional().describe("Table-wide shading (applied as background to the table)."),
  tblLayout: z.string().optional().describe("Table layout algorithm type (<w:tblLayout w:type='fixed|auto'/>)."),
  tblCellMar: CellMarginValuesSchema.optional().describe("Table-wide default cell margins (padding)."), // Default cell margins for all cells in table
  // tblLook: z.any().optional().describe("Table conditional formatting settings (<w:tblLook .../>). Placeholder."),
  // TODO: Add tblStyle, tblCaption, etc.
}).strict().describe("Schema for table properties.");

/**
 * Zod schema for the table grid.
 * Defines the widths of the columns in the table.
 * Each number represents the width of a grid column in DXA (twentieths of a point).
 */
export const TableGridSchema = z.array(z.number().int().nonnegative())
  .describe("Array of column widths for the table grid.");

/**
 * Zod schema for a table.
 * A table consists of a grid definition and multiple rows.
 */
export const TableSchema = z.object({
  rows: z.array(TableRowSchema),
  properties: TablePropertiesSchema,
  grid: TableGridSchema, // Represents <w:tblGrid> and its <w:gridCol w:w="width"> children
  type: z.literal('table').default('table'),
});

// Default empty objects for convenience, ensuring they conform to the schemas
export const defaultTableCellProperties = TableCellPropertiesSchema.parse({});
export const defaultTableRowProperties = TableRowPropertiesSchema.parse({});
export const defaultTableProperties = TablePropertiesSchema.parse({});

// Example Usage (for testing and illustration)
// const exampleTableCell = {
//   elements: [{
//     runs: [{ text: "Cell content", properties: {} }],
//     properties: {},
//     type: 'paragraph'
//   }],
//   properties: {},
//   // type: 'table_cell' // Default will be applied
// };

// const exampleTableRow = {
//   cells: [exampleTableCell, exampleTableCell],
//   properties: {},
//   // type: 'table_row'
// };

// const exampleTable = {
//   rows: [exampleTableRow, exampleTableRow],
//   properties: { style: 'GridTable1Light' }, // Passthrough allows this
//   grid: [2000, 2000], // Example column widths
//   // type: 'table'
// };

// try {
//   const validatedCell = TableCellSchema.parse(exampleTableCell);
//   // console.log("Validated Cell:", validatedCell);
//   const validatedRow = TableRowSchema.parse(exampleTableRow);
//   // console.log("Validated Row:", validatedRow);
//   const validatedTable = TableSchema.parse(exampleTable);
//   // console.log("Validated Table:", validatedTable);
// } catch (error) {
//   console.error("Table models validation failed:", error.errors);
// }
