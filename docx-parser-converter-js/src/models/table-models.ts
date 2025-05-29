// src/models/table-models.ts
import { z } from 'zod';
import { ParagraphSchema } from './paragraph-models'; // For cell content
import { NonNegativeIntSchema, NotEmptyStringSchema } from '../types/common';
import { ShadingPropertiesSchema, IndividualBorderPropertiesSchema, ParagraphBordersSchema, AlignmentEnum } from './styles-models'; // For borders, shading, alignment
import { BaseModelSchema } from './base-model';

// --- Table Cell ---
export const VerticalAlignmentEnum = z.enum(['top', 'center', 'bottom']);
export type VerticalAlignment = z.infer<typeof VerticalAlignmentEnum>;

export const TextDirectionEnum = z.enum(['lrTb', 'tbRl', 'btLr']); // Left-to-Right, Top-to-Bottom; Top-to-Bottom, Right-to-Left; Bottom-to-Top, Left-to-Right
export type TextDirection = z.infer<typeof TextDirectionEnum>;

export const VerticalMergeEnum = z.enum(['restart', 'continue']);
export type VerticalMerge = z.infer<typeof VerticalMergeEnum>;

export const TableCellPropertiesSchema = z.object({
  width: z.object({ value: NonNegativeIntSchema, type: z.enum(['dxa', 'pct', 'auto']).default('auto') }).optional(), // Width in DXA (twips) or percentage
  borders: ParagraphBordersSchema.optional(), // Cell borders (can reuse paragraph border structure)
  shading: ShadingPropertiesSchema.optional(),
  padding: z.object({ // Cell padding
    top: NonNegativeIntSchema.optional(),
    bottom: NonNegativeIntSchema.optional(),
    left: NonNegativeIntSchema.optional(),
    right: NonNegativeIntSchema.optional(),
  }).optional(),
  verticalAlignment: VerticalAlignmentEnum.optional().default('top'),
  textDirection: TextDirectionEnum.optional().default('lrTb'),
  gridSpan: NonNegativeIntSchema.optional().default(1), // Number of columns spanned
  verticalMerge: VerticalMergeEnum.optional(), // For vertically merged cells
  noWrap: z.boolean().optional(),
  // hideMark: z.boolean().optional(), // For end-of-cell marker
}).strict();
export type TableCellProperties = z.infer<typeof TableCellPropertiesSchema>;

// Cell content will be an array of DocumentBodyElementSchema to allow paragraphs, nested tables etc.
// Forward declaration for TableModelSchema
const LazyTableModelSchema = z.lazy(() => TableModelSchema);
export const TableCellContentElementSchema = z.union([ParagraphSchema, LazyTableModelSchema]); // Add other elements like lists later

export const TableCellSchema = BaseModelSchema.extend({
  type: z.literal('tableCell'),
  children: z.array(TableCellContentElementSchema),
  properties: TableCellPropertiesSchema.optional(),
}).strict();
export type TableCell = z.infer<typeof TableCellSchema>;

// --- Table Row ---
export const TableRowPropertiesSchema = z.object({
  height: z.object({ value: NonNegativeIntSchema, rule: z.enum(['auto', 'atLeast', 'exact']).default('auto') }).optional(),
  isHeader: z.boolean().optional().default(false), // Row is a header row
  cantSplit: z.boolean().optional().default(false), // Row cannot be split across pages
  // tblCellSpacing: NonNegativeIntSchema.optional(), // Spacing between cells in this row (if different from table)
}).strict();
export type TableRowProperties = z.infer<typeof TableRowPropertiesSchema>;

export const TableRowSchema = BaseModelSchema.extend({
  type: z.literal('tableRow'),
  children: z.array(TableCellSchema), // Array of table cells
  properties: TableRowPropertiesSchema.optional(),
}).strict();
export type TableRow = z.infer<typeof TableRowSchema>;

// --- Table Grid ---
export const TableGridColumnSchema = z.object({
  width: NonNegativeIntSchema, // Width of the grid column in Twips
}).strict();
export type TableGridColumn = z.infer<typeof TableGridColumnSchema>;

// --- Table Properties ---
export const TableLayoutEnum = z.enum(['fixed', 'autofit']);
export type TableLayout = z.infer<typeof TableLayoutEnum>;

export const TableFloatEnum = z.enum(['none', 'left', 'right', 'center']); // How table floats with text
export type TableFloat = z.infer<typeof TableFloatEnum>;

export const TablePropertiesSchema = z.object({
  styleId: NotEmptyStringSchema.optional(), // ID of the table style
  width: z.object({ value: NonNegativeIntSchema, type: z.enum(['dxa', 'pct', 'auto']).default('auto') }).optional(), // Table width
  alignment: AlignmentEnum.optional().default('left'), // Table alignment on page
  indent: NonNegativeIntSchema.optional(), // Table indentation from left
  borders: ParagraphBordersSchema.optional(), // Default borders for the table (can be overridden by cells)
  shading: ShadingPropertiesSchema.optional(), // Default shading for the table
  cellSpacing: NonNegativeIntSchema.optional().default(0), // Space between cells
  cellPadding: z.object({ // Default cell padding for the table
    top: NonNegativeIntSchema.optional(),
    bottom: NonNegativeIntSchema.optional(),
    left: NonNegativeIntSchema.optional(),
    right: NonNegativeIntSchema.optional(),
  }).optional(),
  layout: TableLayoutEnum.optional().default('autofit'),
  // look: z.string().optional(), // For conditional formatting (e.g., firstRow, lastColumn)
  float: TableFloatEnum.optional().default('none'),
  // Overlap, positioning properties for floating tables can be added later
}).strict();
export type TableProperties = z.infer<typeof TablePropertiesSchema>;

// --- Table Model ---
export const TableModelSchema = BaseModelSchema.extend({
  type: z.literal('table'),
  grid: z.array(TableGridColumnSchema).optional().default([]), // Defines column widths
  children: z.array(TableRowSchema), // Array of table rows
  properties: TablePropertiesSchema.optional(),
}).strict();
export type TableModel = z.infer<typeof TableModelSchema>;
