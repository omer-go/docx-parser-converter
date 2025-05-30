import { z } from 'zod';
import { ParagraphStylePropertiesSchema, RunStylePropertiesSchema } from './styles_models';

// Schema for Paragraph Numbering
export const NumberingSchema = z.object({
  ilvl: z.number(),
  numId: z.number(),
});

// Interface for Paragraph Numbering
export type Numbering = z.infer<typeof NumberingSchema>;

// Schema for Text Content
export const TextContentSchema = z.object({
  text: z.string(),
});

// Interface for Text Content
export type TextContent = z.infer<typeof TextContentSchema>;

// Schema for Tab Content
export const TabContentSchema = z.object({
  type: z.string().default('tab'),
});

// Interface for Tab Content
export type TabContent = z.infer<typeof TabContentSchema>;

// Schema for Run Content (Union of TextContent and TabContent)
export const RunContentSchema = z.object({
  run: z.union([TextContentSchema, TabContentSchema]),
});

// Interface for Run Content
export type RunContent = z.infer<typeof RunContentSchema>;

// Schema for Run
export const RunSchema = z.object({
  contents: z.array(RunContentSchema),
  properties: RunStylePropertiesSchema.optional(),
});

// Interface for Run
export type Run = z.infer<typeof RunSchema>;

// Schema for Paragraph
export const ParagraphSchema = z.object({
  properties: ParagraphStylePropertiesSchema,
  runs: z.array(RunSchema),
  numbering: NumberingSchema.optional(),
});

// Interface for Paragraph
export type Paragraph = z.infer<typeof ParagraphSchema>;
