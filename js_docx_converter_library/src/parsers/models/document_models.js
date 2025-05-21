import { z } from 'zod';

/**
 * Zod schema for document margins.
 * Corresponds to the DocMargins Pydantic model.
 */
export const DocMarginsSchema = z.object({
  top: z.number().int().nonnegative(),
  bottom: z.number().int().nonnegative(),
  left: z.number().int().nonnegative(),
  right: z.number().int().nonnegative(),
  header: z.number().int().nonnegative(),
  footer: z.number().int().nonnegative(),
  gutter: z.number().int().nonnegative(),
});

/**
 * Zod schema for the main document structure.
 * Corresponds to the DocumentSchema Pydantic model.
 * The 'elements' field will be refined in later stages to include specific
 * schemas for Paragraphs, Tables, etc.
 */
import { ParagraphSchema } from './paragraph_models.js';
import { TableSchema } from './table_models.js'; // Import the actual TableSchema

export const DocumentSchema = z.object({
  margins: DocMarginsSchema,
  elements: z.array(z.union([ParagraphSchema, TableSchema])), // Use actual ParagraphSchema and TableSchema
  // filename: z.string().optional(), // Will be added if needed at a higher level
});

// Example usage (not part of the library code, just for illustration)
// const exampleMargins = {
//   top: 1440,
//   bottom: 1440,
//   left: 1080,
//   right: 1080,
//   header: 720,
//   footer: 720,
//   gutter: 0,
// };

// const exampleDocument = {
//   margins: exampleMargins,
//   elements: [
//     { type: 'paragraph', content: 'Hello world' },
//     { type: 'table', rows: 2, cols: 3 },
//   ],
// };

// try {
//   DocMarginsSchema.parse(exampleMargins);
//   DocumentSchema.parse(exampleDocument);
//   console.log("Validation successful");
// } catch (error) {
//   console.error("Validation failed:", error.errors);
// }
