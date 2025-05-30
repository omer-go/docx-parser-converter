import { z } from 'zod';

import { TableModel } from './table_models';
import { ParagraphModel } from './paragraph_models';

// Placeholder types and schemas for Paragraph and Table
// These will be replaced with actual imports later
// type Paragraph = any; // Paragraph type will be inferred from ParagraphModel
// type Table = any; // Table type will be inferred from TableModel
// const ParagraphSchema = z.any(); // Replaced by import
// const TableSchema = z.any(); // Replaced by import

// Schema for Document Margins
export const DocMarginsModel = z.object({
  top_pt: z.number().optional(),
  right_pt: z.number().optional(),
  bottom_pt: z.number().optional(),
  left_pt: z.number().optional(),
  header_pt: z.number().optional(),
  footer_pt: z.number().optional(),
  gutter_pt: z.number().optional(),
});

// Interface for Document Margins
export type DocMargins = z.infer<typeof DocMarginsModel>;

// Schema for Document Structure
export const DocumentModel = z.object({
  elements: z.array(z.union([ParagraphModel, TableModel])),
  doc_margins: DocMarginsModel.optional(),
});

// Interface for Document Structure
export type DocumentSchema = z.infer<typeof DocumentModel>;
