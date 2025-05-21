import { z } from 'zod';

import { RunPropertiesSchema, ParagraphPropertiesSchema, defaultRunProperties, defaultParagraphProperties } from './properties_models.js';

/**
 * Zod schema for a text run.
 * A run is a sequence of text with the same properties.
 * Corresponds to the Run Pydantic model.
 */
export const RunSchema = z.object({
  text: z.string(),
  properties: RunPropertiesSchema.default(defaultRunProperties),
});

/**
 * Zod schema for a paragraph.
 * A paragraph contains a list of runs and paragraph-level properties.
 * Corresponds to the Paragraph Pydantic model.
 */
export const ParagraphSchema = z.object({
  runs: z.array(RunSchema),
  properties: ParagraphPropertiesSchema.default(defaultParagraphProperties),
  type: z.literal('paragraph').default('paragraph'), // To distinguish from other element types
});

// Example Usage (for testing and illustration)
// const exampleRun = {
//   text: "Hello ",
//   properties: { bold: true } // This will pass due to passthrough
// };

// const exampleParagraph = {
//   runs: [
//     exampleRun,
//     { text: "World!", properties: {} }
//   ],
//   properties: { alignment: 'center' } // This will pass
// };

// try {
//   const validatedRun = RunSchema.parse(exampleRun);
//   const validatedParagraph = ParagraphSchema.parse(exampleParagraph);
//   console.log("Paragraph and Run validation successful:", validatedParagraph);
// } catch (error) {
//   console.error("Validation failed:", error.errors);
// }
