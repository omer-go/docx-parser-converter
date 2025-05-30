import { z } from 'zod';
import { ParagraphModel } from './paragraph_models'; // Assuming ParagraphModel will be used for cell content

// 1. BorderProperties
export const BorderPropertiesModel = z.object({
  val: z.string().optional(), // e.g., "single", "double"
  color: z.string().optional(), // Hex color
  size: z.number().optional(), // Points * 8
  space: z.number().optional(), // Points
});
export type BorderProperties = z.infer<typeof BorderPropertiesModel>;

// 2. ShadingProperties
export const ShadingPropertiesModel = z.object({
  val: z.string().optional(), // e.g., "clear", "solid"
  color: z.string().optional(), // Hex color
  fill: z.string().optional(), // Hex color
});
export type ShadingProperties = z.infer<typeof ShadingPropertiesModel>;

// 3. MarginProperties (for cell margins)
export const MarginPropertiesModel = z.object({
  top_pt: z.number().optional(),
  left_pt: z.number().optional(),
  bottom_pt: z.number().optional(),
  right_pt: z.number().optional(),
});
export type MarginProperties = z.infer<typeof MarginPropertiesModel>;

// 4. TableWidth
export const TableWidthModel = z.object({
  type: z.string().optional(), // e.g., "dxa", "pct"
  val: z.number().optional(), // Width value
});
export type TableWidth = z.infer<typeof TableWidthModel>;

// 5. TableIndent
export const TableIndentModel = z.object({
  type: z.string().optional(), // e.g., "dxa"
  val: z.number().optional(), // Indentation value
});
export type TableIndent = z.infer<typeof TableIndentModel>;

// 6. TableLook
export const TableLookModel = z.object({
  firstRow: z.boolean().optional(),
  lastRow: z.boolean().optional(),
  firstColumn: z.boolean().optional(),
  lastColumn: z.boolean().optional(),
  noHBand: z.boolean().optional(),
  noVBand: z.boolean().optional(),
});
export type TableLook = z.infer<typeof TableLookModel>;

// 7. TableCellBorders
export const TableCellBordersModel = z.object({
  top: BorderPropertiesModel.optional(),
  left: BorderPropertiesModel.optional(),
  bottom: BorderPropertiesModel.optional(),
  right: BorderPropertiesModel.optional(),
  insideH: BorderPropertiesModel.optional(),
  insideV: BorderPropertiesModel.optional(),
});
export type TableCellBorders = z.infer<typeof TableCellBordersModel>;

// 8. TableCellProperties
export const TableCellPropertiesModel = z.object({
  width: TableWidthModel.optional(),
  borders: TableCellBordersModel.optional(),
  shading: ShadingPropertiesModel.optional(),
  margins: MarginPropertiesModel.optional(),
  gridSpan: z.number().optional(),
  vAlign: z.string().optional(), // e.g., "top", "center", "bottom"
  textDirection: z.string().optional(), // e.g., "lrTb", "tbRl"
  hideMark: z.boolean().optional(),
  noWrap: z.boolean().optional(),
  vMerge: z.enum(['continue', 'restart']).optional(), // For vertical cell merging
});
export type TableCellProperties = z.infer<typeof TableCellPropertiesModel>;

// 9. TableCell
// Assuming cell content can be a list of Paragraphs or other Tables (recursive definition might be complex)
// For now, sticking to Paragraphs as per typical DOCX structure for cell content.
// If tables can be nested, TableModel would need to be part of the union.
export const TableCellModel = z.object({
  elements: z.array(z.union([ParagraphModel, z.lazy(() => TableModel)]))), // Content: Paragraphs or nested Tables
  properties: TableCellPropertiesModel.optional(),
});
export type TableCell = z.infer<typeof TableCellModel>;

// 10. TableRowProperties
export const TableRowPropertiesModel = z.object({
  cantSplit: z.boolean().optional(),
  tblHeader: z.boolean().optional(), // Renamed from isHeader for consistency with tag
  trHeight_val: z.number().optional(), // Height value in points
  trHeight_hRule: z.string().optional(), // e.g., "atLeast", "exact", "auto"
  justification: z.string().optional(), // e.g., "left", "center", "right"
  tblBorders: TableCellBordersModel.optional(), // Row-level default cell borders
  shd: ShadingPropertiesModel.optional(), // Row-level shading
  tblCellSpacing_val: z.number().optional(), // Spacing value in points
  tblCellSpacing_type: z.string().optional(), // Spacing type e.g., "dxa"
});
export type TableRowProperties = z.infer<typeof TableRowPropertiesModel>;

// 11. TableRow
export const TableRowModel = z.object({
  cells: z.array(TableCellModel),
  properties: TableRowPropertiesModel.optional(),
});
export type TableRow = z.infer<typeof TableRowModel>;

// 12. TableProperties
export const TablePropertiesModel = z.object({
  style_id: z.string().optional(),
  width: TableWidthModel.optional(),
  indent: TableIndentModel.optional(),
  alignment: z.string().optional(), // e.g., "left", "center", "right"
  borders: TableCellBordersModel.optional(), // Table-level default borders
  shading: ShadingPropertiesModel.optional(), // Table-level default shading
  cell_margins: MarginPropertiesModel.optional(), // Table-level default cell margins
  look: TableLookModel.optional(),
  cell_spacing_dxa: z.number().optional(),
  layout_type: z.string().optional(), // e.g., "fixed", "autofit"
});
export type TableProperties = z.infer<typeof TablePropertiesModel>;

// 13. TableGrid
export const TableGridModel = z.object({
  columns: z.array(z.number()), // Array of column widths in points
});
export type TableGrid = z.infer<typeof TableGridModel>;

// 14. Table
export const TableModel = z.object({
  grid: TableGridModel,
  rows: z.array(TableRowModel),
  properties: TablePropertiesModel.optional(),
});
export type Table = z.infer<typeof TableModel>;
