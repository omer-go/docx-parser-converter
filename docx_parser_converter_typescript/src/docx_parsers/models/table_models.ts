import { z } from 'zod';
import { ParagraphSchema } from './paragraph_models'; // Assuming ParagraphSchema will be used for cell content

// 1. BorderProperties
export const BorderPropertiesSchema = z.object({
  val: z.string().optional(), // e.g., "single", "double"
  color: z.string().optional(), // Hex color
  size: z.number().optional(), // Points * 8
  space: z.number().optional(), // Points
});
export type BorderProperties = z.infer<typeof BorderPropertiesSchema>;

// 2. ShadingProperties
export const ShadingPropertiesSchema = z.object({
  val: z.string().optional(), // e.g., "clear", "solid"
  color: z.string().optional(), // Hex color
  fill: z.string().optional(), // Hex color
});
export type ShadingProperties = z.infer<typeof ShadingPropertiesSchema>;

// 3. MarginProperties (for cell margins)
export const MarginPropertiesSchema = z.object({
  top_pt: z.number().optional(),
  left_pt: z.number().optional(),
  bottom_pt: z.number().optional(),
  right_pt: z.number().optional(),
});
export type MarginProperties = z.infer<typeof MarginPropertiesSchema>;

// 4. TableWidth
export const TableWidthSchema = z.object({
  type: z.string().optional(), // e.g., "dxa", "pct"
  val: z.number().optional(), // Width value
});
export type TableWidth = z.infer<typeof TableWidthSchema>;

// 5. TableIndent
export const TableIndentSchema = z.object({
  type: z.string().optional(), // e.g., "dxa"
  val: z.number().optional(), // Indentation value
});
export type TableIndent = z.infer<typeof TableIndentSchema>;

// 6. TableLook
export const TableLookSchema = z.object({
  firstRow: z.boolean().optional(),
  lastRow: z.boolean().optional(),
  firstColumn: z.boolean().optional(),
  lastColumn: z.boolean().optional(),
  noHBand: z.boolean().optional(),
  noVBand: z.boolean().optional(),
});
export type TableLook = z.infer<typeof TableLookSchema>;

// 7. TableCellBorders
export const TableCellBordersSchema = z.object({
  top: BorderPropertiesSchema.optional(),
  left: BorderPropertiesSchema.optional(),
  bottom: BorderPropertiesSchema.optional(),
  right: BorderPropertiesSchema.optional(),
  insideH: BorderPropertiesSchema.optional(),
  insideV: BorderPropertiesSchema.optional(),
});
export type TableCellBorders = z.infer<typeof TableCellBordersSchema>;

// 8. TableCellProperties
export const TableCellPropertiesSchema = z.object({
  width: TableWidthSchema.optional(),
  borders: TableCellBordersSchema.optional(),
  shading: ShadingPropertiesSchema.optional(),
  margins: MarginPropertiesSchema.optional(),
  gridSpan: z.number().optional(),
  vAlign: z.string().optional(), // e.g., "top", "center", "bottom"
  textDirection: z.string().optional(), // e.g., "lrTb", "tbRl"
  hideMark: z.boolean().optional(),
  noWrap: z.boolean().optional(),
});
export type TableCellProperties = z.infer<typeof TableCellPropertiesSchema>;

// 9. TableCell
// Assuming cell content can be a list of Paragraphs or other Tables (recursive definition might be complex)
// For now, sticking to Paragraphs as per typical DOCX structure for cell content.
// If tables can be nested, TableSchema would need to be part of the union.
export const TableCellSchema = z.object({
  elements: z.array(z.union([ParagraphSchema, z.lazy(() => TableSchema)]))), // Content: Paragraphs or nested Tables
  properties: TableCellPropertiesSchema.optional(),
});
export type TableCell = z.infer<typeof TableCellSchema>;

// 10. TableRowProperties
export const TableRowPropertiesSchema = z.object({
  cantSplit: z.boolean().optional(),
  isHeader: z.boolean().optional(),
  height_type: z.string().optional(), // e.g., "atLeast", "exact"
  height_val_pt: z.number().optional(),
});
export type TableRowProperties = z.infer<typeof TableRowPropertiesSchema>;

// 11. TableRow
export const TableRowSchema = z.object({
  cells: z.array(TableCellSchema),
  properties: TableRowPropertiesSchema.optional(),
});
export type TableRow = z.infer<typeof TableRowSchema>;

// 12. TableProperties
export const TablePropertiesSchema = z.object({
  style_id: z.string().optional(),
  width: TableWidthSchema.optional(),
  indent: TableIndentSchema.optional(),
  alignment: z.string().optional(), // e.g., "left", "center", "right"
  borders: TableCellBordersSchema.optional(), // Table-level default borders
  shading: ShadingPropertiesSchema.optional(), // Table-level default shading
  cell_margins: MarginPropertiesSchema.optional(), // Table-level default cell margins
  look: TableLookSchema.optional(),
  cell_spacing_dxa: z.number().optional(),
  layout_type: z.string().optional(), // e.g., "fixed", "autofit"
});
export type TableProperties = z.infer<typeof TablePropertiesSchema>;

// 13. TableGrid
export const TableGridSchema = z.object({
  columns: z.array(z.number()), // Array of column widths in dxa
});
export type TableGrid = z.infer<typeof TableGridSchema>;

// 14. Table
export const TableSchema = z.object({
  grid: TableGridSchema,
  rows: z.array(TableRowSchema),
  properties: TablePropertiesSchema.optional(),
});
export type Table = z.infer<typeof TableSchema>;
