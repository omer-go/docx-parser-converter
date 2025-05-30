import { z } from 'zod';
import { FontPropertiesSchema, IndentationPropertiesSchema } from './styles_models';

// Schema for Numbering Level
export const NumberingLevelSchema = z.object({
  numId: z.number(),
  ilvl: z.number(),
  start: z.number(),
  numFmt: z.string(),
  lvlText: z.string(),
  lvlJc: z.string(),
  counter: z.number().optional(),
  indent: IndentationPropertiesSchema.optional(),
  tab_pt: z.number().optional(),
  fonts: FontPropertiesSchema.optional(),
});

// Interface for Numbering Level
export type NumberingLevel = z.infer<typeof NumberingLevelSchema>;

// Schema for Numbering Instance
export const NumberingInstanceSchema = z.object({
  numId: z.number(),
  levels: z.array(NumberingLevelSchema),
});

// Interface for Numbering Instance
export type NumberingInstance = z.infer<typeof NumberingInstanceSchema>;

// Schema for Overall Numbering Schema
export const NumberingSchemaSchema = z.object({
  instances: z.array(NumberingInstanceSchema),
});

// Interface for Overall Numbering Schema
export type NumberingSchema = z.infer<typeof NumberingSchemaSchema>;
